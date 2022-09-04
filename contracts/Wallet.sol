// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error Wallet__NotOwner();

contract Wallet {
    // Type Declarations
    using PriceConverter for uint256;

    address private immutable owner;
    uint256 private balance = 0;
    uint256 private constant MIN_USD = 50 * 10**9;
    mapping(address => uint256) private sendersAddress;
    AggregatorV3Interface private priceFeed;

    constructor(address priceFeedAddress) {
        owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    fallback() external payable {
        fund();
    }

    receive() external payable {
        fund();
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Wallet__NotOwner();
        }
        _;
    }

    function fund() public payable {
        require(
            msg.value.getPriceInUSD(priceFeed) >= MIN_USD,
            "You need to spend more ETH!"
        );
        sendersAddress[msg.sender] += msg.value;
        balance += msg.value;
    }

    function withdraw(uint256 _amount) public onlyOwner {
        if (_amount > balance) {
            revert("Balance is low !!");
        } else {
            (bool sent, ) = owner.call{value: _amount}("");
            require(sent, "Transaction Failed!!");
            balance -= _amount;
        }
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return priceFeed;
    }

    function getBalance() public view returns (uint256) {
        return balance;
    }

    function getAmountByAddress(address _address)
        public
        view
        returns (uint256)
    {
        return sendersAddress[_address];
    }
}
