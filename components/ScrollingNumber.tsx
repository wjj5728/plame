'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import FlipNumbers from 'react-flip-numbers';

interface ScrollingNumberProps {
  value: number | null;
  decimals?: number;
  className?: string;
  size?: 'normal' | 'large' | 'xlarge';
}

export function ScrollingNumber({
  value,
  decimals = 2,
  className,
  size = 'normal',
}: ScrollingNumberProps) {
  const [displayValue, setDisplayValue] = useState<number | null>(value);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const [key, setKey] = useState(0);
  const prevValueRef = useRef<number | null>(value);

  useEffect(() => {
    if (value === null) {
      setDisplayValue(null);
      return;
    }

    if (prevValueRef.current !== null && prevValueRef.current !== value) {
      // 价格变化，设置方向和触发动画
      const newDirection = value > prevValueRef.current ? 'up' : 'down';
      setDirection(newDirection);
      
      // 更新值并触发翻牌动画
      setDisplayValue(value);
      setKey((prev) => prev + 1); // 强制重新渲染 FlipNumbers
      
      // 动画结束后重置颜色
      const timer = setTimeout(() => {
        setDirection(null);
      }, 800);

      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }

    prevValueRef.current = value;
  }, [value]);

  const sizeClasses = {
    normal: { height: 28, width: 18, fontSize: 20 },
    large: { height: 56, width: 36, fontSize: 40 },
    xlarge: { height: 112, width: 72, fontSize: 80 },
  };

  const sizeConfig = sizeClasses[size];

  if (displayValue === null) {
    return (
      <span className={cn('inline-block font-semibold', className)}>
        --
      </span>
    );
  }

  const valueStr = displayValue.toFixed(decimals);
  
  // 根据方向设置颜色
  const getColor = (): string => {
    if (direction === 'up') return '#22c55e'; // green-500
    if (direction === 'down') return '#ef4444'; // red-500
    // 默认颜色：根据当前主题设置
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      return isDark ? '#ededed' : '#171717'; // 暗色模式浅色，亮色模式深色
    }
    return '#171717'; // 默认深色
  };

  return (
    <span
      className={cn(
        'inline-flex items-baseline',
        className
      )}
    >
      <FlipNumbers
        key={key}
        height={sizeConfig.height}
        width={sizeConfig.width}
        color={getColor()}
        background="transparent"
        play
        perspective={1000}
        numbers={valueStr}
        numberStyle={{
          fontSize: `${sizeConfig.fontSize}px`,
          fontWeight: '600',
          fontFamily: 'inherit',
        }}
      />
    </span>
  );
}
