'use client';

import { useEffect, useRef, useState } from 'react';
import { formatPercent, getPriceDecimals } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ScrollingNumber } from './ScrollingNumber';

interface AnimatedPriceDisplayProps {
  price: number | null;
  change24h: number | null;
  label?: string;
  className?: string;
  size?: 'normal' | 'large' | 'xlarge';
}

export function AnimatedPriceDisplay({
  price,
  change24h,
  label,
  className,
  size = 'normal',
}: AnimatedPriceDisplayProps) {
  const [displayPrice, setDisplayPrice] = useState<number | null>(price);
  const [isUpdating, setIsUpdating] = useState(false);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number | null>(price);

  useEffect(() => {
    if (price === null) {
      setDisplayPrice(null);
      return;
    }

    if (prevPriceRef.current !== null && prevPriceRef.current !== price) {
      // 价格变化，触发动画
      setIsUpdating(true);
      setPriceDirection(price > prevPriceRef.current ? 'up' : 'down');
      
      // 短暂延迟后更新价格，让动画更明显
      const timer = setTimeout(() => {
        setDisplayPrice(price);
        setIsUpdating(false);
        setTimeout(() => setPriceDirection(null), 500);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setDisplayPrice(price);
    }

    prevPriceRef.current = price;
  }, [price]);

  const isPositive = change24h !== null && change24h >= 0;
  const isNegative = change24h !== null && change24h < 0;

  const sizeClasses = {
    normal: 'text-lg',
    large: 'text-4xl',
    xlarge: 'text-8xl',
  };

  const labelSizeClasses = {
    normal: 'text-sm',
    large: 'text-lg',
    xlarge: 'text-3xl',
  };

  const percentSizeClasses = {
    normal: 'text-sm',
    large: 'text-xl',
    xlarge: 'text-5xl',
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <span className={cn('text-muted-foreground', labelSizeClasses[size])}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-4">
        <ScrollingNumber
          value={displayPrice}
          decimals={displayPrice !== null ? getPriceDecimals(displayPrice) : 2}
          size={size}
        />
        {change24h !== null && (
          <span
            className={cn(
              'font-medium transition-all',
              percentSizeClasses[size],
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

