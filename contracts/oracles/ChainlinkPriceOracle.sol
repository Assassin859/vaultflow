// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorValidatorInterface.sol";

import "../interfaces/IPriceOracle.sol";

/**
 * @title ChainlinkPriceOracle
 * @dev Price oracle implementation using Chainlink price feeds with fallback mechanisms
 */
contract ChainlinkPriceOracle is
    Initializable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    IPriceOracle
{
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    // State variables
    mapping(address => address) private _priceFeeds;
    mapping(address => uint256) private _heartbeats;
    mapping(address => uint256) private _deviationThresholds;
    mapping(address => uint256) private _gracePeriods;
    mapping(address => uint256) private _stalenessThresholds;
    mapping(address => uint256) private _lastPrices;
    mapping(address => uint256) private _lastUpdateTimestamps;
    mapping(address => uint256) private _priceConfidence;
    mapping(address => uint256[]) private _priceHistory;
    mapping(address => uint256) private _priceHistoryIndex;
    mapping(address => uint256) private _maxPriceHistoryLength;

    address private _fallbackOracle;
    address private _emergencyOracle;
    address private _pauseGuardian;
    address private _admin;
    address private _pendingAdmin;
    address private _implementation;
    address private _proxyAdmin;

    uint256 private _oracleVersion;
    string private _oracleDescription;
    uint8 private _oracleDecimals;
    uint256 private _maxPriceDeviation;
    uint256 private _minPriceDeviation;
    uint256 private _defaultHeartbeat;
    uint256 private _defaultDeviationThreshold;
    uint256 private _defaultGracePeriod;
    uint256 private _defaultStalenessThreshold;
    uint256 private _defaultPriceConfidence;
    uint256 private _defaultMaxPriceHistoryLength;

    // Events
    event PriceFeedUpdated(address indexed asset, address indexed priceFeed);
    event HeartbeatUpdated(address indexed asset, uint256 heartbeat);
    event DeviationThresholdUpdated(address indexed asset, uint256 threshold);
    event GracePeriodUpdated(address indexed asset, uint256 period);
    event StalenessThresholdUpdated(address indexed asset, uint256 threshold);
    event PriceConfidenceUpdated(address indexed asset, uint256 confidence);
    event MaxPriceHistoryLengthUpdated(address indexed asset, uint256 length);
    event FallbackOracleUpdated(address indexed oldOracle, address indexed newOracle);
    event EmergencyOracleUpdated(address indexed oldOracle, address indexed newOracle);
    event PriceValidated(address indexed asset, uint256 price, uint256 timestamp, bool isValid);

    // Modifiers
    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "ChainlinkPriceOracle: caller is not admin");
        _;
    }

    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "ChainlinkPriceOracle: caller is not operator");
        _;
    }

    modifier onlyValidator() {
        require(hasRole(VALIDATOR_ROLE, msg.sender), "ChainlinkPriceOracle: caller is not validator");
        _;
    }

    modifier onlyPauseGuardian() {
        require(msg.sender == _pauseGuardian, "ChainlinkPriceOracle: caller is not pause guardian");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the ChainlinkPriceOracle
     * @param admin The address of the admin
     * @param pauseGuardian The address of the pause guardian
     */
    function initialize(address admin, address pauseGuardian) public initializer {
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _admin = admin;
        _pauseGuardian = pauseGuardian;
        _oracleVersion = 1;
        _oracleDescription = "Chainlink Price Oracle for DeFi Lending Protocol";
        _oracleDecimals = 8;
        _maxPriceDeviation = 5000; // 50%
        _minPriceDeviation = 100; // 1%
        _defaultHeartbeat = 3600; // 1 hour
        _defaultDeviationThreshold = 1000; // 10%
        _defaultGracePeriod = 300; // 5 minutes
        _defaultStalenessThreshold = 3600; // 1 hour
        _defaultPriceConfidence = 9500; // 95%
        _defaultMaxPriceHistoryLength = 100;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        _grantRole(VALIDATOR_ROLE, admin);
    }

    /**
     * @dev Gets the price of an asset in USD with 8 decimals
     * @param asset The address of the asset
     * @return The price of the asset in USD with 8 decimals
     */
    function getPrice(address asset) external view override returns (uint256) {
        require(_priceFeeds[asset] != address(0), "ChainlinkPriceOracle: price feed not found");
        require(!paused(), "ChainlinkPriceOracle: oracle is paused");

        // Try to get price from Chainlink
        try this._getChainlinkPrice(asset) returns (uint256 price) {
            return price;
        } catch {
            // Fallback to last known price
            require(_lastPrices[asset] > 0, "ChainlinkPriceOracle: no fallback price available");
            return _lastPrices[asset];
        }
    }

    /**
     * @dev Gets the price and timestamp of an asset
     * @param asset The address of the asset
     * @return price The price of the asset in USD with 8 decimals
     * @return timestamp The timestamp of the price
     */
    function getPriceAndTimestamp(address asset) external view override returns (uint256 price, uint256 timestamp) {
        require(_priceFeeds[asset] != address(0), "ChainlinkPriceOracle: price feed not found");
        require(!paused(), "ChainlinkPriceOracle: oracle is paused");

        try this._getChainlinkPriceAndTimestamp(asset) returns (uint256 p, uint256 t) {
            return (p, t);
        } catch {
            require(_lastPrices[asset] > 0, "ChainlinkPriceOracle: no fallback price available");
            return (_lastPrices[asset], _lastUpdateTimestamps[asset]);
        }
    }

    /**
     * @dev Gets the price data of an asset
     * @param asset The address of the asset
     * @return price The price of the asset in USD with 8 decimals
     * @return timestamp The timestamp of the price
     * @return roundId The round ID of the price feed
     * @return answeredInRound The round ID in which the answer was computed
     */
    function getPriceData(address asset)
        external
        view
        override
        returns (
            uint256 price,
            uint256 timestamp,
            uint80 roundId,
            uint80 answeredInRound
        )
    {
        require(_priceFeeds[asset] != address(0), "ChainlinkPriceOracle: price feed not found");
        require(!paused(), "ChainlinkPriceOracle: oracle is paused");

        AggregatorV3Interface priceFeed = AggregatorV3Interface(_priceFeeds[asset]);
        (
            uint80 round,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredIn
        ) = priceFeed.latestRoundData();

        require(answer > 0, "ChainlinkPriceOracle: invalid price");
        require(updatedAt > 0, "ChainlinkPriceOracle: invalid timestamp");
        require(answeredIn >= round, "ChainlinkPriceOracle: stale price");

        return (uint256(answer), updatedAt, round, answeredIn);
    }

    /**
     * @dev Gets the price from a specific round
     * @param asset The address of the asset
     * @param roundId The round ID to get the price from
     * @return The price of the asset in USD with 8 decimals
     */
    function getPriceFromRound(address asset, uint80 roundId) external view override returns (uint256) {
        require(_priceFeeds[asset] != address(0), "ChainlinkPriceOracle: price feed not found");
        require(!paused(), "ChainlinkPriceOracle: oracle is paused");

        AggregatorV3Interface priceFeed = AggregatorV3Interface(_priceFeeds[asset]);
        (
            ,
            int256 answer,
            ,
            ,
        ) = priceFeed.getRoundData(roundId);

        require(answer > 0, "ChainlinkPriceOracle: invalid price");
        return uint256(answer);
    }

    /**
     * @dev Gets the latest round data for an asset
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
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        require(_priceFeeds[asset] != address(0), "ChainlinkPriceOracle: price feed not found");
        require(!paused(), "ChainlinkPriceOracle: oracle is paused");

        AggregatorV3Interface priceFeed = AggregatorV3Interface(_priceFeeds[asset]);
        return priceFeed.latestRoundData();
    }

    /**
     * @dev Gets the price feed address for an asset
     * @param asset The address of the asset
     * @return The address of the price feed
     */
    function getPriceFeed(address asset) external view override returns (address) {
        return _priceFeeds[asset];
    }

    /**
     * @dev Returns whether an asset is supported by the oracle
     * @param asset The address of the asset
     * @return True if the asset is supported, false otherwise
     */
    function isAssetSupported(address asset) external view override returns (bool) {
        return _priceFeeds[asset] != address(0);
    }

    /**
     * @dev Returns the list of all supported assets
     * @return An array of supported asset addresses
     */
    function getSupportedAssets() external view override returns (address[] memory) {
        // This would need to be implemented with a separate array to track supported assets
        // For now, return empty array
        return new address[](0);
    }

    /**
     * @dev Returns the heartbeat interval for an asset
     * @param asset The address of the asset
     * @return The heartbeat interval in seconds
     */
    function getHeartbeat(address asset) external view override returns (uint256) {
        return _heartbeats[asset] > 0 ? _heartbeats[asset] : _defaultHeartbeat;
    }

    /**
     * @dev Returns the deviation threshold for an asset
     * @param asset The address of the asset
     * @return The deviation threshold in basis points
     */
    function getDeviationThreshold(address asset) external view override returns (uint256) {
        return _deviationThresholds[asset] > 0 ? _deviationThresholds[asset] : _defaultDeviationThreshold;
    }

    /**
     * @dev Returns the grace period for an asset
     * @param asset The address of the asset
     * @return The grace period in seconds
     */
    function getGracePeriod(address asset) external view override returns (uint256) {
        return _gracePeriods[asset] > 0 ? _gracePeriods[asset] : _defaultGracePeriod;
    }

    /**
     * @dev Returns the staleness threshold for an asset
     * @param asset The address of the asset
     * @return The staleness threshold in seconds
     */
    function getStalenessThreshold(address asset) external view override returns (uint256) {
        return _stalenessThresholds[asset] > 0 ? _stalenessThresholds[asset] : _defaultStalenessThreshold;
    }

    /**
     * @dev Checks if a price is stale
     * @param asset The address of the asset
     * @return True if the price is stale, false otherwise
     */
    function isPriceStale(address asset) external view override returns (bool) {
        uint256 lastUpdate = _lastUpdateTimestamps[asset];
        uint256 stalenessThreshold = _stalenessThresholds[asset] > 0 ? _stalenessThresholds[asset] : _defaultStalenessThreshold;
        return block.timestamp > lastUpdate + stalenessThreshold;
    }

    /**
     * @dev Checks if a price deviation is within acceptable limits
     * @param asset The address of the asset
     * @param newPrice The new price to check
     * @return True if the deviation is acceptable, false otherwise
     */
    function isPriceDeviationAcceptable(address asset, uint256 newPrice) external view override returns (bool) {
        uint256 lastPrice = _lastPrices[asset];
        if (lastPrice == 0) return true;

        uint256 deviationThreshold = _deviationThresholds[asset] > 0 ? _deviationThresholds[asset] : _defaultDeviationThreshold;
        uint256 deviation = _calculateDeviation(lastPrice, newPrice);
        return deviation <= deviationThreshold;
    }

    /**
     * @dev Returns the TWAP for an asset
     * @param asset The address of the asset
     * @param period The time period for the TWAP calculation
     * @return The TWAP price
     */
    function getTWAP(address asset, uint256 period) external view override returns (uint256) {
        require(_priceHistory[asset].length > 0, "ChainlinkPriceOracle: no price history");
        
        uint256 totalPrice = 0;
        uint256 count = 0;
        uint256 startTime = block.timestamp - period;
        
        for (uint256 i = 0; i < _priceHistory[asset].length; i++) {
            if (_lastUpdateTimestamps[asset] >= startTime) {
                totalPrice += _priceHistory[asset][i];
                count++;
            }
        }
        
        require(count > 0, "ChainlinkPriceOracle: no prices in period");
        return totalPrice / count;
    }

    /**
     * @dev Returns the VWAP for an asset
     * @param asset The address of the asset
     * @param period The time period for the VWAP calculation
     * @return The VWAP price
     */
    function getVWAP(address asset, uint256 period) external view override returns (uint256) {
        // Implementation would require volume data
        // For now, return TWAP
        return this.getTWAP(asset, period);
    }

    /**
     * @dev Returns the price volatility for an asset
     * @param asset The address of the asset
     * @param period The time period for the volatility calculation
     * @return The price volatility
     */
    function getPriceVolatility(address asset, uint256 period) external view override returns (uint256) {
        require(_priceHistory[asset].length > 1, "ChainlinkPriceOracle: insufficient price history");
        
        uint256 totalSquaredDiff = 0;
        uint256 count = 0;
        uint256 startTime = block.timestamp - period;
        
        for (uint256 i = 1; i < _priceHistory[asset].length; i++) {
            if (_lastUpdateTimestamps[asset] >= startTime) {
                uint256 diff = _priceHistory[asset][i] > _priceHistory[asset][i-1] 
                    ? _priceHistory[asset][i] - _priceHistory[asset][i-1]
                    : _priceHistory[asset][i-1] - _priceHistory[asset][i];
                totalSquaredDiff += diff * diff;
                count++;
            }
        }
        
        require(count > 0, "ChainlinkPriceOracle: no prices in period");
        return totalSquaredDiff / count;
    }

    /**
     * @dev Returns the price change percentage for an asset
     * @param asset The address of the asset
     * @param period The time period for the change calculation
     * @return The price change percentage in basis points
     */
    function getPriceChange(address asset, uint256 period) external view override returns (int256) {
        require(_priceHistory[asset].length > 0, "ChainlinkPriceOracle: no price history");
        
        uint256 currentPrice = _lastPrices[asset];
        uint256 startTime = block.timestamp - period;
        uint256 oldPrice = currentPrice;
        
        for (uint256 i = _priceHistory[asset].length - 1; i >= 0; i--) {
            if (_lastUpdateTimestamps[asset] <= startTime) {
                oldPrice = _priceHistory[asset][i];
                break;
            }
        }
        
        if (oldPrice == 0) return 0;
        
        if (currentPrice > oldPrice) {
            return int256(((currentPrice - oldPrice) * 10000) / oldPrice);
        } else {
            return -int256(((oldPrice - currentPrice) * 10000) / oldPrice);
        }
    }

    /**
     * @dev Returns the confidence interval for a price
     * @param asset The address of the asset
     * @return The confidence interval in basis points
     */
    function getPriceConfidence(address asset) external view override returns (uint256) {
        return _priceConfidence[asset] > 0 ? _priceConfidence[asset] : _defaultPriceConfidence;
    }

    /**
     * @dev Returns the oracle version
     * @return The oracle version
     */
    function getOracleVersion() external view override returns (uint256) {
        return _oracleVersion;
    }

    /**
     * @dev Returns the oracle description
     * @return The oracle description
     */
    function getOracleDescription() external view override returns (string memory) {
        return _oracleDescription;
    }

    /**
     * @dev Returns the oracle decimals
     * @return The oracle decimals
     */
    function getOracleDecimals() external view override returns (uint8) {
        return _oracleDecimals;
    }

    /**
     * @dev Returns the oracle address
     * @return The oracle address
     */
    function getOracleAddress() external view override returns (address) {
        return address(this);
    }

    /**
     * @dev Returns the fallback oracle address
     * @return The fallback oracle address
     */
    function getFallbackOracle() external view override returns (address) {
        return _fallbackOracle;
    }

    /**
     * @dev Returns the emergency oracle address
     * @return The emergency oracle address
     */
    function getEmergencyOracle() external view override returns (address) {
        return _emergencyOracle;
    }

    /**
     * @dev Returns whether the oracle is paused
     * @return True if the oracle is paused, false otherwise
     */
    function isPaused() external view override returns (bool) {
        return paused();
    }

    /**
     * @dev Returns the pause guardian address
     * @return The pause guardian address
     */
    function getPauseGuardian() external view override returns (address) {
        return _pauseGuardian;
    }

    /**
     * @dev Returns the admin address
     * @return The admin address
     */
    function getAdmin() external view override returns (address) {
        return _admin;
    }

    /**
     * @dev Returns the pending admin address
     * @return The pending admin address
     */
    function getPendingAdmin() external view override returns (address) {
        return _pendingAdmin;
    }

    /**
     * @dev Returns the implementation address
     * @return The implementation address
     */
    function getImplementation() external view override returns (address) {
        return _implementation;
    }

    /**
     * @dev Returns the proxy admin address
     * @return The proxy admin address
     */
    function getProxyAdmin() external view override returns (address) {
        return _proxyAdmin;
    }

    // Admin functions
    /**
     * @dev Sets the price feed for an asset
     * @param asset The address of the asset
     * @param priceFeed The address of the price feed
     */
    function setPriceFeed(address asset, address priceFeed) external onlyAdmin {
        require(asset != address(0), "ChainlinkPriceOracle: asset cannot be zero");
        require(priceFeed != address(0), "ChainlinkPriceOracle: price feed cannot be zero");
        
        _priceFeeds[asset] = priceFeed;
        emit PriceFeedUpdated(asset, priceFeed);
    }

    /**
     * @dev Sets the heartbeat for an asset
     * @param asset The address of the asset
     * @param heartbeat The heartbeat interval in seconds
     */
    function setHeartbeat(address asset, uint256 heartbeat) external onlyAdmin {
        require(heartbeat > 0, "ChainlinkPriceOracle: heartbeat must be greater than 0");
        
        _heartbeats[asset] = heartbeat;
        emit HeartbeatUpdated(asset, heartbeat);
    }

    /**
     * @dev Sets the deviation threshold for an asset
     * @param asset The address of the asset
     * @param threshold The deviation threshold in basis points
     */
    function setDeviationThreshold(address asset, uint256 threshold) external onlyAdmin {
        require(threshold > 0, "ChainlinkPriceOracle: threshold must be greater than 0");
        
        _deviationThresholds[asset] = threshold;
        emit DeviationThresholdUpdated(asset, threshold);
    }

    /**
     * @dev Sets the grace period for an asset
     * @param asset The address of the asset
     * @param period The grace period in seconds
     */
    function setGracePeriod(address asset, uint256 period) external onlyAdmin {
        _gracePeriods[asset] = period;
        emit GracePeriodUpdated(asset, period);
    }

    /**
     * @dev Sets the staleness threshold for an asset
     * @param asset The address of the asset
     * @param threshold The staleness threshold in seconds
     */
    function setStalenessThreshold(address asset, uint256 threshold) external onlyAdmin {
        require(threshold > 0, "ChainlinkPriceOracle: threshold must be greater than 0");
        
        _stalenessThresholds[asset] = threshold;
        emit StalenessThresholdUpdated(asset, threshold);
    }

    /**
     * @dev Sets the price confidence for an asset
     * @param asset The address of the asset
     * @param confidence The price confidence in basis points
     */
    function setPriceConfidence(address asset, uint256 confidence) external onlyAdmin {
        require(confidence <= 10000, "ChainlinkPriceOracle: confidence must be <= 10000");
        
        _priceConfidence[asset] = confidence;
        emit PriceConfidenceUpdated(asset, confidence);
    }

    /**
     * @dev Sets the max price history length for an asset
     * @param asset The address of the asset
     * @param length The max price history length
     */
    function setMaxPriceHistoryLength(address asset, uint256 length) external onlyAdmin {
        require(length > 0, "ChainlinkPriceOracle: length must be greater than 0");
        
        _maxPriceHistoryLength[asset] = length;
        emit MaxPriceHistoryLengthUpdated(asset, length);
    }

    /**
     * @dev Sets the fallback oracle
     * @param fallbackOracle The address of the fallback oracle
     */
    function setFallbackOracle(address fallbackOracle) external onlyAdmin {
        address oldOracle = _fallbackOracle;
        _fallbackOracle = fallbackOracle;
        emit FallbackOracleUpdated(oldOracle, fallbackOracle);
    }

    /**
     * @dev Sets the emergency oracle
     * @param emergencyOracle The address of the emergency oracle
     */
    function setEmergencyOracle(address emergencyOracle) external onlyAdmin {
        address oldOracle = _emergencyOracle;
        _emergencyOracle = emergencyOracle;
        emit EmergencyOracleUpdated(oldOracle, emergencyOracle);
    }

    /**
     * @dev Pauses the oracle
     */
    function pause() external onlyPauseGuardian {
        _pause();
    }

    /**
     * @dev Unpauses the oracle
     */
    function unpause() external onlyPauseGuardian {
        _unpause();
    }

    // Internal functions
    /**
     * @dev Gets the Chainlink price for an asset
     * @param asset The address of the asset
     * @return The price of the asset
     */
    function _getChainlinkPrice(address asset) external view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(_priceFeeds[asset]);
        (
            uint80 round,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        require(answer > 0, "ChainlinkPriceOracle: invalid price");
        require(updatedAt > 0, "ChainlinkPriceOracle: invalid timestamp");
        require(answeredInRound >= round, "ChainlinkPriceOracle: stale price");

        return uint256(answer);
    }

    /**
     * @dev Gets the Chainlink price and timestamp for an asset
     * @param asset The address of the asset
     * @return price The price of the asset
     * @return timestamp The timestamp of the price
     */
    function _getChainlinkPriceAndTimestamp(address asset) external view returns (uint256 price, uint256 timestamp) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(_priceFeeds[asset]);
        (
            uint80 round,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        require(answer > 0, "ChainlinkPriceOracle: invalid price");
        require(updatedAt > 0, "ChainlinkPriceOracle: invalid timestamp");
        require(answeredInRound >= round, "ChainlinkPriceOracle: stale price");

        return (uint256(answer), updatedAt);
    }

    /**
     * @dev Calculates the deviation between two prices
     * @param oldPrice The old price
     * @param newPrice The new price
     * @return The deviation in basis points
     */
    function _calculateDeviation(uint256 oldPrice, uint256 newPrice) internal pure returns (uint256) {
        if (oldPrice == 0) return 0;
        
        if (newPrice > oldPrice) {
            return ((newPrice - oldPrice) * 10000) / oldPrice;
        } else {
            return ((oldPrice - newPrice) * 10000) / oldPrice;
        }
    }

    /**
     * @dev Updates the price history for an asset
     * @param asset The address of the asset
     * @param price The new price
     */
    function _updatePriceHistory(address asset, uint256 price) internal {
        uint256 maxLength = _maxPriceHistoryLength[asset] > 0 
            ? _maxPriceHistoryLength[asset] 
            : _defaultMaxPriceHistoryLength;
        
        if (_priceHistory[asset].length >= maxLength) {
            // Remove oldest price
            for (uint256 i = 0; i < _priceHistory[asset].length - 1; i++) {
                _priceHistory[asset][i] = _priceHistory[asset][i + 1];
            }
            _priceHistory[asset][_priceHistory[asset].length - 1] = price;
        } else {
            _priceHistory[asset].push(price);
        }
        
        _lastPrices[asset] = price;
        _lastUpdateTimestamps[asset] = block.timestamp;
    }

    // UUPS upgrade functions
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
} 