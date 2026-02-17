import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
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
      <div className="flex items-start justify-between">
        <div className="animate-fade-in">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-foreground group-hover:scale-105 transition-transform duration-300">{formatValue(value)}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-sm mt-2 animate-slide-fade ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${styles.iconBg} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
          <Icon className={`w-6 h-6 ${styles.iconColor}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
