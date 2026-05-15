import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: ReactNode;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'accent';
}

const variantStyles = {
  default: {
    bg: 'bg-card',
    iconBg: 'bg-[#f1e7d1] border border-[#d7c7a8]',
    iconColor: 'text-[#6c5a3d]',
  },
  primary: {
    bg: 'bg-card',
    iconBg: 'bg-[#efe2bc] border border-[#d2b06b]',
    iconColor: 'text-[#315f3b]',
  },
  success: {
    bg: 'bg-card',
    iconBg: 'bg-[#e5efe4] border border-[#afc7a6]',
    iconColor: 'text-[#315f3b]',
  },
  warning: {
    bg: 'bg-card',
    iconBg: 'bg-[#f8ecd0] border border-[#dfbc73]',
    iconColor: 'text-[#8a5b22]',
  },
  accent: {
    bg: 'bg-card',
    iconBg: 'bg-[#f5e2d6] border border-[#d3a58a]',
    iconColor: 'text-[#8a4f2a]',
  },
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) => {
  const styles = variantStyles[variant];

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 10000000) {
        return `₹${(val / 10000000).toFixed(1)}Cr`;
      }
      if (val >= 100000) {
        return `₹${(val / 100000).toFixed(1)}L`;
      }
      if (val >= 1000) {
        return val.toLocaleString('en-IN');
      }
    }
    return val;
  };

  return (
    <div className={`stat-card ${styles.bg} group animate-slide-up border-[#d7c7a8] bg-[#fffaf0] hover:scale-[1.02] hover:shadow-[0_14px_28px_rgba(74,60,37,0.08)] transition-all duration-300`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 animate-fade-in">
          <p className="mb-1 text-sm text-[#6c5a3d]">{title}</p>
          <h3 className="text-2xl font-bold text-[#2c4632] transition-transform duration-300 group-hover:scale-105">
            {formatValue(value)}
          </h3>
          {subtitle != null && subtitle !== '' && (
            <div className="mt-1 break-words text-xs text-[#7a6a4f] sm:text-sm">{subtitle}</div>
          )}
          {trend && (
            <p className={`mt-2 text-sm animate-slide-fade ${trend.isPositive ? 'text-[#315f3b]' : 'text-[#8a4f2a]'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} transition-all duration-300 group-hover:rotate-3 group-hover:scale-110`}
        >
          <Icon className={`h-6 w-6 ${styles.iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
