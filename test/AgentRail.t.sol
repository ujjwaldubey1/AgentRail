// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentRail} from "../src/AgentRail.sol";
import {MockPayee} from "../src/MockPayee.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract RevertingPayee {
    receive() external payable {
        revert("NOPE");
    }
}

contract AgentRailTest is Test {
    AgentRail internal rail;
    MockPayee internal payee;
    MockERC20 internal token;

    address internal owner = makeAddr("owner");
    address internal agent = makeAddr("agent");
    address internal stranger = makeAddr("stranger");
    address internal injected = makeAddr("injected");

    uint256 internal constant PER_TX = 0.5 ether;
    uint256 internal constant DAILY = 2 ether;

    function setUp() public {
        payee = new MockPayee();
        token = new MockERC20();

        vm.prank(owner);
        rail = new AgentRail(owner, agent);

        vm.startPrank(owner);
        rail.setPolicy(PER_TX, DAILY, uint64(block.timestamp + 30 days));
        rail.setAllowedToken(address(0), true);
        rail.setAllowedToken(address(token), true);
        rail.setAllowedTarget(address(payee), true);
        vm.stopPrank();

        vm.deal(owner, 20 ether);
        vm.prank(owner);
        (bool funded,) = address(rail).call{value: 10 ether}("");
        require(funded);
    }

    function _intent(address to, uint256 amount, bytes32 actionId)
        internal
        view
        returns (AgentRail.Intent memory)
    {
        return AgentRail.Intent({
            to: to,
            token: address(0),
            amount: amount,
            data: "",
            deadline: uint64(block.timestamp + 1 hours),
            actionId: actionId
        });
    }

    function test_happyPath_nativePay() public {
        AgentRail.Intent memory intent = _intent(address(payee), 0.1 ether, keccak256("pay-1"));

        (bool simOk, bytes32 simReason) = rail.simulate(intent);
        assertTrue(simOk);
        assertEq(simReason, rail.REASON_OK());

        uint256 beforePayee = address(payee).balance;
        uint256 beforeVault = address(rail).balance;

        vm.prank(agent);
        bool allowed = rail.proposeAndExecute(intent);

        assertTrue(allowed);
        assertEq(address(payee).balance, beforePayee + 0.1 ether);
        assertEq(address(rail).balance, beforeVault - 0.1 ether);
        assertTrue(rail.usedActionId(keccak256("pay-1")));
    }

    function test_block_perTxCap() public {
        AgentRail.Intent memory intent = _intent(address(payee), 1 ether, keccak256("drain"));

        (bool simOk, bytes32 reason) = rail.simulate(intent);
        assertFalse(simOk);
        assertEq(reason, rail.REASON_CAP());

        uint256 vaultBefore = address(rail).balance;
        vm.prank(agent);
        bool allowed = rail.proposeAndExecute(intent);

        assertFalse(allowed);
        assertEq(address(rail).balance, vaultBefore);
        assertFalse(rail.usedActionId(keccak256("drain")));
    }

    function test_block_unknownTarget_promptInjection() public {
        AgentRail.Intent memory intent = _intent(injected, 0.1 ether, keccak256("inject"));

        (bool simOk, bytes32 reason) = rail.simulate(intent);
        assertFalse(simOk);
        assertEq(reason, rail.REASON_TARGET());

        uint256 vaultBefore = address(rail).balance;
        uint256 injectedBefore = injected.balance;

        vm.prank(agent);
        bool allowed = rail.proposeAndExecute(intent);

        assertFalse(allowed);
        assertEq(address(rail).balance, vaultBefore);
        assertEq(injected.balance, injectedBefore);
    }

    function test_block_replay() public {
        AgentRail.Intent memory intent = _intent(address(payee), 0.1 ether, keccak256("once"));
        vm.prank(agent);
        assertTrue(rail.proposeAndExecute(intent));

        vm.prank(agent);
        bool second = rail.proposeAndExecute(intent);
        assertFalse(second);
        (bool ok, bytes32 reason) = rail.simulate(intent);
        assertFalse(ok);
        assertEq(reason, rail.REASON_REPLAY());
    }

    function test_pause_blocksAgent() public {
        vm.prank(owner);
        rail.setPaused(true);

        AgentRail.Intent memory intent = _intent(address(payee), 0.1 ether, keccak256("paused"));
        (bool ok, bytes32 reason) = rail.simulate(intent);
        assertFalse(ok);
        assertEq(reason, rail.REASON_PAUSED());

        vm.prank(agent);
        assertFalse(rail.proposeAndExecute(intent));
        assertEq(address(rail).balance, 10 ether);
    }

    function test_nonAgent_reverts() public {
        AgentRail.Intent memory intent = _intent(address(payee), 0.1 ether, keccak256("stranger"));
        vm.prank(stranger);
        vm.expectRevert(AgentRail.Unauthorized.selector);
        rail.proposeAndExecute(intent);
    }

    function test_dailyCap() public {
        // 4 x 0.5 ether = 2 ether daily cap, 5th fails
        for (uint256 i = 0; i < 4; i++) {
            AgentRail.Intent memory intent =
                _intent(address(payee), 0.5 ether, keccak256(abi.encodePacked("d", i)));
            vm.prank(agent);
            assertTrue(rail.proposeAndExecute(intent));
        }
        AgentRail.Intent memory over =
            _intent(address(payee), 0.5 ether, keccak256("d-over"));
        (bool ok, bytes32 reason) = rail.simulate(over);
        assertFalse(ok);
        assertEq(reason, rail.REASON_DAILY());
        vm.prank(agent);
        assertFalse(rail.proposeAndExecute(over));
        assertEq(rail.remainingDailyCap(), 0);
    }

    function test_selector_required_whenDataPresent() public {
        AgentRail.Intent memory intent = _intent(address(payee), 0.1 ether, keccak256("sel"));
        intent.data = abi.encodeWithSignature("ping()");

        (bool ok, bytes32 reason) = rail.simulate(intent);
        assertFalse(ok);
        assertEq(reason, rail.REASON_SELECTOR());

        vm.prank(owner);
        rail.setAllowedSelector(MockPayee.ping.selector, true);

        (ok, reason) = rail.simulate(intent);
        assertTrue(ok);

        vm.prank(agent);
        assertTrue(rail.proposeAndExecute(intent));
    }

    function test_erc20_transfer() public {
        token.mint(owner, 100 ether);
        vm.startPrank(owner);
        token.approve(address(rail), 40 ether);
        rail.depositERC20(address(token), 40 ether);
        vm.stopPrank();

        AgentRail.Intent memory intent = AgentRail.Intent({
            to: address(payee),
            token: address(token),
            amount: 0.25 ether,
            data: "",
            deadline: uint64(block.timestamp + 1 hours),
            actionId: keccak256("erc20")
        });

        vm.prank(agent);
        assertTrue(rail.proposeAndExecute(intent));
        assertEq(token.balanceOf(address(payee)), 0.25 ether);
    }

    function test_owner_withdraw() public {
        uint256 before = owner.balance;
        vm.prank(owner);
        rail.withdraw(address(0), owner, 1 ether);
        assertEq(owner.balance, before + 1 ether);
        assertEq(address(rail).balance, 9 ether);
    }

    function test_callFail_doesNotMoveFunds() public {
        RevertingPayee bad = new RevertingPayee();
        vm.prank(owner);
        rail.setAllowedTarget(address(bad), true);

        AgentRail.Intent memory intent = _intent(address(bad), 0.1 ether, keccak256("fail"));
        uint256 vaultBefore = address(rail).balance;

        vm.prank(agent);
        bool allowed = rail.proposeAndExecute(intent);
        assertFalse(allowed);
        assertEq(address(rail).balance, vaultBefore);
        assertEq(rail.remainingDailyCap(), DAILY);
        assertTrue(rail.usedActionId(keccak256("fail")));
    }

    function test_policyExpiry() public {
        vm.prank(owner);
        rail.setPolicy(PER_TX, DAILY, uint64(block.timestamp + 1));
        vm.warp(block.timestamp + 2);

        AgentRail.Intent memory intent = _intent(address(payee), 0.1 ether, keccak256("late"));
        (bool ok, bytes32 reason) = rail.simulate(intent);
        assertFalse(ok);
        assertEq(reason, rail.REASON_EXPIRED());
    }

    function test_constructor_rejectsSameOwnerAgent() public {
        vm.expectRevert(AgentRail.Unauthorized.selector);
        new AgentRail(owner, owner);
    }
}
