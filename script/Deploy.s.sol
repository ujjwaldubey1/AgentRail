// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AgentRail} from "../src/AgentRail.sol";
import {MockPayee} from "../src/MockPayee.sol";

/// @notice Deploy AgentRail to BOT Chain testnet (chain id 968).
/// @dev Example:
///   forge script script/Deploy.s.sol:Deploy --rpc-url bot_testnet --broadcast --private-key $env:PRIVATE_KEY
contract Deploy is Script {
    function run() external {
        address agent = vm.envAddress("AGENT_ADDRESS");
        uint256 perTx = vm.envOr("PER_TX_CAP_WEI", uint256(0.5 ether));
        uint256 daily = vm.envOr("DAILY_CAP_WEI", uint256(2 ether));
        uint64 expiry = uint64(block.timestamp + 30 days);

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address owner = vm.addr(deployerKey);

        require(owner != agent, "owner and agent must be different wallets");

        vm.startBroadcast(deployerKey);

        AgentRail rail = new AgentRail(owner, agent);
        rail.setPolicy(perTx, daily, expiry);
        rail.setAllowedToken(address(0), true); // native BOT

        address payee = vm.envOr("PAYEE_ADDRESS", address(0));
        if (payee == address(0)) {
            payee = address(new MockPayee());
            console2.log("MockPayee", payee);
        }
        rail.setAllowedTarget(payee, true);

        vm.stopBroadcast();

        console2.log("Owner     ", owner);
        console2.log("Agent     ", agent);
        console2.log("AgentRail ", address(rail));
        console2.log("Payee     ", payee);
        console2.log("perTxCap  ", perTx);
        console2.log("dailyCap  ", daily);
        console2.log("Next: send BOT to AgentRail, then agent calls proposeAndExecute.");
        console2.log("Explorer: https://scan.bohr.life/address/%s", address(rail));
    }
}
