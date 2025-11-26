'use client';

import { useEffect, useRef } from 'react';
import { PriceData, PriceAlert, EmailConfig } from '@/lib/types';
import { checkAlertTrigger } from '@/lib/utils';
import { sendPriceAlertNotification, checkNotificationPermission } from '@/lib/notification';

interface UsePriceAlertOptions {
  symbol: string;
  priceData: PriceData | null;
  alerts: PriceAlert[];
  onAlertTriggered?: (alert: PriceAlert) => void;
}

// 发送邮件通知
async function sendEmailAlert(
  config: EmailConfig,
  symbol: string,
  type: 'futures' | 'spot',
  condition: 'above' | 'below',
  targetPrice: number,
  currentPrice: number
) {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config,
        symbol,
        type,
        condition,
        targetPrice,
        currentPrice,
      }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('邮件发送成功:', result.message);
    } else {
      console.warn('邮件发送失败:', result.message);
    }
  } catch (error) {
    console.error('发送邮件请求失败:', error);
  }
}

// 价格告警监控 Hook
export function usePriceAlert({
  symbol,
  priceData,
  alerts,
  onAlertTriggered,
}: UsePriceAlertOptions) {
  const triggeredAlertsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!priceData || alerts.length === 0) return;

    // 检查每个告警
    alerts.forEach((alert) => {
      // 只检查启用的告警
      if (!alert.enabled) {
        // 如果告警被禁用，清除触发标记（允许重新启用后再次触发）
        triggeredAlertsRef.current.delete(alert.id);
        return;
      }

      // 跳过已触发的告警（避免重复通知）
      if (triggeredAlertsRef.current.has(alert.id)) {
        return;
      }

      // 获取对应的价格
      const currentPrice =
        alert.type === 'futures' ? priceData.futuresPrice : priceData.spotPrice;

      // 检查是否触发告警
      if (checkAlertTrigger(alert, currentPrice)) {
        // 标记为已触发
        triggeredAlertsRef.current.add(alert.id);

        // 发送浏览器通知
        if (checkNotificationPermission()) {
          sendPriceAlertNotification(
            symbol,
            alert.type,
            alert.condition,
            alert.targetPrice,
            currentPrice!
          );
        }

        // 发送邮件通知（如果启用）
        if (alert.emailNotification) {
          const emailConfig = localStorage.getItem('emailConfig');
          if (emailConfig) {
            try {
              const config = JSON.parse(emailConfig);
              if (config.enabled) {
                sendEmailAlert(
                  config,
                  symbol,
                  alert.type,
                  alert.condition,
                  alert.targetPrice,
                  currentPrice!
                );
              }
            } catch (error) {
              console.error('解析邮件配置失败:', error);
            }
          }
        }

        // 调用回调
        if (onAlertTriggered) {
          onAlertTriggered(alert);
        }
      }
    });
  }, [priceData, alerts, symbol, onAlertTriggered]);

  // 当告警列表变化时，清理已删除告警的触发标记
  useEffect(() => {
    const currentAlertIds = new Set(alerts.map((a) => a.id));
    triggeredAlertsRef.current.forEach((id) => {
      if (!currentAlertIds.has(id)) {
        triggeredAlertsRef.current.delete(id);
      }
    });
  }, [alerts]);
}

