'use client';

import { useEffect, useRef } from 'react';

// 屏幕常亮 Hook
export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) {
      // 如果禁用，释放唤醒锁
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {
          // 忽略释放错误
        });
        wakeLockRef.current = null;
      }
      return;
    }

    // 检查浏览器是否支持 Wake Lock API
    if (!('wakeLock' in navigator)) {
      console.warn('Wake Lock API is not supported in this browser');
      return;
    }

    // 请求唤醒锁
    const requestWakeLock = async () => {
      try {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = wakeLock;

        // 监听释放事件（例如用户切换标签页）
        wakeLock.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      } catch (error) {
        console.error('Failed to request wake lock:', error);
      }
    };

    requestWakeLock();

    // 当页面可见性变化时，重新请求唤醒锁
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 清理函数
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {
          // 忽略释放错误
        });
        wakeLockRef.current = null;
      }
    };
  }, [enabled]);
}

