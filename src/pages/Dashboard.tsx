import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Activity,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus
} from 'lucide-react';
import { Link } from 'react-router-dom';

import StatCard from '../components/UI/StatCard';
import HealthFactorBadge from '../components/UI/HealthFactorBadge';
import AssetIcon from '../components/UI/AssetIcon';

import { useUserAccountData, useUserBalances } from '../hooks/useUserData';
import { usePrices } from '../hooks/usePrices';
import { formatBalance, formatUSD } from '../utils/helpers';

export default function Dashboard() {
  const { isConnected } = useAccount();
  const { data: accountData, isLoading: accountLoading } = useUserAccountData();
  const { data: balances, isLoading: balancesLoading } = useUserBalances();
  const { data: prices, isLoading: pricesLoading } = usePrices();

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Your Wallet</h2>
          <p className="text-slate-600 mb-6">
            Connect your wallet to view your lending and borrowing positions
          </p>
        </div>
      </div>
    );
  }

  const totalCollateralUSD = accountData 
    ? Number(formatUnits(accountData.totalCollateralETH, 18)) * (prices['0x0000000000000000000000000000000000000000']?.priceUSD || 0)
    : 0;

  const totalDebtUSD = accountData 
    ? Number(formatUnits(accountData.totalDebtETH, 18)) * (prices['0x0000000000000000000000000000000000000000']?.priceUSD || 0)
    : 0;

  const availableBorrowUSD = accountData 
    ? Number(formatUnits(accountData.availableBorrowsETH, 18)) * (prices['0x0000000000000000000000000000000000000000']?.priceUSD || 0)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">
          Monitor your lending and borrowing positions across all supported assets
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Collateral"
          value={formatUSD(totalCollateralUSD)}
          icon={Shield}
          isLoading={accountLoading || pricesLoading}
          trend={{
            value: "2.5%",
            isPositive: true,
          }}
        />
        
        <StatCard
          title="Total Borrowed"
          value={formatUSD(totalDebtUSD)}
          icon={TrendingUp}
          isLoading={accountLoading || pricesLoading}
          trend={{
            value: "1.2%",
            isPositive: false,
          }}
        />
        
        <StatCard
          title="Available to Borrow"
          value={formatUSD(availableBorrowUSD)}
          icon={DollarSign}
          isLoading={accountLoading || pricesLoading}
        />
        
        <StatCard
          title="Net APY"
          value="4.2%"
          subtitle="Weighted average"
          icon={Activity}
          isLoading={false}
          trend={{
            value: "0.3%",
            isPositive: true,
          }}
        />
      </div>

      {/* Health Factor */}
      {accountData && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Health Factor</h3>
            <HealthFactorBadge healthFactor={accountData.healthFactor} />
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-2">
              Your health factor represents the safety of your deposited collateral against the borrowed assets.
            </p>
            <p className="text-xs text-slate-500">
              If the health factor goes below 1.0, your collateral may be liquidated.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Supply Positions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Your Supplies</h3>
            <Link
              to="/markets"
              className="btn-primary text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Supply
            </Link>
          </div>
          
          {balancesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-slate-200 rounded animate-pulse mb-2 w-16" />
                    <div className="h-3 bg-slate-200 rounded animate-pulse w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {balances?.filter(balance => balance.balance > 0n).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ArrowUpRight className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 mb-2">No supply positions</p>
                  <p className="text-sm text-slate-500">Start earning interest by supplying assets</p>
                </div>
              ) : (
                balances?.filter(balance => balance.balance > 0n).map((balance) => (
                  <div key={balance.asset.address} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AssetIcon asset={balance.asset} />
                      <div>
                        <p className="font-medium text-slate-900">{balance.asset.symbol}</p>
                        <p className="text-sm text-slate-500">{balance.asset.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">
                        {formatBalance(balance.balance, balance.asset.decimals)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatUSD(balance.balanceUSD)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Borrow Positions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Your Borrows</h3>
            <Link
              to="/markets"
              className="btn-secondary text-sm"
            >
              <Minus className="w-4 h-4 mr-1" />
              Borrow
            </Link>
          </div>
          
          {balancesLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded animate-pulse mb-2" />
                    <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-slate-200 rounded animate-pulse mb-2 w-16" />
                    <div className="h-3 bg-slate-200 rounded animate-pulse w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {balances?.filter(balance => balance.borrowBalance > 0n).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ArrowDownRight className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 mb-2">No borrow positions</p>
                  <p className="text-sm text-slate-500">Borrow assets against your collateral</p>
                </div>
              ) : (
                balances?.filter(balance => balance.borrowBalance > 0n).map((balance) => (
                  <div key={balance.asset.address} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AssetIcon asset={balance.asset} />
                      <div>
                        <p className="font-medium text-slate-900">{balance.asset.symbol}</p>
                        <p className="text-sm text-slate-500">{balance.asset.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">
                        {formatBalance(balance.borrowBalance, balance.asset.decimals)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatUSD(balance.borrowBalanceUSD)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card mt-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Activity</h3>
        <div className="text-center py-8">
          <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">No recent activity</p>
          <p className="text-sm text-slate-500">Your transaction history will appear here</p>
        </div>
      </div>
    </div>
  );
}