import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { X, ArrowDownRight, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import AssetIcon from '../UI/AssetIcon';
import LoadingSpinner from '../UI/LoadingSpinner';
import HealthFactorBadge from '../UI/HealthFactorBadge';

import { useUserAccountData } from '../../hooks/useUserData';
import { useAssetPrice } from '../../hooks/usePrices';
import { Asset } from '../../types';
import { CONTRACT_ADDRESSES, LENDING_POOL_ABI } from '../../utils/contracts';
import { formatUSD, parseInputAmount, isValidAmount, calculateHealthFactor } from '../../utils/helpers';
import { DEFAULT_REFERRAL_CODE, INTEREST_RATE_MODE } from '../../utils/constants';

interface BorrowModalProps {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
}

export default function BorrowModal({ asset, isOpen, onClose }: BorrowModalProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [interestRateMode, setInterestRateMode] = useState<number>(INTEREST_RATE_MODE.VARIABLE);
  const [step, setStep] = useState<'input' | 'borrow' | 'success'>('input');

  const { data: accountData } = useUserAccountData();
  const { data: price } = useAssetPrice(asset.address);

  const { writeContract: writeBorrow, data: borrowHash } = useWriteContract();
  const { isSuccess: borrowSuccess } = useWaitForTransactionReceipt({
    hash: borrowHash,
  });

  const parsedAmount = parseInputAmount(amount, asset.decimals);
  const amountUSD = Number(formatUnits(parsedAmount, asset.decimals)) * price;
  
  // Calculate available borrow amount (simplified)
  const availableBorrowETH = accountData?.availableBorrowsETH || 0n;
  const ethPrice = 2000; // Simplified - should get from price oracle
  const availableBorrowUSD = Number(formatUnits(availableBorrowETH, 18)) * ethPrice;
  const maxBorrowAmount = availableBorrowUSD / price;

  // Calculate new health factor
  const currentHealthFactor = accountData?.healthFactor || 0n;
  const newHealthFactor = accountData ? calculateHealthFactor(
    accountData.totalCollateralETH,
    accountData.totalDebtETH + parseUnits(amountUSD.toString(), 18),
    accountData.currentLiquidationThreshold
  ) : 0n;

  useEffect(() => {
    if (borrowSuccess) {
      setStep('success');
      toast.success('Borrow successful!');
    }
  }, [borrowSuccess]);

  const handleBorrow = async () => {
    if (!address || !isValidAmount(amount)) return;

    try {
      setStep('borrow');
      
      writeBorrow({
        address: CONTRACT_ADDRESSES.LENDING_POOL as `0x${string}`,
        abi: LENDING_POOL_ABI,
        functionName: 'borrow',
        args: [
          asset.address as `0x${string}`,
          parsedAmount,
          BigInt(interestRateMode),
          DEFAULT_REFERRAL_CODE,
          address
        ],
      });
    } catch (error) {
      console.error('Borrow error:', error);
      toast.error('Borrow failed');
      setStep('input');
    }
  };

  const handleMaxClick = () => {
    setAmount(maxBorrowAmount.toFixed(6));
  };

  const isAmountValid = isValidAmount(amount) && amountUSD <= availableBorrowUSD;
  const canProceed = isAmountValid && parsedAmount > 0n;
  const isRisky = Number(formatUnits(newHealthFactor, 18)) < 1.5;

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
                <h3 className="text-lg font-semibold text-slate-900">Borrow {asset.symbol}</h3>
                <p className="text-sm text-slate-500">Borrow against your collateral</p>
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
              <h4 className="text-lg font-semibold text-slate-900 mb-2">Borrow Successful!</h4>
              <p className="text-slate-600 mb-6">
                You have successfully borrowed {amount} {asset.symbol}
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
                  <label className="label">Amount to Borrow</label>
                  <div className="text-sm text-slate-500">
                    Available: {formatUSD(availableBorrowUSD)}
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

              {/* Interest Rate Mode */}
              <div className="mb-6">
                <label className="label">Interest Rate</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setInterestRateMode(INTEREST_RATE_MODE.VARIABLE)}
                    className={`p-3 rounded-lg border text-left transition-colors duration-200 ${
                      interestRateMode === INTEREST_RATE_MODE.VARIABLE
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    disabled={step !== 'input'}
                  >
                    <div className="font-medium">Variable</div>
                    <div className="text-sm text-slate-500">4.5% APR</div>
                  </button>
                  <button
                    onClick={() => setInterestRateMode(INTEREST_RATE_MODE.STABLE)}
                    className={`p-3 rounded-lg border text-left transition-colors duration-200 ${
                      interestRateMode === INTEREST_RATE_MODE.STABLE
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    disabled={step !== 'input'}
                  >
                    <div className="font-medium">Stable</div>
                    <div className="text-sm text-slate-500">5.2% APR</div>
                  </button>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-slate-900 mb-3">Transaction Overview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Borrow APR</span>
                    <span className="text-warning-600 font-medium">
                      {interestRateMode === INTEREST_RATE_MODE.VARIABLE ? '4.5%' : '5.2%'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Current Health Factor</span>
                    <HealthFactorBadge healthFactor={currentHealthFactor} showIcon={false} size="sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">New Health Factor</span>
                    <HealthFactorBadge healthFactor={newHealthFactor} showIcon={false} size="sm" />
                  </div>
                </div>
              </div>

              {/* Risk Warning */}
              {isRisky && amount && (
                <div className="flex items-start space-x-2 mb-6 p-3 bg-warning-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-warning-700">
                    <p className="font-medium mb-1">High Risk Transaction</p>
                    <p>This borrow will put your health factor below 1.5, increasing liquidation risk.</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleBorrow}
                  disabled={!canProceed || step === 'borrow'}
                  className="btn-warning w-full"
                >
                  {step === 'borrow' ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Borrowing...
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4 mr-2" />
                      Borrow {asset.symbol}
                    </>
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="btn-secondary w-full"
                  disabled={step === 'borrow'}
                >
                  Cancel
                </button>
              </div>

              {/* Error Messages */}
              {!isAmountValid && amount && (
                <div className="flex items-center space-x-2 mt-4 p-3 bg-error-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-error-600 flex-shrink-0" />
                  <p className="text-sm text-error-700">
                    {amountUSD > availableBorrowUSD 
                      ? 'Amount exceeds available borrowing power' 
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