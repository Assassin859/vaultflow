import { Asset } from '../types';
import { CONTRACT_ADDRESSES } from './contracts';

export const SUPPORTED_ASSETS: Asset[] = [
  {
    address: '0x0000000000000000000000000000000000000000', // ETH
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    isNative: true,
    icon: '⟠'
  },
  {
    address: CONTRACT_ADDRESSES.MOCK_USDC,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '💵'
  },
  {
    address: CONTRACT_ADDRESSES.MOCK_DAI,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    icon: '🟡'
  },
  {
    address: CONTRACT_ADDRESSES.MOCK_WETH,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    icon: '🔷'
  }
];

export const INTEREST_RATE_MODE = {
  STABLE: 1,
  VARIABLE: 2
} as const;

export const HEALTH_FACTOR_THRESHOLD = 1000000000000000000n; // 1.0 in wei

export const DEFAULT_REFERRAL_CODE = 0;

export const TRANSACTION_CONFIRMATIONS = 1;

export const POLLING_INTERVAL = 12000; // 12 seconds

export const MAX_UINT256 = 2n ** 256n - 1n;

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const NETWORK_PARAMS = {
  chainId: '0x5aff',
  chainName: 'Oasis Sapphire Testnet',
  nativeCurrency: {
    name: 'TEST',
    symbol: 'TEST',
    decimals: 18,
  },
  rpcUrls: ['https://testnet.sapphire.oasis.dev'],
  blockExplorerUrls: ['https://testnet.explorer.sapphire.oasis.dev'],
};