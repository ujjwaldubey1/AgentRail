// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Simple allowlisted recipient for the native BOT demo.
contract MockPayee {
    event Paid(address indexed from, uint256 amount);

    receive() external payable {
        emit Paid(msg.sender, msg.value);
    }

    function ping() external payable {
        emit Paid(msg.sender, msg.value);
    }
}
