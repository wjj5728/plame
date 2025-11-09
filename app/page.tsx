'use client';

import { useState, useEffect } from 'react';
import { PriceCard } from '@/components/PriceCard';
import { FullscreenPriceView } from '@/components/FullscreenPriceView';
import { AddPairDialog } from '@/components/AddPairDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useBinancePrice } from '@/hooks/useBinancePrice';
import { TradingPair, PriceAlert, AlertConfigMap } from '@/lib/types';
import { saveTradingPairs, loadTradingPairs, saveAlerts, loadAlerts } from '@/lib/utils';
import { requestNotificationPermission } from '@/lib/notification';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [alerts, setAlerts] = useState<AlertConfigMap>({});
  const [fullscreenSymbol, setFullscreenSymbol] = useState<string | null>(null);

  // 从 localStorage 加载交易对
  useEffect(() => {
    const savedPairs = loadTradingPairs();
    if (savedPairs.length > 0) {
      setTradingPairs(savedPairs);
    }
  }, []);

  // 从 localStorage 加载告警配置
  useEffect(() => {
    const savedAlerts = loadAlerts();
    setAlerts(savedAlerts);
  }, []);

  // 请求通知权限
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // 保存交易对到 localStorage
  useEffect(() => {
    if (tradingPairs.length > 0) {
      saveTradingPairs(tradingPairs);
    }
  }, [tradingPairs]);

  // 保存告警配置到 localStorage
  useEffect(() => {
    if (Object.keys(alerts).length > 0) {
      saveAlerts(alerts);
    }
  }, [alerts]);

  // 添加交易对
  const handleAddPair = (symbol: string) => {
    const newPair: TradingPair = {
      symbol,
      addedAt: Date.now(),
    };
    setTradingPairs((prev) => [...prev, newPair]);
  };

  // 移除交易对
  const handleRemovePair = (symbol: string) => {
    setTradingPairs((prev) => prev.filter((pair) => pair.symbol !== symbol));
    // 同时移除该交易对的所有告警
    setAlerts((prev) => {
      const newAlerts = { ...prev };
      delete newAlerts[symbol];
      return newAlerts;
    });
  };

  // 添加告警
  const handleAddAlert = (symbol: string, alert: Omit<PriceAlert, 'id' | 'createdAt'>) => {
    const newAlert: PriceAlert = {
      ...alert,
      id: `${symbol}-${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
    };

    setAlerts((prev) => ({
      ...prev,
      [symbol]: [...(prev[symbol] || []), newAlert],
    }));
  };

  // 删除告警
  const handleDeleteAlert = (symbol: string, alertId: string) => {
    setAlerts((prev) => ({
      ...prev,
      [symbol]: (prev[symbol] || []).filter((alert) => alert.id !== alertId),
    }));
  };

  // 切换告警启用状态
  const handleToggleAlert = (symbol: string, alertId: string) => {
    setAlerts((prev) => ({
      ...prev,
      [symbol]: (prev[symbol] || []).map((alert) =>
        alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 全屏视图 */}
      {fullscreenSymbol && (
        <FullscreenPriceViewWrapper
          symbol={fullscreenSymbol}
          onClose={() => setFullscreenSymbol(null)}
          alerts={alerts[fullscreenSymbol] || []}
          onAddAlert={(alert) => handleAddAlert(fullscreenSymbol, alert)}
          onDeleteAlert={(alertId) => handleDeleteAlert(fullscreenSymbol, alertId)}
          onToggleAlert={(alertId) => handleToggleAlert(fullscreenSymbol, alertId)}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">币安合约价格监控</h1>
              <p className="text-muted-foreground mt-2">
                实时监控币安合约和现货价格
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AddPairDialog
                onAdd={handleAddPair}
                existingSymbols={tradingPairs.map((pair) => pair.symbol)}
                trigger={
                  <Button size="lg" className="gap-2">
                    <Plus className="h-4 w-4" />
                    添加交易对
                  </Button>
                }
              />
            </div>
          </div>
        </header>

        {/* 交易对卡片网格 */}
        {tradingPairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg mb-2">
              还没有添加交易对
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              点击下方按钮添加第一个交易对开始监控
            </p>
            <AddPairDialog
              onAdd={handleAddPair}
              existingSymbols={[]}
              trigger={
                <Button variant="default" size="lg" className="gap-2">
                  <Plus className="h-4 w-4" />
                  添加第一个交易对
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {tradingPairs.map((pair) => (
              <PriceCardWrapper
                key={pair.symbol}
                symbol={pair.symbol}
                onRemove={() => handleRemovePair(pair.symbol)}
                alerts={alerts[pair.symbol] || []}
                onAddAlert={(alert) => handleAddAlert(pair.symbol, alert)}
                onDeleteAlert={(alertId) => handleDeleteAlert(pair.symbol, alertId)}
                onToggleAlert={(alertId) => handleToggleAlert(pair.symbol, alertId)}
                onFullscreen={() => setFullscreenSymbol(pair.symbol)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 全屏视图包装组件
function FullscreenPriceViewWrapper({
  symbol,
  onClose,
  alerts,
  onAddAlert,
  onDeleteAlert,
  onToggleAlert,
}: {
  symbol: string;
  onClose: () => void;
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
  onDeleteAlert: (alertId: string) => void;
  onToggleAlert: (alertId: string) => void;
}) {
  const { priceData, connectionStatus } = useBinancePrice(symbol);

  return (
    <FullscreenPriceView
      symbol={symbol}
      priceData={priceData}
      connectionStatus={connectionStatus}
      alerts={alerts}
      onClose={onClose}
      onAddAlert={onAddAlert}
      onDeleteAlert={onDeleteAlert}
      onToggleAlert={onToggleAlert}
    />
  );
}

// 价格卡片包装组件，用于管理每个交易对的价格数据
function PriceCardWrapper({
  symbol,
  onRemove,
  alerts,
  onAddAlert,
  onDeleteAlert,
  onToggleAlert,
  onFullscreen,
}: {
  symbol: string;
  onRemove: () => void;
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
  onDeleteAlert: (alertId: string) => void;
  onToggleAlert: (alertId: string) => void;
  onFullscreen: () => void;
}) {
  const { priceData, connectionStatus } = useBinancePrice(symbol);

  return (
    <PriceCard
      symbol={symbol}
      priceData={priceData}
      connectionStatus={connectionStatus}
      alerts={alerts}
      onRemove={onRemove}
      onAddAlert={onAddAlert}
      onDeleteAlert={onDeleteAlert}
      onToggleAlert={onToggleAlert}
      onFullscreen={onFullscreen}
    />
  );
}
