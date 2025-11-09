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
import { validateSymbol, normalizeSymbol } from '@/lib/utils';

interface AddPairDialogProps {
  onAdd: (symbol: string) => void;
  existingSymbols: string[];
  trigger?: React.ReactNode;
}

export function AddPairDialog({ onAdd, existingSymbols, trigger }: AddPairDialogProps) {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedSymbol = normalizeSymbol(symbol);

    // 验证格式
    if (!validateSymbol(normalizedSymbol)) {
      setError('请输入有效的交易对符号（如：BTCUSDT）');
      return;
    }

    // 检查是否已存在
    if (existingSymbols.includes(normalizedSymbol)) {
      setError('该交易对已存在');
      return;
    }

    // 添加交易对
    onAdd(normalizedSymbol);
    setSymbol('');
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSymbol('');
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default">添加交易对</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加交易对</DialogTitle>
          <DialogDescription>
            输入币安交易对符号，例如：BTCUSDT、ETHUSDT
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">交易对符号</Label>
              <Input
                id="symbol"
                placeholder="BTCUSDT"
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  setError(null);
                }}
                className={error ? 'border-destructive' : ''}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">添加</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

