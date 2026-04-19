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
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
  primary: {
    bg: 'bg-card',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  success: {
    bg: 'bg-card',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  warning: {
    bg: 'bg-card',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  accent: {
    bg: 'bg-card',
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
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
    <div className={`stat-card ${styles.bg} animate-slide-up hover:scale-[1.02] transition-all duration-300 hover:shadow-lg group`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 animate-fade-in">
          <p className="mb-1 text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold text-foreground transition-transform duration-300 group-hover:scale-105">
            {formatValue(value)}
          </h3>
          {subtitle != null && subtitle !== '' && (
            <div className="mt-1 break-words text-xs text-muted-foreground sm:text-sm">{subtitle}</div>
          )}
          {trend && (
            <p className={`text-sm mt-2 animate-slide-fade ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
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
