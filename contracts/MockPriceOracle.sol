// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockPriceOracle
 * @dev Mock price oracle for testing VaultFlowLending contract
 */
contract MockPriceOracle {
    mapping(address => uint256) public prices;
    uint8 public constant PRICE_DECIMALS = 18;

    constructor() {
        // Set default prices for common tokens
        prices[address(0)] = 2000e18; // ETH = $2000
    }

    /**
     * @dev Set price for a token
     * @param token Token address
     * @param price Price in USD with 18 decimals
     */
    function setPrice(address token, uint256 price) external {
        prices[token] = price;
    }

    /**
     * @dev Get price for a token
     * @param token Token address
     * @return Price in USD with 18 decimals
     */
    function getPrice(address token) external view returns (uint256) {
        require(prices[token] > 0, "Price not set");
        return prices[token];
    }

    /**
     * @dev Get price decimals
     * @return Number of decimals for prices
     */
    function decimals() external pure returns (uint8) {
        return PRICE_DECIMALS;
    }
} 