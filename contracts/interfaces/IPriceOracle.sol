// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPriceOracle
 * @dev Interface for price oracle implementations
 */
interface IPriceOracle {
    /**
     * @dev Emitted when the price of an asset is updated
     * @param asset The address of the asset
     * @param price The new price
     * @param timestamp The timestamp of the price update
     */
    event PriceUpdated(address indexed asset, uint256 price, uint256 timestamp);

    /**
     * @dev Emitted when a new asset is added to the oracle
     * @param asset The address of the asset
     * @param priceFeed The address of the price feed
     */
    event AssetAdded(address indexed asset, address indexed priceFeed);

    /**
     * @dev Emitted when an asset is removed from the oracle
     * @param asset The address of the asset
     */
    event AssetRemoved(address indexed asset);

    /**
     * @dev Returns the price of an asset in USD with 8 decimals
     * @param asset The address of the asset
     * @return The price of the asset in USD with 8 decimals
     */
    function getPrice(address asset) external view returns (uint256);

    /**
     * @dev Returns the price of an asset in USD with 8 decimals and the timestamp
     * @param asset The address of the asset
     * @return price The price of the asset in USD with 8 decimals
     * @return timestamp The timestamp of the price
     */
    function getPriceAndTimestamp(address asset) external view returns (uint256 price, uint256 timestamp);

    /**
     * @dev Returns the price of an asset in USD with 8 decimals and additional data
     * @param asset The address of the asset
     * @return price The price of the asset in USD with 8 decimals
     * @return timestamp The timestamp of the price
     * @return roundId The round ID of the price feed
     * @return answeredInRound The round ID in which the answer was computed
     */
    function getPriceData(address asset) 
        external 
        view 
        returns (
            uint256 price,
            uint256 timestamp,
            uint80 roundId,
            uint80 answeredInRound
        );

    /**
     * @dev Returns the price of an asset in USD with 8 decimals from a specific round
     * @param asset The address of the asset
     * @param roundId The round ID to get the price from
     * @return The price of the asset in USD with 8 decimals
     */
    function getPriceFromRound(address asset, uint80 roundId) external view returns (uint256);

    /**
     * @dev Returns the latest round data for an asset
     * @param asset The address of the asset
     * @return roundId The round ID
     * @return answer The price answer
     * @return startedAt The timestamp when the round started
     * @return updatedAt The timestamp when the round was updated
     * @return answeredInRound The round ID in which the answer was computed
     */
    function getLatestRoundData(address asset)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    /**
     * @dev Returns the price feed address for an asset
     * @param asset The address of the asset
     * @return The address of the price feed
     */
    function getPriceFeed(address asset) external view returns (address);

    /**
     * @dev Returns whether an asset is supported by the oracle
     * @param asset The address of the asset
     * @return True if the asset is supported, false otherwise
     */
    function isAssetSupported(address asset) external view returns (bool);

    /**
     * @dev Returns the list of all supported assets
     * @return An array of supported asset addresses
     */
    function getSupportedAssets() external view returns (address[] memory);

    /**
     * @dev Returns the heartbeat interval for an asset
     * @param asset The address of the asset
     * @return The heartbeat interval in seconds
     */
    function getHeartbeat(address asset) external view returns (uint256);

    /**
     * @dev Returns the deviation threshold for an asset
     * @param asset The address of the asset
     * @return The deviation threshold in basis points
     */
    function getDeviationThreshold(address asset) external view returns (uint256);

    /**
     * @dev Returns the grace period for an asset
     * @param asset The address of the asset
     * @return The grace period in seconds
     */
    function getGracePeriod(address asset) external view returns (uint256);

    /**
     * @dev Returns the staleness threshold for an asset
     * @param asset The address of the asset
     * @return The staleness threshold in seconds
     */
    function getStalenessThreshold(address asset) external view returns (uint256);

    /**
     * @dev Checks if a price is stale
     * @param asset The address of the asset
     * @return True if the price is stale, false otherwise
     */
    function isPriceStale(address asset) external view returns (bool);

    /**
     * @dev Checks if a price deviation is within acceptable limits
     * @param asset The address of the asset
     * @param newPrice The new price to check
     * @return True if the deviation is acceptable, false otherwise
     */
    function isPriceDeviationAcceptable(address asset, uint256 newPrice) external view returns (bool);

    /**
     * @dev Returns the TWAP (Time-Weighted Average Price) for an asset
     * @param asset The address of the asset
     * @param period The time period for the TWAP calculation
     * @return The TWAP price
     */
    function getTWAP(address asset, uint256 period) external view returns (uint256);

    /**
     * @dev Returns the VWAP (Volume-Weighted Average Price) for an asset
     * @param asset The address of the asset
     * @param period The time period for the VWAP calculation
     * @return The VWAP price
     */
    function getVWAP(address asset, uint256 period) external view returns (uint256);

    /**
     * @dev Returns the price volatility for an asset
     * @param asset The address of the asset
     * @param period The time period for the volatility calculation
     * @return The price volatility
     */
    function getPriceVolatility(address asset, uint256 period) external view returns (uint256);

    /**
     * @dev Returns the price change percentage for an asset
     * @param asset The address of the asset
     * @param period The time period for the change calculation
     * @return The price change percentage in basis points
     */
    function getPriceChange(address asset, uint256 period) external view returns (int256);

    /**
     * @dev Returns the confidence interval for a price
     * @param asset The address of the asset
     * @return The confidence interval in basis points
     */
    function getPriceConfidence(address asset) external view returns (uint256);

    /**
     * @dev Returns the oracle version
     * @return The oracle version
     */
    function getOracleVersion() external view returns (uint256);

    /**
     * @dev Returns the oracle description
     * @return The oracle description
     */
    function getOracleDescription() external view returns (string memory);

    /**
     * @dev Returns the oracle decimals
     * @return The oracle decimals
     */
    function getOracleDecimals() external view returns (uint8);

    /**
     * @dev Returns the oracle address
     * @return The oracle address
     */
    function getOracleAddress() external view returns (address);

    /**
     * @dev Returns the fallback oracle address
     * @return The fallback oracle address
     */
    function getFallbackOracle() external view returns (address);

    /**
     * @dev Returns the emergency oracle address
     * @return The emergency oracle address
     */
    function getEmergencyOracle() external view returns (address);

    /**
     * @dev Returns whether the oracle is paused
     * @return True if the oracle is paused, false otherwise
     */
    function isPaused() external view returns (bool);

    /**
     * @dev Returns the pause guardian address
     * @return The pause guardian address
     */
    function getPauseGuardian() external view returns (address);

    /**
     * @dev Returns the admin address
     * @return The admin address
     */
    function getAdmin() external view returns (address);

    /**
     * @dev Returns the pending admin address
     * @return The pending admin address
     */
    function getPendingAdmin() external view returns (address);

    /**
     * @dev Returns the implementation address
     * @return The implementation address
     */
    function getImplementation() external view returns (address);

    /**
     * @dev Returns the proxy admin address
     * @return The proxy admin address
     */
    function getProxyAdmin() external view returns (address);
} 