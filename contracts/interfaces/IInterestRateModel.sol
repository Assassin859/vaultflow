// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IInterestRateModel
 * @dev Interface for interest rate model implementations
 */
interface IInterestRateModel {
    /**
     * @dev Emitted when the interest rate model parameters are updated
     * @param baseRate The new base rate
     * @param multiplier The new multiplier
     * @param jumpMultiplier The new jump multiplier
     * @param kink The new kink point
     */
    event InterestRateModelUpdated(
        uint256 baseRate,
        uint256 multiplier,
        uint256 jumpMultiplier,
        uint256 kink
    );

    /**
     * @dev Calculates the current borrow interest rate per block
     * @param cash The total amount of cash the market has
     * @param borrows The total amount of borrows the market has outstanding
     * @param reserves The total amount of reserves the market has
     * @param reserveFactorMantissa The current reserve factor the market has
     * @return The borrow rate per block (as a percentage, and scaled by 1e18)
     */
    function getBorrowRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 reserveFactorMantissa
    ) external view returns (uint256);

    /**
     * @dev Calculates the current supply interest rate per block
     * @param cash The total amount of cash the market has
     * @param borrows The total amount of borrows the market has outstanding
     * @param reserves The total amount of reserves the market has
     * @param reserveFactorMantissa The current reserve factor the market has
     * @return The supply rate per block (as a percentage, and scaled by 1e18)
     */
    function getSupplyRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 reserveFactorMantissa
    ) external view returns (uint256);

    /**
     * @dev Calculates the utilization rate of the market
     * @param cash The total amount of cash the market has
     * @param borrows The total amount of borrows the market has outstanding
     * @param reserves The total amount of reserves the market has
     * @return The utilization rate as a mantissa between [0, 1e18]
     */
    function utilizationRate(
        uint256 cash,
        uint256 borrows,
        uint256 reserves
    ) external pure returns (uint256);

    /**
     * @dev Returns the base rate per block
     * @return The base rate per block (as a percentage, and scaled by 1e18)
     */
    function baseRatePerBlock() external view returns (uint256);

    /**
     * @dev Returns the multiplier per block
     * @return The multiplier per block (as a percentage, and scaled by 1e18)
     */
    function multiplierPerBlock() external view returns (uint256);

    /**
     * @dev Returns the jump multiplier per block
     * @return The jump multiplier per block (as a percentage, and scaled by 1e18)
     */
    function jumpMultiplierPerBlock() external view returns (uint256);

    /**
     * @dev Returns the kink point
     * @return The kink point (as a percentage, and scaled by 1e18)
     */
    function kink() external view returns (uint256);

    /**
     * @dev Returns the model name
     * @return The model name
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the model version
     * @return The model version
     */
    function version() external view returns (uint256);

    /**
     * @dev Returns the model description
     * @return The model description
     */
    function description() external view returns (string memory);

    /**
     * @dev Returns the model parameters
     * @return baseRate The base rate per block
     * @return multiplier The multiplier per block
     * @return jumpMultiplier The jump multiplier per block
     * @return kink The kink point
     */
    function getParameters()
        external
        view
        returns (
            uint256 baseRate,
            uint256 multiplier,
            uint256 jumpMultiplier,
            uint256 kink
        );

    /**
     * @dev Returns the maximum borrow rate
     * @return The maximum borrow rate per block (as a percentage, and scaled by 1e18)
     */
    function getMaxBorrowRate() external view returns (uint256);

    /**
     * @dev Returns the minimum borrow rate
     * @return The minimum borrow rate per block (as a percentage, and scaled by 1e18)
     */
    function getMinBorrowRate() external view returns (uint256);

    /**
     * @dev Returns the maximum supply rate
     * @return The maximum supply rate per block (as a percentage, and scaled by 1e18)
     */
    function getMaxSupplyRate() external view returns (uint256);

    /**
     * @dev Returns the minimum supply rate
     * @return The minimum supply rate per block (as a percentage, and scaled by 1e18)
     */
    function getMinSupplyRate() external view returns (uint256);

    /**
     * @dev Calculates the borrow rate for a specific utilization rate
     * @param utilizationRate The utilization rate (as a percentage, and scaled by 1e18)
     * @return The borrow rate per block (as a percentage, and scaled by 1e18)
     */
    function getBorrowRateForUtilization(uint256 utilizationRate) external view returns (uint256);

    /**
     * @dev Calculates the supply rate for a specific utilization rate
     * @param utilizationRate The utilization rate (as a percentage, and scaled by 1e18)
     * @param reserveFactorMantissa The reserve factor (as a percentage, and scaled by 1e18)
     * @return The supply rate per block (as a percentage, and scaled by 1e18)
     */
    function getSupplyRateForUtilization(uint256 utilizationRate, uint256 reserveFactorMantissa)
        external
        view
        returns (uint256);

    /**
     * @dev Calculates the optimal utilization rate
     * @return The optimal utilization rate (as a percentage, and scaled by 1e18)
     */
    function getOptimalUtilizationRate() external view returns (uint256);

    /**
     * @dev Calculates the excess utilization rate
     * @param utilizationRate The current utilization rate
     * @return The excess utilization rate (as a percentage, and scaled by 1e18)
     */
    function getExcessUtilizationRate(uint256 utilizationRate) external view returns (uint256);

    /**
     * @dev Calculates the borrow rate slope before the kink
     * @return The borrow rate slope before the kink
     */
    function getBorrowRateSlopeBeforeKink() external view returns (uint256);

    /**
     * @dev Calculates the borrow rate slope after the kink
     * @return The borrow rate slope after the kink
     */
    function getBorrowRateSlopeAfterKink() external view returns (uint256);

    /**
     * @dev Calculates the supply rate slope
     * @param reserveFactorMantissa The reserve factor (as a percentage, and scaled by 1e18)
     * @return The supply rate slope
     */
    function getSupplyRateSlope(uint256 reserveFactorMantissa) external view returns (uint256);

    /**
     * @dev Returns whether the model is paused
     * @return True if the model is paused, false otherwise
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

    /**
     * @dev Calculates the annual percentage rate (APR) for borrowing
     * @param cash The total amount of cash the market has
     * @param borrows The total amount of borrows the market has outstanding
     * @param reserves The total amount of reserves the market has
     * @param reserveFactorMantissa The current reserve factor the market has
     * @return The annual percentage rate for borrowing
     */
    function getBorrowAPR(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 reserveFactorMantissa
    ) external view returns (uint256);

    /**
     * @dev Calculates the annual percentage yield (APY) for supplying
     * @param cash The total amount of cash the market has
     * @param borrows The total amount of borrows the market has outstanding
     * @param reserves The total amount of reserves the market has
     * @param reserveFactorMantissa The current reserve factor the market has
     * @return The annual percentage yield for supplying
     */
    function getSupplyAPY(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 reserveFactorMantissa
    ) external view returns (uint256);

    /**
     * @dev Calculates the effective annual rate (EAR) for borrowing
     * @param cash The total amount of cash the market has
     * @param borrows The total amount of borrows the market has outstanding
     * @param reserves The total amount of reserves the market has
     * @param reserveFactorMantissa The current reserve factor the market has
     * @return The effective annual rate for borrowing
     */
    function getBorrowEAR(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 reserveFactorMantissa
    ) external view returns (uint256);

    /**
     * @dev Calculates the effective annual yield (EAY) for supplying
     * @param cash The total amount of cash the market has
     * @param borrows The total amount of borrows the market has outstanding
     * @param reserves The total amount of reserves the market has
     * @param reserveFactorMantissa The current reserve factor the market has
     * @return The effective annual yield for supplying
     */
    function getSupplyEAY(
        uint256 cash,
        uint256 borrows,
        uint256 reserves,
        uint256 reserveFactorMantissa
    ) external view returns (uint256);
} 