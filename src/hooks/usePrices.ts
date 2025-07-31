import { usePriceOracleRead } from './useContract';
import { SUPPORTED_ASSETS } from '../utils/constants';
import type { PriceData } from '../types';
import { formatUnits } from 'viem';

export function usePrices() {
  const priceQueries = SUPPORTED_ASSETS.map(asset => 
    usePriceOracleRead('getPrice', [asset.address])
  );
  
  const priceData: PriceData = {};
  
  SUPPORTED_ASSETS.forEach((asset, index) => {
    const priceResult = priceQueries[index];
    if (priceResult?.data) {
      priceData[asset.address] = {
        price: priceResult.data as bigint,
        priceUSD: Number(formatUnits(priceResult.data as bigint, 18)),
        timestamp: Date.now(),
      };
    }
  });
  
  const isLoading = priceQueries.some(query => query.isLoading);
  const error = priceQueries.find(query => query.error)?.error;
  
  const refetch = () => {
    priceQueries.forEach(query => {
      if (query?.refetch) {
        query.refetch();
      }
    });
  };
  
  return {
    data: priceData,
    isLoading,
    error,
    refetch,
  };
}

export function useAssetPrice(assetAddress: string) {
  const { data, isLoading, error, refetch } = usePriceOracleRead('getPrice', [assetAddress]);
  
  const priceUSD = data ? Number(formatUnits(data as bigint, 18)) : 0;
  
  return {
    data: priceUSD,
    isLoading,
    error,
    refetch,
  };
}