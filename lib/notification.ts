// 浏览器通知管理

// 请求通知权限
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('浏览器不支持通知功能');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('用户已拒绝通知权限');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('请求通知权限失败:', error);
    return false;
  }
}

// 检查通知权限
export function checkNotificationPermission(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

// 发送价格告警通知
export function sendPriceAlertNotification(
  symbol: string,
  type: 'futures' | 'spot',
  condition: 'above' | 'below',
  targetPrice: number,
  currentPrice: number
): void {
  if (!checkNotificationPermission()) {
    console.warn('没有通知权限');
    return;
  }

  const typeText = type === 'futures' ? '合约' : '现货';
  const conditionText = condition === 'above' ? '高于' : '低于';
  const title = `${symbol} 价格告警`;
  const body = `${typeText}价格已${conditionText}目标价格 ${targetPrice.toFixed(2)}，当前价格: ${currentPrice.toFixed(2)}`;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `${symbol}-${type}-${condition}-${targetPrice}`, // 防止重复通知
      requireInteraction: false, // 不要求用户交互
    });

    // 点击通知时聚焦窗口
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // 5秒后自动关闭
    setTimeout(() => {
      notification.close();
    }, 5000);
  } catch (error) {
    console.error('发送通知失败:', error);
  }
}

