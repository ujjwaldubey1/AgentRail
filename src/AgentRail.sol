// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AgentRail
/// @notice Simulate → Policy → Execute → Verify control plane for AI agents on BOT Chain.
/// @dev Funds sit in this contract. The agent never holds the treasury. Policy failures
///      emit a Decision and return false instead of reverting, so blocked attempts stay
///      on-chain. Unauthorized callers still revert.
contract AgentRail {
    // -------------------------------------------------------------------------
    // Types
    // -------------------------------------------------------------------------

    struct Intent {
        address to;
        address token; // address(0) = native BOT
        uint256 amount;
        bytes data;
        uint64 deadline;
        bytes32 actionId;
    }

    // -------------------------------------------------------------------------
    // Errors / reasons
    // -------------------------------------------------------------------------

    error Unauthorized();
    error ZeroAddress();
    error InvalidPolicy();
    error TransferFailed();

    bytes32 public constant REASON_OK = "OK";
    bytes32 public constant REASON_PAUSED = "PAUSED";
    bytes32 public constant REASON_EXPIRED = "EXPIRED";
    bytes32 public constant REASON_DEADLINE = "DEADLINE";
    bytes32 public constant REASON_REPLAY = "REPLAY";
    bytes32 public constant REASON_TOKEN = "TOKEN";
    bytes32 public constant REASON_TARGET = "TARGET";
    bytes32 public constant REASON_SELECTOR = "SELECTOR";
    bytes32 public constant REASON_CAP = "CAP";
    bytes32 public constant REASON_DAILY = "DAILY";
    bytes32 public constant REASON_CALL_FAIL = "CALL_FAIL";

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    address public owner;
    address public agent;

    uint64 public policyVersion;
    uint256 public perTxCap;
    uint256 public dailyCap;
    uint64 public expiry; // unix seconds; 0 = no expiry
    bool public paused;

    mapping(address => bool) public allowedToken;
    mapping(address => bool) public allowedTarget;
    mapping(bytes4 => bool) public allowedSelector;

    mapping(bytes32 => bool) public usedActionId;

    /// @notice UTC-day bucket (`block.timestamp / 1 days`) currently accumulating spend.
    uint64 public spendDay;
    uint256 public spentToday;

    uint256 private _locked;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event Decision(
        bytes32 indexed actionId,
        address indexed caller,
        address indexed to,
        bool allowed,
        bytes32 reason,
        address token,
        uint256 amount,
        uint64 policyVersion
    );

    event OwnerUpdated(address indexed previous, address indexed current);
    event AgentUpdated(address indexed previous, address indexed current);
    event PolicyUpdated(uint64 indexed version, uint256 perTxCap, uint256 dailyCap, uint64 expiry);
    event TokenAllowlist(address indexed token, bool allowed);
    event TargetAllowlist(address indexed target, bool allowed);
    event SelectorAllowlist(bytes4 indexed selector, bool allowed);
    event PauseSet(bool paused);
    event Deposited(address indexed from, address indexed token, uint256 amount);
    event Withdrawn(address indexed to, address indexed token, uint256 amount);

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier nonReentrant() {
        require(_locked == 0, "REENTRANCY");
        _locked = 1;
        _;
        _locked = 0;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address owner_, address agent_) {
        if (owner_ == address(0) || agent_ == address(0)) revert ZeroAddress();
        if (owner_ == agent_) revert Unauthorized();
        owner = owner_;
        agent = agent_;
        emit OwnerUpdated(address(0), owner_);
        emit AgentUpdated(address(0), agent_);
    }

    receive() external payable {
        emit Deposited(msg.sender, address(0), msg.value);
    }

    // -------------------------------------------------------------------------
    // Owner admin
    // -------------------------------------------------------------------------

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0) || newOwner == agent) revert ZeroAddress();
        emit OwnerUpdated(owner, newOwner);
        owner = newOwner;
    }

    function setAgent(address newAgent) external onlyOwner {
        if (newAgent == address(0) || newAgent == owner) revert ZeroAddress();
        emit AgentUpdated(agent, newAgent);
        agent = newAgent;
    }

    function setPolicy(uint256 perTxCap_, uint256 dailyCap_, uint64 expiry_) external onlyOwner {
        if (perTxCap_ == 0 || dailyCap_ == 0 || perTxCap_ > dailyCap_) revert InvalidPolicy();
        perTxCap = perTxCap_;
        dailyCap = dailyCap_;
        expiry = expiry_;
        unchecked {
            policyVersion += 1;
        }
        emit PolicyUpdated(policyVersion, perTxCap_, dailyCap_, expiry_);
    }

    function setAllowedToken(address token, bool allowed) external onlyOwner {
        allowedToken[token] = allowed;
        emit TokenAllowlist(token, allowed);
    }

    function setAllowedTarget(address target, bool allowed) external onlyOwner {
        if (target == address(0)) revert ZeroAddress();
        allowedTarget[target] = allowed;
        emit TargetAllowlist(target, allowed);
    }

    function setAllowedSelector(bytes4 selector, bool allowed) external onlyOwner {
        allowedSelector[selector] = allowed;
        emit SelectorAllowlist(selector, allowed);
    }

    function setPaused(bool paused_) external onlyOwner {
        paused = paused_;
        emit PauseSet(paused_);
    }

    function withdraw(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        _transfer(token, to, amount, "");
        emit Withdrawn(to, token, amount);
    }

    /// @notice Pull ERC-20 into the vault. Native BOT is deposited via `receive`.
    function depositERC20(address token, uint256 amount) external nonReentrant {
        if (token == address(0) || amount == 0) revert ZeroAddress();
        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!ok) revert TransferFailed();
        emit Deposited(msg.sender, token, amount);
    }

    // -------------------------------------------------------------------------
    // Agent execution
    // -------------------------------------------------------------------------

    /// @notice Agent entrypoint. Policy misses emit Decision(false) and return false.
    ///         Only a non-agent caller reverts.
    function proposeAndExecute(Intent calldata intent) external nonReentrant returns (bool allowed) {
        if (msg.sender != agent) revert Unauthorized();

        bytes32 reason = _checkPolicy(intent);
        if (reason != REASON_OK) {
            emit Decision(
                intent.actionId,
                msg.sender,
                intent.to,
                false,
                reason,
                intent.token,
                intent.amount,
                policyVersion
            );
            return false;
        }

        // Consume id + budget before the external call.
        usedActionId[intent.actionId] = true;
        uint64 day = _utcDay();
        if (spendDay != day) {
            spendDay = day;
            spentToday = intent.amount;
        } else {
            spentToday += intent.amount;
        }

        bool ok = _transfer(intent.token, intent.to, intent.amount, intent.data);
        if (!ok) {
            spentToday -= intent.amount;
            emit Decision(
                intent.actionId,
                msg.sender,
                intent.to,
                false,
                REASON_CALL_FAIL,
                intent.token,
                intent.amount,
                policyVersion
            );
            return false;
        }

        emit Decision(
            intent.actionId,
            msg.sender,
            intent.to,
            true,
            REASON_OK,
            intent.token,
            intent.amount,
            policyVersion
        );
        return true;
    }

    /// @notice Dry-run the same policy used on-chain. Off-chain simulators should call this
    ///         via `eth_call` before submitting `proposeAndExecute`.
    function simulate(Intent calldata intent) external view returns (bool allowed, bytes32 reason) {
        reason = _checkPolicy(intent);
        allowed = reason == REASON_OK;
    }

    function remainingDailyCap() public view returns (uint256) {
        if (dailyCap == 0) return 0;
        if (spendDay != _utcDay()) return dailyCap;
        if (spentToday >= dailyCap) return 0;
        return dailyCap - spentToday;
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    function _checkPolicy(Intent calldata intent) internal view returns (bytes32) {
        if (paused) return REASON_PAUSED;
        if (expiry != 0 && block.timestamp > expiry) return REASON_EXPIRED;
        if (intent.deadline != 0 && block.timestamp > intent.deadline) return REASON_DEADLINE;
        if (intent.actionId == bytes32(0) || usedActionId[intent.actionId]) return REASON_REPLAY;
        if (!allowedToken[intent.token]) return REASON_TOKEN;
        if (intent.to == address(0) || !allowedTarget[intent.to]) return REASON_TARGET;

        if (intent.data.length > 0) {
            if (intent.data.length < 4) return REASON_SELECTOR;
            bytes4 sel;
            bytes memory data = intent.data;
            assembly {
                sel := mload(add(data, 32))
            }
            if (!allowedSelector[sel]) return REASON_SELECTOR;
        }

        if (intent.amount == 0 || intent.amount > perTxCap) return REASON_CAP;
        if (intent.amount > remainingDailyCap()) return REASON_DAILY;
        return REASON_OK;
    }

    function _utcDay() internal view returns (uint64) {
        return uint64(block.timestamp / 1 days);
    }

    function _transfer(address token, address to, uint256 amount, bytes memory data)
        internal
        returns (bool)
    {
        if (token == address(0)) {
            (bool ok,) = to.call{value: amount}(data);
            return ok;
        }
        // ERC-20: value transfer, then optional notify call on `to`.
        try IERC20(token).transfer(to, amount) returns (bool sent) {
            if (!sent) return false;
        } catch {
            return false;
        }
        if (data.length == 0) return true;
        (bool called,) = to.call(data);
        return called;
    }
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
