import { LucideIcon } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  isLoading?: boolean;
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  isLoading = false,
  className = '',
}: StatCardProps) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              {subtitle && (
                <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
              )}
              {trend && (
                <div className="flex items-center mt-2">
                  <span
                    className={`text-xs font-medium ${
                      trend.isPositive ? 'text-success-600' : 'text-error-600'
                    }`}
                  >
                    {trend.isPositive ? '+' : ''}{trend.value}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">24h</span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="ml-4">
          <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </div>
    </div>
  );
}