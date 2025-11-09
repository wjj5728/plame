import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TradingPair, PriceAlert, AlertConfigMap } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 根据价格值计算应该使用的小数位数
// 如果价格小于1（0.开头），使用4位小数；否则使用2位小数
export function getPriceDecimals(price: number): number {
  return price < 1 ? 4 : 2;
}

// 格式化价格显示
export function formatPrice(price: number | null, decimals?: number): string {
  if (price === null) return '--';
  // 如果没有指定小数位数，根据价格值自动判断
  const finalDecimals = decimals !== undefined ? decimals : getPriceDecimals(price);
  return price.toFixed(finalDecimals);
}

// 格式化百分比
export function formatPercent(value: number | null, decimals: number = 2): string {
  if (value === null) return '--';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

// 计算价差百分比
export function calculatePriceDiff(futuresPrice: number | null, spotPrice: number | null): number | null {
  if (futuresPrice === null || spotPrice === null || spotPrice === 0) {
    return null;
  }
  return ((futuresPrice - spotPrice) / spotPrice) * 100;
}

// localStorage 操作：保存交易对列表
export function saveTradingPairs(pairs: TradingPair[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('tradingPairs', JSON.stringify(pairs));
  } catch (error) {
    console.error('Failed to save trading pairs:', error);
  }
}

// localStorage 操作：读取交易对列表
export function loadTradingPairs(): TradingPair[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('tradingPairs');
    if (!data) return [];
    return JSON.parse(data) as TradingPair[];
  } catch (error) {
    console.error('Failed to load trading pairs:', error);
    return [];
  }
}

// 验证交易对格式（币安格式：BTCUSDT, ETHUSDT 等，支持中文）
export function validateSymbol(symbol: string): boolean {
  if (!symbol) return false;
  // 支持大小写字母、数字和中文字符，至少2个字符
  const symbolRegex = /^[A-Za-z0-9\u4e00-\u9fff]{2,}$/;
  return symbolRegex.test(symbol);
}

// 标准化交易对符号（转为大写，保留中文）
export function normalizeSymbol(symbol: string): string {
  return symbol
    .trim()
    .split('')
    .map(char => {
      // 如果是英文字母，转为大写；中文字符保持不变
      if (/[a-zA-Z]/.test(char)) {
        return char.toUpperCase();
      }
      return char;
    })
    .join('');
}

// localStorage 操作：保存告警配置
export function saveAlerts(alerts: AlertConfigMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('priceAlerts', JSON.stringify(alerts));
  } catch (error) {
    console.error('Failed to save alerts:', error);
  }
}

// localStorage 操作：读取告警配置
export function loadAlerts(): AlertConfigMap {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem('priceAlerts');
    if (!data) return {};
    return JSON.parse(data) as AlertConfigMap;
  } catch (error) {
    console.error('Failed to load alerts:', error);
    return {};
  }
}

// 检查价格是否触发告警
export function checkAlertTrigger(
  alert: PriceAlert,
  currentPrice: number | null
): boolean {
  if (!alert.enabled || currentPrice === null) return false;
  
  if (alert.condition === 'above') {
    return currentPrice >= alert.targetPrice;
  } else {
    return currentPrice <= alert.targetPrice;
  }
}
