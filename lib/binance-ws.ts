import { BinanceTickerData, PriceData, ConnectionStatus } from './types';
import { checkSpotSymbolExists } from './binance-api';

type PriceUpdateCallback = (data: PriceData) => void;
type StatusUpdateCallback = (status: ConnectionStatus) => void;

// 币安 WebSocket 连接管理器（单例模式）
class BinanceWebSocketManager {
  private static instance: BinanceWebSocketManager;
  
  private futuresWs: WebSocket | null = null;
  private spotWs: WebSocket | null = null;
  private futuresSubscriptions: Set<string> = new Set();
  private spotSubscriptions: Set<string> = new Set();
  private priceCallbacks: Map<string, PriceUpdateCallback> = new Map();
  private statusCallbacks: Set<StatusUpdateCallback> = new Set();
  private priceDataCache: Map<string, PriceData> = new Map();
  private spotSymbolExistsCache: Map<string, boolean> = new Map();
  private spotSymbolCheckPromises: Map<string, Promise<boolean>> = new Map();
  
  private futuresStatus: ConnectionStatus = 'disconnected';
  private spotStatus: ConnectionStatus = 'disconnected';
  
  private futuresReconnectAttempts = 0;
  private spotReconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private futuresReconnectTimer: NodeJS.Timeout | null = null;
  private spotReconnectTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): BinanceWebSocketManager {
    if (!BinanceWebSocketManager.instance) {
      BinanceWebSocketManager.instance = new BinanceWebSocketManager();
    }
    return BinanceWebSocketManager.instance;
  }

  // 订阅价格更新
  public async subscribe(symbol: string, callback: PriceUpdateCallback): Promise<void> {
    this.priceCallbacks.set(symbol, callback);
    
    // 初始化价格数据（如果缓存中已有，使用缓存数据）
    const cachedData = this.priceDataCache.get(symbol);
    const initialData: PriceData = cachedData || {
      symbol,
      futuresPrice: null,
      spotPrice: null,
      futuresChange24h: null,
      spotChange24h: null,
      lastUpdate: Date.now(),
    };
    
    if (!cachedData) {
      this.priceDataCache.set(symbol, initialData);
    }
    
    callback(initialData);

    // 订阅合约价格
    if (!this.futuresSubscriptions.has(symbol)) {
      this.futuresSubscriptions.add(symbol);
      this.connectFutures();
    }

    // 检查现货交易对是否存在，然后订阅现货价格
    await this.checkAndSubscribeSpot(symbol);
  }

  // 检查现货交易对是否存在并订阅
  private async checkAndSubscribeSpot(symbol: string): Promise<void> {
    // 如果已经在检查中，等待检查完成
    if (this.spotSymbolCheckPromises.has(symbol)) {
      const exists = await this.spotSymbolCheckPromises.get(symbol);
      if (exists && !this.spotSubscriptions.has(symbol)) {
        this.spotSubscriptions.add(symbol);
        this.connectSpot();
      }
      return;
    }

    // 检查缓存
    if (this.spotSymbolExistsCache.has(symbol)) {
      const exists = this.spotSymbolExistsCache.get(symbol)!;
      if (exists && !this.spotSubscriptions.has(symbol)) {
        this.spotSubscriptions.add(symbol);
        this.connectSpot();
      }
      return;
    }

    // 开始检查
    const checkPromise = checkSpotSymbolExists(symbol);
    this.spotSymbolCheckPromises.set(symbol, checkPromise);

    try {
      const exists = await checkPromise;
      this.spotSymbolExistsCache.set(symbol, exists);
      
      if (exists && !this.spotSubscriptions.has(symbol)) {
        this.spotSubscriptions.add(symbol);
        this.connectSpot();
      } else if (!exists) {
        // 如果不存在，更新价格数据，标记现货价格为不可用
        const callback = this.priceCallbacks.get(symbol);
        if (callback) {
          const currentData = this.priceDataCache.get(symbol) || {
            symbol,
            futuresPrice: null,
            spotPrice: null,
            futuresChange24h: null,
            spotChange24h: null,
            lastUpdate: Date.now(),
          };
          const updatedData: PriceData = {
            ...currentData,
            spotPrice: null,
            spotChange24h: null,
            lastUpdate: Date.now(),
          };
          this.priceDataCache.set(symbol, updatedData);
          callback(updatedData);
        }
      }
    } catch (error) {
      console.error(`Error checking spot symbol ${symbol}:`, error);
      // 出错时，假设不存在，不订阅现货
      this.spotSymbolExistsCache.set(symbol, false);
    } finally {
      this.spotSymbolCheckPromises.delete(symbol);
    }
  }

  // 取消订阅
  public unsubscribe(symbol: string): void {
    this.priceCallbacks.delete(symbol);
    this.futuresSubscriptions.delete(symbol);
    this.spotSubscriptions.delete(symbol);
    this.priceDataCache.delete(symbol);
    this.spotSymbolCheckPromises.delete(symbol);
    // 注意：不删除 spotSymbolExistsCache，以便下次订阅时复用

    // 如果没有订阅了，关闭连接
    if (this.futuresSubscriptions.size === 0) {
      this.disconnectFutures();
    }
    if (this.spotSubscriptions.size === 0) {
      this.disconnectSpot();
    }
  }

  // 订阅状态更新
  public onStatusUpdate(callback: StatusUpdateCallback): void {
    this.statusCallbacks.add(callback);
  }

  // 取消状态更新订阅
  public offStatusUpdate(callback: StatusUpdateCallback): void {
    this.statusCallbacks.delete(callback);
  }

  // 更新状态并通知所有回调
  private updateStatus(type: 'futures' | 'spot', status: ConnectionStatus): void {
    if (type === 'futures') {
      this.futuresStatus = status;
    } else {
      this.spotStatus = status;
    }
    
    // 通知状态更新（取两个连接中最差的状态）
    const overallStatus: ConnectionStatus = 
      this.futuresStatus === 'error' || this.spotStatus === 'error' ? 'error' :
      this.futuresStatus === 'disconnected' && this.spotStatus === 'disconnected' ? 'disconnected' :
      this.futuresStatus === 'connecting' || this.spotStatus === 'connecting' ? 'connecting' :
      'connected';
    
    this.statusCallbacks.forEach(callback => callback(overallStatus));
  }

  // 连接合约 WebSocket
  private connectFutures(): void {
    if (this.futuresWs?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.futuresWs) {
      this.futuresWs.close();
    }

    this.updateStatus('futures', 'connecting');

    try {
      // 币安合约 WebSocket 流
      const streams = Array.from(this.futuresSubscriptions)
        .map(symbol => `${symbol.toLowerCase()}@ticker`)
        .join('/');
      
      const wsUrl = `wss://fstream.binance.com/stream?streams=${streams}`;
      this.futuresWs = new WebSocket(wsUrl);

      this.futuresWs.onopen = () => {
        this.updateStatus('futures', 'connected');
        this.futuresReconnectAttempts = 0;
      };

      this.futuresWs.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.data) {
            this.handleFuturesMessage(message.data);
          }
        } catch (error) {
          console.error('Error parsing futures message:', error);
        }
      };

      this.futuresWs.onerror = (error) => {
        console.error('Futures WebSocket error:', error);
        this.updateStatus('futures', 'error');
      };

      this.futuresWs.onclose = () => {
        this.updateStatus('futures', 'disconnected');
        this.scheduleReconnect('futures');
      };
    } catch (error) {
      console.error('Failed to connect futures WebSocket:', error);
      this.updateStatus('futures', 'error');
    }
  }

  // 连接现货 WebSocket
  private connectSpot(): void {
    if (this.spotWs?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.spotWs) {
      this.spotWs.close();
    }

    this.updateStatus('spot', 'connecting');

    try {
      // 币安现货 WebSocket 流
      const streams = Array.from(this.spotSubscriptions)
        .map(symbol => `${symbol.toLowerCase()}@ticker`)
        .join('/');
      
      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
      this.spotWs = new WebSocket(wsUrl);

      this.spotWs.onopen = () => {
        this.updateStatus('spot', 'connected');
        this.spotReconnectAttempts = 0;
      };

      this.spotWs.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.data) {
          this.handleSpotMessage(message.data);
          }
        } catch (error) {
          console.error('Error parsing spot message:', error);
        }
      };

      this.spotWs.onerror = (error) => {
        console.error('Spot WebSocket error:', error);
        this.updateStatus('spot', 'error');
      };

      this.spotWs.onclose = () => {
        this.updateStatus('spot', 'disconnected');
        this.scheduleReconnect('spot');
      };
    } catch (error) {
      console.error('Failed to connect spot WebSocket:', error);
      this.updateStatus('spot', 'error');
    }
  }

  // 处理合约消息
  private handleFuturesMessage(data: BinanceTickerData): void {
    const symbol = data.s;
    const callback = this.priceCallbacks.get(symbol);
    
    if (callback) {
      // 获取当前价格数据
      const currentData = this.priceDataCache.get(symbol) || {
        symbol,
        futuresPrice: null,
        spotPrice: null,
        futuresChange24h: null,
        spotChange24h: null,
        lastUpdate: Date.now(),
      };
      
      // 更新合约价格数据
      const updatedData: PriceData = {
        ...currentData,
        futuresPrice: parseFloat(data.c),
        futuresChange24h: parseFloat(data.P),
        lastUpdate: Date.now(),
      };
      
      // 更新缓存并通知回调
      this.priceDataCache.set(symbol, updatedData);
      callback(updatedData);
    }
  }

  // 处理现货消息
  private handleSpotMessage(data: BinanceTickerData): void {
    const symbol = data.s;
    const callback = this.priceCallbacks.get(symbol);
    
    if (callback) {
      // 获取当前价格数据
      const currentData = this.priceDataCache.get(symbol) || {
        symbol,
        futuresPrice: null,
        spotPrice: null,
        futuresChange24h: null,
        spotChange24h: null,
        lastUpdate: Date.now(),
      };
      
      // 更新现货价格数据
      const updatedData: PriceData = {
        ...currentData,
        spotPrice: parseFloat(data.c),
        spotChange24h: parseFloat(data.P),
        lastUpdate: Date.now(),
      };
      
      // 更新缓存并通知回调
      this.priceDataCache.set(symbol, updatedData);
      callback(updatedData);
    }
  }


  // 计划重连
  private scheduleReconnect(type: 'futures' | 'spot'): void {
    if (type === 'futures') {
      if (this.futuresReconnectAttempts >= this.maxReconnectAttempts) {
        console.error(`Max reconnect attempts reached for ${type}`);
        return;
      }

      if (this.futuresReconnectTimer) {
        clearTimeout(this.futuresReconnectTimer);
      }

      this.futuresReconnectAttempts++;
      this.futuresReconnectTimer = setTimeout(() => {
        if (this.futuresSubscriptions.size > 0) {
          this.connectFutures();
        }
      }, this.reconnectDelay);
    } else {
      if (this.spotReconnectAttempts >= this.maxReconnectAttempts) {
        console.error(`Max reconnect attempts reached for ${type}`);
        return;
      }

      if (this.spotReconnectTimer) {
        clearTimeout(this.spotReconnectTimer);
      }

      this.spotReconnectAttempts++;
      this.spotReconnectTimer = setTimeout(() => {
        if (this.spotSubscriptions.size > 0) {
          this.connectSpot();
        }
      }, this.reconnectDelay);
    }
  }

  // 断开合约连接
  private disconnectFutures(): void {
    if (this.futuresWs) {
      this.futuresWs.close();
      this.futuresWs = null;
    }
    this.updateStatus('futures', 'disconnected');
  }

  // 断开现货连接
  private disconnectSpot(): void {
    if (this.spotWs) {
      this.spotWs.close();
      this.spotWs = null;
    }
    this.updateStatus('spot', 'disconnected');
  }

  // 断开所有连接
  public disconnect(): void {
    this.disconnectFutures();
    this.disconnectSpot();
    if (this.futuresReconnectTimer) {
      clearTimeout(this.futuresReconnectTimer);
      this.futuresReconnectTimer = null;
    }
    if (this.spotReconnectTimer) {
      clearTimeout(this.spotReconnectTimer);
      this.spotReconnectTimer = null;
    }
  }

  // 获取连接状态
  public getStatus(): ConnectionStatus {
    if (this.futuresStatus === 'error' || this.spotStatus === 'error') {
      return 'error';
    }
    if (this.futuresStatus === 'disconnected' && this.spotStatus === 'disconnected') {
      return 'disconnected';
    }
    if (this.futuresStatus === 'connecting' || this.spotStatus === 'connecting') {
      return 'connecting';
    }
    return 'connected';
  }
}

export default BinanceWebSocketManager;

