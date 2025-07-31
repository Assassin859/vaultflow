import { useAccount } from 'wagmi';
import { useLendingPoolRead, useERC20Read } from './useContract';
import { SUPPORTED_ASSETS } from '../utils/constants';
import { UserAccountData, UserBalance } from '../types';

export function useUserAccountData() {
  const { address } = useAccount();
  
  const { data, isLoading, error, refetch } = useLendingPoolRead('getUserAccountData', [address]);
  
  const userAccountData: UserAccountData | undefined = data ? {
    totalCollateralETH: data[0],
    totalDebtETH: data[1],
    availableBorrowsETH: data[2],
    currentLiquidationThreshold: data[3],
    ltv: data[4],
    healthFactor: data[5],
  } : undefined;
  
  return {
    data: userAccountData,
    isLoading,
    error,
    refetch,
  };
}

export function useUserBalances() {
  const { address } = useAccount();
  
  // Get balances for all supported assets
  const balanceQueries = SUPPORTED_ASSETS.map(asset => {
    if (asset.isNative) {
      // For ETH, we'll need to use a different approach
      return { data: 0n, isLoading: false };
    }
    
    return useERC20Read(asset.address, 'balanceOf', [address]);
  });
  
  const userBalances: UserBalance[] = SUPPORTED_ASSETS.map((asset, index) => ({
    asset,
    balance: balanceQueries[index].data || 0n,
    balanceUSD: 0, // Will be calculated with price data
    aTokenBalance: 0n, // Will be fetched separately
    borrowBalance: 0n, // Will be fetched separately
    borrowBalanceUSD: 0,
    isCollateral: false, // Will be determined from user config
  }));
  
  const isLoading = balanceQueries.some(query => query.isLoading);
  
  return {
    data: userBalances,
    isLoading,
    refetch: () => {
      // Refetch all balance queries
      balanceQueries.forEach(query => {
        if ('refetch' in query) {
          query.refetch();
        }
      });
    },
  };
}

export function useAssetBalance(assetAddress: string) {
  const { address } = useAccount();
  
  if (assetAddress === '0x0000000000000000000000000000000000000000') {
    // Handle ETH balance separately
    return { data: 0n, isLoading: false, refetch: () => {} };
  }
  
  return useERC20Read(assetAddress, 'balanceOf', [address]);
}

export function useAssetAllowance(assetAddress: string, spenderAddress: string) {
  const { address } = useAccount();
  
  return useERC20Read(assetAddress, 'allowance', [address, spenderAddress]);
}