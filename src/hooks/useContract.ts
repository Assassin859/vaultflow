import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import type { Abi } from 'viem';
import { CONTRACT_ADDRESSES, LENDING_POOL_ABI, ERC20_ABI, PRICE_ORACLE_ABI } from '../utils/contracts';

export function useLendingPoolRead<T extends string>(
  functionName: T,
  args?: readonly any[]
) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.LENDING_POOL as `0x${string}`,
    abi: LENDING_POOL_ABI as Abi,
    functionName,
    args,
  });
}

export function useLendingPoolWrite() {
  return useWriteContract();
}

export function useERC20Read<T extends string>(
  address: string,
  functionName: T,
  args?: readonly any[]
) {
  return useReadContract({
    address: address as `0x${string}`,
    abi: ERC20_ABI as Abi,
    functionName,
    args,
  });
}

export function useERC20Write() {
  return useWriteContract();
}

export function usePriceOracleRead<T extends string>(
  functionName: T,
  args?: readonly any[]
) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.PRICE_ORACLE as `0x${string}`,
    abi: PRICE_ORACLE_ABI as Abi,
    functionName,
    args,
  });
}

export function useTransactionReceipt(hash?: `0x${string}`) {
  return useWaitForTransactionReceipt({
    hash,
  });
}