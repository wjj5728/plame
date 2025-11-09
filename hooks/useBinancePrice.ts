'use client';

import { useState, useEffect, useCallback } from 'react';
import BinanceWebSocketManager from '@/lib/binance-ws';
import { PriceData, ConnectionStatus } from '@/lib/types';

export function useBinancePrice(symbol: string | null) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setPriceData(null);
      return;
    }

    const wsManager = BinanceWebSocketManager.getInstance();

    // 订阅连接状态更新
    const handleStatusUpdate = (status: ConnectionStatus) => {
      setConnectionStatus(status);
      if (status === 'error') {
        setError('连接错误，请检查网络');
      } else {
        setError(null);
      }
    };

    wsManager.onStatusUpdate(handleStatusUpdate);
    setConnectionStatus(wsManager.getStatus());

    // 订阅价格更新（异步）
    const handlePriceUpdate = (data: PriceData) => {
      setPriceData(data);
      setError(null);
    };

    // 异步订阅
    wsManager.subscribe(symbol, handlePriceUpdate).catch((error) => {
      console.error(`Error subscribing to ${symbol}:`, error);
      setError('订阅失败，请重试');
    });

    // 清理函数
    return () => {
      wsManager.unsubscribe(symbol);
      wsManager.offStatusUpdate(handleStatusUpdate);
    };
  }, [symbol]);

  return {
    priceData,
    connectionStatus,
    error,
  };
}

