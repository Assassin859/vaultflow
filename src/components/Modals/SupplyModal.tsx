import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { X, ArrowUpRight, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import AssetIcon from '../UI/AssetIcon';
import LoadingSpinner from '../UI/LoadingSpinner';

import { useAssetBalance, useAssetAllowance } from '../../hooks/useUserData';
import { useAssetPrice } from '../../hooks/usePrices';
import { Asset } from '../../types';
import { CONTRACT_ADDRESSES, LENDING_POOL_ABI, ERC20_ABI } from '../../utils/contracts';
import { formatBalance, formatUSD, parseInputAmount, isValidAmount } from '../../utils/helpers';
import { MAX_UINT256, DEFAULT_REFERRAL_CODE } from '../../utils/constants';

interface SupplyModalProps {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
}

export default function SupplyModal({ asset, isOpen, onClose }: SupplyModalProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approve' | 'supply' | 'success'>('input');

  const { data: balance } = useAssetBalance(asset.address);
  const { data: allowance, refetch: refetchAllowance } = useAssetAllowance(
    asset.address, 
    CONTRACT_ADDRESSES.LENDING_POOL
  );
  const { data: price } = useAssetPrice(asset.address);

  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeSupply, data: supplyHash } = useWriteContract();
  
  const { isLoading: approveLoading, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  
  const { isLoading: supplyLoading, isSuccess: supplySuccess } = useWaitForTransactionReceipt({
    hash: supplyHash,
  });

  const parsedAmount = parseInputAmount(amount, asset.decimals);
  const amountUSD = Number(formatUnits(parsedAmount, asset.decimals)) * price;
  const needsApproval = asset.address !== '0x0000000000000000000000000000000000000000' && 
                       allowance !== undefined && 
                       parsedAmount > allowance;

  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
      setStep('supply');
    }
  }, [approveSuccess, refetchAllowance]);

  useEffect(() => {
    if (supplySuccess) {
      setStep('success');
      toast.success('Supply successful!');
    }
  }, [supplySuccess]);

  const handleApprove = async () => {
    if (!address || !isValidAmount(amount)) return;

    try {
      setStep('approve');
      writeApprove({
        address: asset.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.LENDING_POOL, MAX_UINT256],
      });
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Approval failed');
      setStep('input');
    }
  };

  const handleSupply = async () => {
    if (!address || !isValidAmount(amount)) return;

    try {
      setStep('supply');
      
      if (asset.isNative) {
        // ETH supply
        writeSupply({
          address: CONTRACT_ADDRESSES.LENDING_POOL as `0x${string}`,
          abi: LENDING_POOL_ABI,
          functionName: 'deposit',
          args: [asset.address, parsedAmount, address, DEFAULT_REFERRAL_CODE],
          value: parsedAmount,
        });
      } else {
        // ERC20 supply
        writeSupply({
          address: CONTRACT_ADDRESSES.LENDING_POOL as `0x${string}`,
          abi: LENDING_POOL_ABI,
          functionName: 'deposit',
          args: [asset.address, parsedAmount, address, DEFAULT_REFERRAL_CODE],
        });
      }
    } catch (error) {
      console.error('Supply error:', error);
      toast.error('Supply failed');
      setStep('input');
    }
  };

  const handleMaxClick = () => {
    if (balance) {
      const maxAmount = formatUnits(balance, asset.decimals);
      setAmount(maxAmount);
    }
  };

  const isAmountValid = isValidAmount(amount) && parsedAmount <= (balance || 0n);
  const canProceed = isAmountValid && parsedAmount > 0n;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <AssetIcon asset={asset} />
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Supply {asset.symbol}</h3>
                <p className="text-sm text-slate-500">Earn interest on your {asset.symbol}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">Supply Successful!</h4>
              <p className="text-slate-600 mb-6">
                You have successfully supplied {amount} {asset.symbol}
              </p>
              <button onClick={onClose} className="btn-primary w-full">
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Amount Input */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="label">Amount to Supply</label>
                  <div className="text-sm text-slate-500">
                    Balance: {formatBalance(balance || 0n, asset.decimals)} {asset.symbol}
                  </div>
                </div>
                
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="input pr-20"
                    disabled={step !== 'input'}
                  />
                  <button
                    onClick={handleMaxClick}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    disabled={step !== 'input'}
                  >
                    MAX
                  </button>
                </div>
                
                {amount && (
                  <p className="text-sm text-slate-500 mt-2">
                    ≈ {formatUSD(amountUSD)}
                  </p>
                )}
              </div>

              {/* Transaction Details */}
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-slate-900 mb-3">Transaction Overview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Supply APY</span>
                    <span className="text-success-600 font-medium">3.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Collateral Usage</span>
                    <span className="text-slate-900">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Health Factor</span>
                    <span className="text-success-600">2.5 → 2.8</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {needsApproval && step === 'input' && (
                  <button
                    onClick={handleApprove}
                    disabled={!canProceed}
                    className="btn-primary w-full"
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Approve {asset.symbol}
                  </button>
                )}

                {step === 'approve' && (
                  <button disabled className="btn-primary w-full">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Approving...
                  </button>
                )}

                {((!needsApproval && step === 'input') || step === 'supply') && (
                  <button
                    onClick={handleSupply}
                    disabled={!canProceed || step === 'supply'}
                    className="btn-primary w-full"
                  >
                    {step === 'supply' ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Supplying...
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        Supply {asset.symbol}
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="btn-secondary w-full"
                  disabled={step === 'approve' || step === 'supply'}
                >
                  Cancel
                </button>
              </div>

              {/* Warning */}
              {!isAmountValid && amount && (
                <div className="flex items-center space-x-2 mt-4 p-3 bg-error-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-error-600 flex-shrink-0" />
                  <p className="text-sm text-error-700">
                    {parsedAmount > (balance || 0n) 
                      ? 'Insufficient balance' 
                      : 'Please enter a valid amount'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}