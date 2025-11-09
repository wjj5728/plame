'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedPriceDisplay } from './AnimatedPriceDisplay';
import { ThemeToggle } from './ThemeToggle';
import { formatPercent, calculatePriceDiff, cn } from '@/lib/utils';
import { PriceData, PriceAlert } from '@/lib/types';
import { usePriceAlert } from '@/hooks/usePriceAlert';
import { useWakeLock } from '@/hooks/useWakeLock';
import { X, Moon, Sun } from 'lucide-react';

interface FullscreenPriceViewProps {
  symbol: string;
  priceData: PriceData | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  alerts: PriceAlert[];
  onClose: () => void;
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
  onDeleteAlert: (alertId: string) => void;
  onToggleAlert: (alertId: string) => void;
}

export function FullscreenPriceView({
  symbol,
  priceData,
  connectionStatus,
  alerts,
  onClose,
  onAddAlert,
  onDeleteAlert,
  onToggleAlert,
}: FullscreenPriceViewProps) {
  const [wakeLockEnabled, setWakeLockEnabled] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const futuresPrice = priceData?.futuresPrice ?? null;
  const spotPrice = priceData?.spotPrice ?? null;
  const futuresChange24h = priceData?.futuresChange24h ?? null;
  const spotChange24h = priceData?.spotChange24h ?? null;
  const priceDiff = calculatePriceDiff(futuresPrice, spotPrice);

  const isConnected = connectionStatus === 'connected';
  const enabledAlerts = alerts.filter((a) => a.enabled);

  // 监控价格告警
  usePriceAlert({
    symbol,
    priceData,
    alerts: enabledAlerts,
  });

  // 屏幕常亮
  useWakeLock(wakeLockEnabled);

  // 进入全屏
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    };

    enterFullscreen();

    // 监听全屏状态变化
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // 如果退出全屏，关闭视图
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // 自动隐藏控制按钮
  useEffect(() => {
    if (!showControls) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showControls]);

  // 鼠标移动时显示控制按钮
  const handleMouseMove = () => {
    setShowControls(true);
  };

  // 退出全屏
  const handleExitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      onClose();
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background to-muted flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onClick={() => setShowControls(true)}
    >
      {/* 主要内容 */}
      <div className="flex flex-col items-center justify-center gap-12 px-8 py-16 max-w-6xl w-full">
        {/* 交易对名称 */}
        <div className="text-center">
          <h1 className="text-9xl font-bold mb-4">{symbol}</h1>
          <div className="flex items-center justify-center gap-3">
            <div
              className={cn(
                'h-3 w-3 rounded-full transition-colors',
                isConnected && 'bg-green-500',
                !isConnected && 'bg-gray-400'
              )}
            />
            <span className="text-3xl text-muted-foreground">
              {isConnected ? '已连接' : '未连接'}
            </span>
            {isConnected && priceData && (
              <span className="text-3xl text-muted-foreground">
                {spotPrice === null ? '(无现货)' : '(有现货)'}
              </span>
            )}
          </div>
        </div>

        {/* 价格显示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 w-full">
          {/* 合约价格 */}
          <div className="flex flex-col items-center justify-center">
            <AnimatedPriceDisplay
              label="合约价格"
              price={futuresPrice}
              change24h={futuresChange24h}
              size="xlarge"
            />
          </div>

          {/* 现货价格 */}
          {spotPrice !== null ? (
            <div className="flex flex-col items-center justify-center">
              <AnimatedPriceDisplay
                label="现货价格"
                price={spotPrice}
                change24h={spotChange24h}
                size="xlarge"
              />
            </div>
          ) : (
            isConnected && (
              <div className="flex flex-col items-center justify-center">
                <span className="text-2xl text-muted-foreground mb-4">现货价格</span>
                <span className="text-xl text-muted-foreground italic">
                  该交易对暂无现货市场
                </span>
              </div>
            )
          )}
        </div>

        {/* 价差 */}
        {priceDiff !== null && (
          <div className="text-center">
            <span className="text-4xl text-muted-foreground mr-4">价差</span>
            <span
              className={cn(
                'text-6xl font-semibold',
                priceDiff >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {formatPercent(priceDiff)}
            </span>
          </div>
        )}
      </div>

      {/* 控制按钮（自动隐藏） */}
      {showControls && (
        <div className="absolute top-4 right-4 flex items-center gap-2 transition-opacity">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWakeLockEnabled(!wakeLockEnabled)}
            className="h-10 w-10"
            title={wakeLockEnabled ? '禁用屏幕常亮' : '启用屏幕常亮'}
          >
            {wakeLockEnabled ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExitFullscreen}
            className="h-10 w-10"
            title="退出全屏"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* 提示信息 */}
      {!showControls && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-muted-foreground opacity-50">
          移动鼠标或点击屏幕显示控制按钮
        </div>
      )}
    </div>
  );
}

