import React from 'react';
import { Asset } from '../../types';

interface AssetIconProps {
  asset: Asset;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AssetIcon({ asset, size = 'md', className = '' }: AssetIconProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-12 h-12 text-xl',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-medium ${className}`}>
      {asset.icon || asset.symbol.charAt(0)}
    </div>
  );
}