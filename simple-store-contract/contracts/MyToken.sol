// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

contract MyToken {
    string public name;
    string public symbol;

    uint8 public decimals;
    uint256 public totalSupply;

    event Transfer();
    

    function transfer(address to, uint256 amount) public {
        Transfer()
    }
}