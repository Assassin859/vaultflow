import { formatUnits } from 'viem';
import { getHealthFactorColor, getHealthFactorStatus } from '../../utils/helpers';
import { Shield, AlertTriangle, AlertCircle } from 'lucide-react';

interface HealthFactorBadgeProps {
  healthFactor: bigint;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function HealthFactorBadge({ 
  healthFactor, 
  showIcon = true, 
  size = 'md' 
}: HealthFactorBadgeProps) {
  const hf = Number(formatUnits(healthFactor, 18));
  const colorClass = getHealthFactorColor(healthFactor);
  const status = getHealthFactorStatus(healthFactor);
  
  const getIcon = () => {
    if (hf >= 1.5) return <Shield className="w-4 h-4" />;
    if (hf >= 1.1) return <AlertTriangle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };
  
  const displayValue = hf > 100 ? '∞' : hf.toFixed(2);
  
  return (
    <div className={`inline-flex items-center space-x-1 rounded-full bg-white border ${sizeClasses[size]} ${colorClass}`}>
      {showIcon && getIcon()}
      <span className="font-medium">{displayValue}</span>
      <span className="text-xs opacity-75">({status})</span>
    </div>
  );
}