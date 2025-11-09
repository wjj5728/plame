'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriceDisplay } from './PriceDisplay';
import { AlertDialog } from './AlertDialog';
import { formatPercent, calculatePriceDiff, cn } from '@/lib/utils';
import { PriceData, PriceAlert } from '@/lib/types';
import { usePriceAlert } from '@/hooks/usePriceAlert';
import { X, Bell, Maximize2 } from 'lucide-react';

interface PriceCardProps {
  symbol: string;
  priceData: PriceData | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  alerts: PriceAlert[];
  onRemove: () => void;
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
  onDeleteAlert: (alertId: string) => void;
  onToggleAlert: (alertId: string) => void;
  onFullscreen?: () => void;
}

export function PriceCard({
  symbol,
  priceData,
  connectionStatus,
  alerts,
  onRemove,
  onAddAlert,
  onDeleteAlert,
  onToggleAlert,
  onFullscreen,
}: PriceCardProps) {
  const futuresPrice = priceData?.futuresPrice ?? null;
  const spotPrice = priceData?.spotPrice ?? null;
  const futuresChange24h = priceData?.futuresChange24h ?? null;
  const spotChange24h = priceData?.spotChange24h ?? null;
  const priceDiff = calculatePriceDiff(futuresPrice, spotPrice);

  const isConnected = connectionStatus === 'connected';
  const isLoading = connectionStatus === 'connecting';
  const enabledAlerts = alerts.filter((a) => a.enabled);

  // 监控价格告警
  usePriceAlert({
    symbol,
    priceData,
    alerts: enabledAlerts,
  });

  return (
    <Card className="relative transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">{symbol}</CardTitle>
          <div className="flex items-center gap-1">
            {enabledAlerts.length > 0 && (
              <div className="relative">
                <Bell className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {enabledAlerts.length}
                </span>
              </div>
            )}
            {onFullscreen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onFullscreen();
                }}
                aria-label={`全屏查看 ${symbol}`}
                title="全屏查看"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            <AlertDialog
              symbol={symbol}
              futuresPrice={futuresPrice}
              spotPrice={spotPrice}
              alerts={alerts}
              onAddAlert={onAddAlert}
              onDeleteAlert={onDeleteAlert}
              onToggleAlert={onToggleAlert}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label={`设置告警 ${symbol}`}
                >
                  <Bell className="h-4 w-4" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
              onClick={onRemove}
              aria-label={`移除 ${symbol}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              isConnected && 'bg-green-500',
              isLoading && 'bg-yellow-500 animate-pulse',
              !isConnected && !isLoading && 'bg-gray-400'
            )}
          />
          <span className="text-xs text-muted-foreground">
            {isConnected ? '已连接' : isLoading ? '连接中...' : '未连接'}
          </span>
          {/* 现货状态提示 */}
          {isConnected && priceData && (
            <span className="text-xs text-muted-foreground">
              {spotPrice === null ? '(无现货)' : '(有现货)'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 合约价格 */}
        <PriceDisplay
          label="合约价格"
          price={futuresPrice}
          change24h={futuresChange24h}
        />

        {/* 现货价格 */}
        {spotPrice !== null ? (
          <PriceDisplay
            label="现货价格"
            price={spotPrice}
            change24h={spotChange24h}
          />
        ) : (
          isConnected && (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">现货价格</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground italic">
                  该交易对暂无现货市场
                </span>
              </div>
            </div>
          )
        )}

        {/* 价差 */}
        {priceDiff !== null && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">价差</span>
              <span
                className={cn(
                  'text-sm font-medium',
                  priceDiff >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {formatPercent(priceDiff)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

