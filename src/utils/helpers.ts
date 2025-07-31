import { formatUnits, parseUnits } from 'viem';
import { Asset } from '../types';

export function formatBalance(balance: bigint, decimals: number, precision = 4): string {
  const formatted = formatUnits(balance, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  });
}

export function formatUSD(amount: number, precision = 2): string {
  if (amount === 0) return '$0';
  if (amount < 0.01) return '< $0.01';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(amount);
}

export function formatPercentage(value: number, precision = 2): string {
  return `${value.toFixed(precision)}%`;
}

export function parseInputAmount(input: string, decimals: number): bigint {
  if (!input || input === '') return 0n;
  
  try {
    return parseUnits(input, decimals);
  } catch {
    return 0n;
  }
}

export function calculateHealthFactor(
  totalCollateralETH: bigint,
  totalDebtETH: bigint,
  liquidationThreshold: bigint
): bigint {
  if (totalDebtETH === 0n) {
    return 2n ** 256n - 1n; // Max uint256 for infinite health factor
  }
  
  const collateralWithThreshold = (totalCollateralETH * liquidationThreshold) / 10000n;
  return (collateralWithThreshold * 10n ** 18n) / totalDebtETH;
}

export function getHealthFactorColor(healthFactor: bigint): string {
  const hf = Number(formatUnits(healthFactor, 18));
  
  if (hf >= 2) return 'text-success-600';
  if (hf >= 1.5) return 'text-warning-600';
  if (hf >= 1.1) return 'text-warning-700';
  return 'text-error-600';
}

export function getHealthFactorStatus(healthFactor: bigint): string {
  const hf = Number(formatUnits(healthFactor, 18));
  
  if (hf >= 2) return 'Excellent';
  if (hf >= 1.5) return 'Good';
  if (hf >= 1.1) return 'Risky';
  return 'Liquidation Risk';
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function getAssetByAddress(address: string, assets: Asset[]): Asset | undefined {
  return assets.find(asset => 
    asset.address.toLowerCase() === address.toLowerCase() ||
    (asset.isNative && address === '0x0000000000000000000000000000000000000000')
  );
}

export function calculateAPY(rate: bigint): number {
  // Convert from ray (1e27) to percentage
  const ratePerSecond = Number(formatUnits(rate, 27));
  const secondsPerYear = 365 * 24 * 60 * 60;
  const apy = (Math.pow(1 + ratePerSecond, secondsPerYear) - 1) * 100;
  return apy;
}

export function calculateUtilizationRate(totalBorrow: bigint, totalSupply: bigint): number {
  if (totalSupply === 0n) return 0;
  return Number((totalBorrow * 10000n) / totalSupply) / 100;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidAmount(amount: string): boolean {
  if (!amount || amount === '') return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

export function getExplorerUrl(hash: string, type: 'tx' | 'address' = 'tx'): string {
  const baseUrl = 'https://testnet.explorer.sapphire.oasis.dev';
  return `${baseUrl}/${type}/${hash}`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}