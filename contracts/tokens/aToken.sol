// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../libraries/Math.sol";

/**
 * @title aToken
 * @dev Interest-bearing token representing a user's deposit in the lending pool
 */
contract aToken is
    Initializable,
    ERC20Upgradeable,
    ERC20PermitUpgradeable,
    ERC20VotesUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // State variables
    address public underlyingAsset;
    address public lendingPool;
    uint256 public liquidityIndex;
    uint256 public lastUpdateTimestamp;
    uint256 public scaledTotalSupply;
    mapping(address => uint256) public scaledBalanceOf;
    mapping(address => uint256) public lastUpdateTimestampOf;

    // Events
    event Mint(address indexed user, uint256 amount, uint256 index);
    event Burn(address indexed user, uint256 amount, uint256 index);

    event LiquidityIndexUpdated(uint256 oldIndex, uint256 newIndex, uint256 timestamp);

    // Modifiers
    modifier onlyLendingPool() {
        require(msg.sender == lendingPool, "aToken: caller is not lending pool");
        _;
    }

    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, msg.sender), "aToken: caller is not minter");
        _;
    }

    modifier onlyBurner() {
        require(hasRole(BURNER_ROLE, msg.sender), "aToken: caller is not burner");
        _;
    }

    modifier onlyPauser() {
        require(hasRole(PAUSER_ROLE, msg.sender), "aToken: caller is not pauser");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the aToken
     * @param _underlyingAsset The address of the underlying asset
     * @param _lendingPool The address of the lending pool
     * @param _name The name of the aToken
     * @param _symbol The symbol of the aToken
     */
    function initialize(
        address _underlyingAsset,
        address _lendingPool,
        string memory _name,
        string memory _symbol
    ) public initializer {
        __ERC20_init(_name, _symbol);
        __ERC20Permit_init(_name);
        __ERC20Votes_init();
        __Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        underlyingAsset = _underlyingAsset;
        lendingPool = _lendingPool;
        liquidityIndex = 1e27; // Initial index in ray
        lastUpdateTimestamp = block.timestamp;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, _lendingPool);
        _grantRole(BURNER_ROLE, _lendingPool);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Mints aTokens to a user
     * @param user The address of the user to mint to
     * @param amount The amount of underlying asset to mint aTokens for
     * @param index The current liquidity index
     */
    function mint(address user, uint256 amount, uint256 index) external onlyMinter {
        require(user != address(0), "aToken: cannot mint to zero address");
        require(amount > 0, "aToken: cannot mint zero amount");

        // Update liquidity index if needed
        if (index != liquidityIndex) {
            liquidityIndex = index;
            lastUpdateTimestamp = block.timestamp;
            emit LiquidityIndexUpdated(liquidityIndex, index, block.timestamp);
        }

        // Calculate scaled amount
        uint256 scaledAmount = amount.rayDiv(index);
        
        // Update user's scaled balance
        scaledBalanceOf[user] = scaledBalanceOf[user] + scaledAmount;
        lastUpdateTimestampOf[user] = block.timestamp;

        // Update total scaled supply
        scaledTotalSupply = scaledTotalSupply + scaledAmount;

        // Mint tokens
        _mint(user, amount);

        emit Mint(user, amount, index);
    }

    /**
     * @dev Burns aTokens from a user
     * @param user The address of the user to burn from
     * @param amount The amount of aTokens to burn
     * @param index The current liquidity index
     */
    function burn(address user, uint256 amount, uint256 index) external onlyBurner {
        require(user != address(0), "aToken: cannot burn from zero address");
        require(amount > 0, "aToken: cannot burn zero amount");

        // Update liquidity index if needed
        if (index != liquidityIndex) {
            liquidityIndex = index;
            lastUpdateTimestamp = block.timestamp;
            emit LiquidityIndexUpdated(liquidityIndex, index, block.timestamp);
        }

        // Calculate scaled amount
        uint256 scaledAmount = amount.rayDiv(index);
        
        // Update user's scaled balance
        require(scaledBalanceOf[user] >= scaledAmount, "aToken: insufficient scaled balance");
        scaledBalanceOf[user] = scaledBalanceOf[user] - scaledAmount;
        lastUpdateTimestampOf[user] = block.timestamp;

        // Update total scaled supply
        scaledTotalSupply = scaledTotalSupply - scaledAmount;

        // Burn tokens
        _burn(user, amount);

        emit Burn(user, amount, index);
    }

    /**
     * @dev Gets the balance of a user in underlying asset
     * @param user The address of the user
     * @return The balance in underlying asset
     */
    function balanceOfUnderlying(address user) external view returns (uint256) {
        return scaledBalanceOf[user].rayMul(liquidityIndex);
    }

    /**
     * @dev Gets the total supply in underlying asset
     * @return The total supply in underlying asset
     */
    function totalSupplyUnderlying() external view returns (uint256) {
        return scaledTotalSupply.rayMul(liquidityIndex);
    }

    /**
     * @dev Gets the current liquidity index
     * @return The current liquidity index
     */
    function getLiquidityIndex() external view returns (uint256) {
        return liquidityIndex;
    }

    /**
     * @dev Gets the last update timestamp
     * @return The last update timestamp
     */
    function getLastUpdateTimestamp() external view returns (uint256) {
        return lastUpdateTimestamp;
    }

    /**
     * @dev Gets the scaled balance of a user
     * @param user The address of the user
     * @return The scaled balance
     */
    function getScaledBalanceOf(address user) external view returns (uint256) {
        return scaledBalanceOf[user];
    }

    /**
     * @dev Gets the scaled total supply
     * @return The scaled total supply
     */
    function getScaledTotalSupply() external view returns (uint256) {
        return scaledTotalSupply;
    }

    /**
     * @dev Gets the last update timestamp of a user
     * @param user The address of the user
     * @return The last update timestamp
     */
    function getLastUpdateTimestampOf(address user) external view returns (uint256) {
        return lastUpdateTimestampOf[user];
    }

    /**
     * @dev Calculates the exchange rate between aToken and underlying asset
     * @return The exchange rate
     */
    function exchangeRate() external view returns (uint256) {
        if (scaledTotalSupply == 0) {
            return 1e27; // 1:1 ratio initially
        }
        return liquidityIndex;
    }

    /**
     * @dev Calculates the amount of underlying asset for a given amount of aTokens
     * @param aTokenAmount The amount of aTokens
     * @return The amount of underlying asset
     */
    function aTokenToUnderlying(uint256 aTokenAmount) external view returns (uint256) {
        return aTokenAmount.rayMul(liquidityIndex);
    }

    /**
     * @dev Calculates the amount of aTokens for a given amount of underlying asset
     * @param underlyingAmount The amount of underlying asset
     * @return The amount of aTokens
     */
    function underlyingToAToken(uint256 underlyingAmount) external view returns (uint256) {
        return underlyingAmount.rayDiv(liquidityIndex);
    }

    /**
     * @dev Updates the liquidity index
     * @param newIndex The new liquidity index
     */
    function updateLiquidityIndex(uint256 newIndex) external onlyLendingPool {
        require(newIndex >= liquidityIndex, "aToken: new index must be greater than or equal to current index");
        
        uint256 oldIndex = liquidityIndex;
        liquidityIndex = newIndex;
        lastUpdateTimestamp = block.timestamp;
        
        emit LiquidityIndexUpdated(oldIndex, newIndex, block.timestamp);
    }

    /**
     * @dev Pauses the token
     */
    function pause() external onlyPauser {
        _pause();
    }

    /**
     * @dev Unpauses the token
     */
    function unpause() external onlyPauser {
        _unpause();
    }

    /**
     * @dev Override transfer to check pause state
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }



    /**
     * @dev Override _afterTokenTransfer for voting
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._afterTokenTransfer(from, to, amount);
    }

    /**
     * @dev Override _mint for voting
     */
    function _mint(address to, uint256 amount) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._mint(to, amount);
    }

    /**
     * @dev Override _burn for voting
     */
    function _burn(address account, uint256 amount) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        super._burn(account, amount);
    }

    /**
     * @dev Override _authorizeUpgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @dev Emergency function to rescue tokens
     * @param token The token to rescue
     * @param to The address to send tokens to
     * @param amount The amount to rescue
     */
    function rescueTokens(address token, address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "aToken: cannot rescue to zero address");
        require(token != underlyingAsset, "aToken: cannot rescue underlying asset");
        
        IERC20(token).safeTransfer(to, amount);
    }

    /**
     * @dev Gets the decimals of the underlying asset
     * @return The decimals
     */
    function decimals() public view virtual override returns (uint8) {
        try IERC20Metadata(underlyingAsset).decimals() returns (uint8 underlyingDecimals) {
            return underlyingDecimals;
        } catch {
            return 18; // Default to 18 decimals
        }
    }

    /**
     * @dev Gets the symbol of the underlying asset
     * @return The symbol
     */
    function underlyingSymbol() external view returns (string memory) {
        try IERC20Metadata(underlyingAsset).symbol() returns (string memory symbol) {
            return symbol;
        } catch {
            return "UNKNOWN";
        }
    }

    /**
     * @dev Gets the name of the underlying asset
     * @return The name
     */
    function underlyingName() external view returns (string memory) {
        try IERC20Metadata(underlyingAsset).name() returns (string memory name) {
            return name;
        } catch {
            return "Unknown Token";
        }
    }
} 