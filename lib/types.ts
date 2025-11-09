// 币安 WebSocket 价格数据接口
export interface BinanceTickerData {
  e: string; // 事件类型
  E: number; // 事件时间
  s: string; // 交易对符号
  c: string; // 最新价格
  o: string; // 24小时开盘价
  h: string; // 24小时最高价
  l: string; // 24小时最低价
  v: string; // 24小时成交量
  q: string; // 24小时成交额
  P: string; // 24小时价格变化百分比
  p: string; // 24小时价格变化
}

// 价格数据类型
export interface PriceData {
  symbol: string;
  futuresPrice: number | null;
  spotPrice: number | null;
  futuresChange24h: number | null;
  spotChange24h: number | null;
  lastUpdate: number;
}

// WebSocket 连接状态
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// 交易对配置
export interface TradingPair {
  symbol: string;
  addedAt: number;
}

// 告警类型
export type AlertType = 'futures' | 'spot';
export type AlertCondition = 'above' | 'below';

// 价格告警配置
export interface PriceAlert {
  id: string;
  symbol: string;
  type: AlertType; // 合约或现货
  condition: AlertCondition; // 高于或低于
  targetPrice: number;
  enabled: boolean;
  createdAt: number;
  triggeredAt?: number; // 触发时间
}

// 告警配置映射（按交易对符号）
export type AlertConfigMap = Record<string, PriceAlert[]>;

