// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Math library
 * @dev Provides mathematical operations for the DeFi lending protocol
 */
library Math {
    uint256 internal constant WAD = 1e18;
    uint256 internal constant HALF_WAD = 0.5e18;
    uint256 internal constant RAY = 1e27;
    uint256 internal constant HALF_RAY = 0.5e27;
    uint256 internal constant WAD_RAY_RATIO = 1e9;

    /**
     * @dev Multiplies two wad, rounding half up to the nearest wad
     * @param a Wad
     * @param b Wad
     * @return The result of a*b, in wad
     */
    function wadMul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0 || b == 0) {
            return 0;
        }

        require(a <= (type(uint256).max - HALF_WAD) / b, "Math: multiplication overflow");

        return (a * b + HALF_WAD) / WAD;
    }

    /**
     * @dev Divides two wad, rounding half up to the nearest wad
     * @param a Wad
     * @param b Wad
     * @return The result of a/b, in wad
     */
    function wadDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "Math: division by zero");
        uint256 halfB = b / 2;

        require(a <= (type(uint256).max - halfB) / WAD, "Math: multiplication overflow");

        return (a * WAD + halfB) / b;
    }

    /**
     * @dev Multiplies two ray, rounding half up to the nearest ray
     * @param a Ray
     * @param b Ray
     * @return The result of a*b, in ray
     */
    function rayMul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0 || b == 0) {
            return 0;
        }

        require(a <= (type(uint256).max - HALF_RAY) / b, "Math: multiplication overflow");

        return (a * b + HALF_RAY) / RAY;
    }

    /**
     * @dev Divides two ray, rounding half up to the nearest ray
     * @param a Ray
     * @param b Ray
     * @return The result of a/b, in ray
     */
    function rayDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "Math: division by zero");
        uint256 halfB = b / 2;

        require(a <= (type(uint256).max - halfB) / RAY, "Math: multiplication overflow");

        return (a * RAY + halfB) / b;
    }

    /**
     * @dev Casts ray down to wad
     * @param a Ray
     * @return a casted to wad, rounded half up to the nearest wad
     */
    function rayToWad(uint256 a) internal pure returns (uint256) {
        uint256 halfRatio = WAD_RAY_RATIO / 2;
        uint256 result = halfRatio + a;
        require(result >= halfRatio, "Math: addition overflow");

        return result / WAD_RAY_RATIO;
    }

    /**
     * @dev Converts wad up to ray
     * @param a Wad
     * @return a converted in ray
     */
    function wadToRay(uint256 a) internal pure returns (uint256) {
        uint256 result = a * WAD_RAY_RATIO;
        require(result / WAD_RAY_RATIO == a, "Math: multiplication overflow");
        return result;
    }

    /**
     * @dev Calculates the power of a ray to the given exponent
     * @param x The base as a ray
     * @param n The exponent
     * @return z = x^n, in ray
     */
    function rayPow(uint256 x, uint256 n) internal pure returns (uint256 z) {
        z = n % 2 != 0 ? x : RAY;

        for (n /= 2; n != 0; n /= 2) {
            x = rayMul(x, x);

            if (n % 2 != 0) {
                z = rayMul(z, x);
            }
        }
    }

    /**
     * @dev Calculates the minimum of two numbers
     * @param a First number
     * @param b Second number
     * @return The minimum of a and b
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @dev Calculates the maximum of two numbers
     * @param a First number
     * @param b Second number
     * @return The maximum of a and b
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    /**
     * @dev Calculates the absolute difference between two numbers
     * @param a First number
     * @param b Second number
     * @return The absolute difference between a and b
     */
    function abs(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a - b : b - a;
    }

    /**
     * @dev Calculates the percentage of a number
     * @param amount The base amount
     * @param percentage The percentage (in basis points, 10000 = 100%)
     * @return The percentage of the amount
     */
    function percentMul(uint256 amount, uint256 percentage) internal pure returns (uint256) {
        if (amount == 0 || percentage == 0) {
            return 0;
        }

        require(amount <= (type(uint256).max - HALF_WAD) / percentage, "Math: multiplication overflow");

        return (amount * percentage + HALF_WAD) / WAD;
    }

    /**
     * @dev Calculates the percentage of a number (in basis points)
     * @param amount The base amount
     * @param bps The basis points (10000 = 100%)
     * @return The percentage of the amount
     */
    function percentMulBps(uint256 amount, uint256 bps) internal pure returns (uint256) {
        if (amount == 0 || bps == 0) {
            return 0;
        }

        require(amount <= (type(uint256).max - 5000) / bps, "Math: multiplication overflow");

        return (amount * bps + 5000) / 10000;
    }

    /**
     * @dev Calculates the compound interest
     * @param principal The principal amount
     * @param rate The interest rate (in ray)
     * @param time The time period
     * @return The compound interest
     */
    function compoundInterest(uint256 principal, uint256 rate, uint256 time) internal pure returns (uint256) {
        if (principal == 0 || rate == 0 || time == 0) {
            return principal;
        }

        uint256 ratePerPeriod = rayDiv(rate, RAY);
        uint256 compoundFactor = rayPow(ratePerPeriod, time);
        
        return rayMul(principal, compoundFactor);
    }

    /**
     * @dev Calculates the utilization rate
     * @param borrowed The borrowed amount
     * @param supplied The supplied amount
     * @return The utilization rate (in ray)
     */
    function calculateUtilizationRate(uint256 borrowed, uint256 supplied) internal pure returns (uint256) {
        if (supplied == 0) {
            return 0;
        }

        return rayDiv(borrowed, supplied);
    }

    /**
     * @dev Calculates the health factor
     * @param collateralValue The total collateral value
     * @param borrowValue The total borrow value
     * @param liquidationThreshold The liquidation threshold (in basis points)
     * @return The health factor (in ray)
     */
    function calculateHealthFactor(
        uint256 collateralValue,
        uint256 borrowValue,
        uint256 liquidationThreshold
    ) internal pure returns (uint256) {
        if (borrowValue == 0) {
            return type(uint256).max; // Infinite health factor
        }

        uint256 thresholdValue = percentMulBps(collateralValue, liquidationThreshold);
        return rayDiv(thresholdValue, borrowValue);
    }
} 