import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';

import AssetIcon from '../components/UI/AssetIcon';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import SupplyModal from '../components/Modals/SupplyModal';
import BorrowModal from '../components/Modals/BorrowModal';

import { usePrices } from '../hooks/usePrices';
import { useUserBalances } from '../hooks/useUserData';
import { formatUSD, formatPercentage, calculateAPY } from '../utils/helpers';
import { SUPPORTED_ASSETS } from '../utils/constants';
import { Asset } from '../types';

export default function Markets() {
  const { isConnected } = useAccount();
  const { data: prices, isLoading: pricesLoading } = usePrices();
  const { data: balances, isLoading: balancesLoading } = useUserBalances();
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [modalType, setModalType] = useState<'supply' | 'borrow' | null>(null);

  const handleSupply = (asset: Asset) => {
    setSelectedAsset(asset);
    setModalType('supply');
  };

  const handleBorrow = (asset: Asset) => {
    setSelectedAsset(asset);
    setModalType('borrow');
  };

  const closeModal = () => {
    setSelectedAsset(null);
    setModalType(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Markets</h1>
        <p className="text-slate-600">
          Supply assets to earn interest or borrow against your collateral
        </p>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Market Size</p>
              <p className="text-2xl font-bold text-slate-900">$2.4M</p>
              <p className="text-sm text-success-600 mt-1">+5.2% this week</p>
            </div>
            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Borrowed</p>
              <p className="text-2xl font-bold text-slate-900">$1.8M</p>
              <p className="text-sm text-warning-600 mt-1">+2.1% this week</p>
            </div>
            <div className="w-12 h-12 bg-warning-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Average APY</p>
              <p className="text-2xl font-bold text-slate-900">4.2%</p>
              <p className="text-sm text-success-600 mt-1">+0.3% this week</p>
            </div>
            <div className="w-12 h-12 bg-success-50 rounded-lg flex items-center justify-center">
              <Percent className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Markets Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">All Markets</h2>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Info className="w-4 h-4" />
            <span>Click on an asset to supply or borrow</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Asset</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Price</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Total Supply</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Supply APY</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Total Borrow</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Borrow APY</th>
                <th className="text-right py-3 px-4 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {SUPPORTED_ASSETS.map((asset) => {
                const price = prices[asset.address]?.priceUSD || 0;
                const userBalance = balances?.find(b => b.asset.address === asset.address);
                
                return (
                  <tr key={asset.address} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <AssetIcon asset={asset} />
                        <div>
                          <p className="font-medium text-slate-900">{asset.symbol}</p>
                          <p className="text-sm text-slate-500">{asset.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {pricesLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <span className="font-medium text-slate-900">
                          {formatUSD(price)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div>
                        <p className="font-medium text-slate-900">$1.2M</p>
                        <p className="text-sm text-slate-500">600K {asset.symbol}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-50 text-success-700">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {formatPercentage(3.2 + Math.random() * 2)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div>
                        <p className="font-medium text-slate-900">$800K</p>
                        <p className="text-sm text-slate-500">400K {asset.symbol}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-50 text-warning-700">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        {formatPercentage(4.5 + Math.random() * 2)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleSupply(asset)}
                          disabled={!isConnected}
                          className="btn-success text-xs px-3 py-1.5"
                        >
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          Supply
                        </button>
                        <button
                          onClick={() => handleBorrow(asset)}
                          disabled={!isConnected}
                          className="btn-warning text-xs px-3 py-1.5"
                        >
                          <ArrowDownRight className="w-3 h-3 mr-1" />
                          Borrow
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isConnected && (
          <div className="text-center py-8 border-t border-slate-200 mt-6">
            <p className="text-slate-600 mb-4">Connect your wallet to start supplying or borrowing</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedAsset && modalType === 'supply' && (
        <SupplyModal
          asset={selectedAsset}
          isOpen={true}
          onClose={closeModal}
        />
      )}

      {selectedAsset && modalType === 'borrow' && (
        <BorrowModal
          asset={selectedAsset}
          isOpen={true}
          onClose={closeModal}
        />
      )}
    </div>
  );
}