'use client';

import { formatPrice, formatPercent } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  price: number | null;
  change24h: number | null;
  label?: string;
  className?: string;
}

export function PriceDisplay({ price, change24h, label, className }: PriceDisplayProps) {
  const isPositive = change24h !== null && change24h >= 0;
  const isNegative = change24h !== null && change24h < 0;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">
          {formatPrice(price)}
        </span>
        {change24h !== null && (
          <span
            className={cn(
              'text-sm font-medium',
              isPositive && 'text-green-600 dark:text-green-400',
              isNegative && 'text-red-600 dark:text-red-400'
            )}
          >
            {formatPercent(change24h)}
          </span>
        )}
      </div>
    </div>
  );
}

