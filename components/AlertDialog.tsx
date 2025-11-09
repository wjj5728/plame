'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PriceAlert, AlertType, AlertCondition } from '@/lib/types';
import { Bell, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AlertDialogProps {
  symbol: string;
  futuresPrice: number | null;
  spotPrice: number | null;
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
  onDeleteAlert: (alertId: string) => void;
  onToggleAlert: (alertId: string) => void;
  trigger?: React.ReactNode;
}

export function AlertDialog({
  symbol,
  futuresPrice,
  spotPrice,
  alerts,
  onAddAlert,
  onDeleteAlert,
  onToggleAlert,
  trigger,
}: AlertDialogProps) {
  const [open, setOpen] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>('futures');
  const [condition, setCondition] = useState<AlertCondition>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentPrice = alertType === 'futures' ? futuresPrice : spotPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setError('请输入有效的价格');
      return;
    }

    if (currentPrice === null) {
      setError('当前价格不可用，请稍后再试');
      return;
    }

    // 验证价格合理性
    if (condition === 'above' && price <= currentPrice) {
      setError(`目标价格应高于当前价格 ${currentPrice.toFixed(2)}`);
      return;
    }
    if (condition === 'below' && price >= currentPrice) {
      setError(`目标价格应低于当前价格 ${currentPrice.toFixed(2)}`);
      return;
    }

    onAddAlert({
      symbol,
      type: alertType,
      condition,
      targetPrice: price,
      enabled: true,
    });

    setTargetPrice('');
    setError(null);
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTargetPrice('');
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            告警设置
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>价格告警设置 - {symbol}</DialogTitle>
          <DialogDescription>
            设置价格告警，当价格达到目标值时将收到浏览器通知
          </DialogDescription>
        </DialogHeader>

        {/* 现有告警列表 */}
        {alerts.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <Label className="text-sm font-semibold">现有告警</Label>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {alert.type === 'futures' ? '合约' : '现货'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {alert.condition === 'above' ? '高于' : '低于'}{' '}
                      {alert.targetPrice.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        alert.enabled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {alert.enabled ? '启用' : '禁用'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleAlert(alert.id)}
                    className="h-8"
                  >
                    {alert.enabled ? '禁用' : '启用'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteAlert(alert.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 添加新告警 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alertType">价格类型</Label>
            <Select
              value={alertType}
              onValueChange={(value) => setAlertType(value as AlertType)}
            >
              <SelectTrigger id="alertType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="futures" disabled={futuresPrice === null}>
                  合约价格 {futuresPrice !== null && `(${futuresPrice.toFixed(2)})`}
                </SelectItem>
                <SelectItem value="spot" disabled={spotPrice === null}>
                  现货价格 {spotPrice !== null && `(${spotPrice.toFixed(2)})`}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">告警条件</Label>
            <Select
              value={condition}
              onValueChange={(value) => setCondition(value as AlertCondition)}
            >
              <SelectTrigger id="condition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">价格高于目标值</SelectItem>
                <SelectItem value="below">价格低于目标值</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetPrice">目标价格</Label>
            <Input
              id="targetPrice"
              type="number"
              step="0.01"
              placeholder="输入目标价格"
              value={targetPrice}
              onChange={(e) => {
                setTargetPrice(e.target.value);
                setError(null);
              }}
              className={error ? 'border-destructive' : ''}
            />
            {currentPrice !== null && (
              <p className="text-xs text-muted-foreground">
                当前价格: {currentPrice.toFixed(2)}
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={currentPrice === null}>
              添加告警
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

