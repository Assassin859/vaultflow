export interface Asset {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
  isNative?: boolean;
}

export interface UserAccountData {
  totalCollateralETH: bigint;
  totalDebtETH: bigint;
  availableBorrowsETH: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
}

export interface ReserveData {
  configuration: {
    data: bigint;
  };
  liquidityIndex: bigint;
  currentBorrowIndex: bigint;
  variableBorrowIndex: bigint;
  currentLiquidityRate: bigint;
  currentVariableBorrowRate: bigint;
  currentStableBorrowRate: bigint;
  lastUpdateTimestamp: number;
  id: number;
  aTokenAddress: string;
  stableDebtTokenAddress: string;
  variableDebtTokenAddress: string;
  interestRateStrategyAddress: string;
  accruedToTreasury: bigint;
  unbacked: bigint;
  isolationModeTotalDebt: bigint;
}

export interface UserBalance {
  asset: Asset;
  balance: bigint;
  balanceUSD: number;
  aTokenBalance: bigint;
  borrowBalance: bigint;
  borrowBalanceUSD: number;
  isCollateral: boolean;
}

export interface TransactionStatus {
  hash?: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
}

export interface PriceData {
  [address: string]: {
    price: bigint;
    priceUSD: number;
    timestamp: number;
  };
}

export interface ProtocolStats {
  totalValueLocked: number;
  totalBorrowed: number;
  totalUsers: number;
  averageAPY: number;
}

export interface AssetStats {
  asset: Asset;
  totalSupply: bigint;
  totalBorrow: bigint;
  supplyAPY: number;
  borrowAPY: number;
  utilizationRate: number;
  price: number;
  priceChange24h: number;
}