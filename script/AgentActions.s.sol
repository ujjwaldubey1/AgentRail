// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AgentRail} from "../src/AgentRail.sol";

/// @notice Run one demo intent as the agent.
/// @dev ACTION=allow | cap | inject
contract AgentActions is Script {
    function run() external {
        AgentRail rail = AgentRail(payable(vm.envAddress("RAIL_ADDRESS")));
        uint256 agentKey = vm.envUint("AGENT_PRIVATE_KEY");
        address payee = vm.envAddress("PAYEE_ADDRESS");
        string memory action = vm.envOr("ACTION", string("allow"));

        AgentRail.Intent memory intent;
        intent.token = address(0);
        intent.data = "";
        intent.deadline = uint64(block.timestamp + 1 hours);
        intent.actionId = keccak256(abi.encodePacked(action, block.timestamp));

        if (_eq(action, "allow")) {
            intent.to = payee;
            intent.amount = 0.1 ether;
        } else if (_eq(action, "cap")) {
            intent.to = payee;
            intent.amount = 1000 ether;
        } else if (_eq(action, "inject")) {
            intent.to = vm.addr(uint256(keccak256("attacker")));
            intent.amount = 0.1 ether;
        } else {
            revert("ACTION must be allow, cap, or inject");
        }

        (bool simOk, bytes32 reason) = rail.simulate(intent);
        console2.log("simulate allowed", simOk);
        console2.logBytes32(reason);

        vm.startBroadcast(agentKey);
        bool executed = rail.proposeAndExecute(intent);
        vm.stopBroadcast();

        console2.log("executed allowed", executed);
        console2.log("actionId");
        console2.logBytes32(intent.actionId);
    }

    function _eq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
