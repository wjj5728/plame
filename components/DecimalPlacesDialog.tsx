'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, X } from 'lucide-react';
import { DecimalPlacesConfig } from '@/lib/types';
import { saveDecimalPlacesConfig, loadDecimalPlacesConfig } from '@/lib/utils';

interface DecimalPlacesDialogProps {
  symbol: string;
  trigger?: React.ReactNode;
  onConfigChange?: () => void;
}

export function DecimalPlacesDialog({ symbol, trigger, onConfigChange }: DecimalPlacesDialogProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<DecimalPlacesConfig>({});
  const [currentDecimals, setCurrentDecimals] = useState<number | null>(null);

  // 加载配置
  useEffect(() => {
    const savedConfig = loadDecimalPlacesConfig();
    setConfig(savedConfig);
    setCurrentDecimals(savedConfig[symbol] ?? null);
  }, [symbol]);

  // 保存配置
  const handleSave = () => {
    const newConfig = { ...config };
    if (currentDecimals === null) {
      // 删除该交易对的配置，恢复默认
      delete newConfig[symbol];
    } else {
      // 设置该交易对的小数位数
      newConfig[symbol] = currentDecimals;
    }
    saveDecimalPlacesConfig(newConfig);
    setConfig(newConfig);
    onConfigChange?.();
    setOpen(false);
  };

  // 重置为默认（自动）
  const handleReset = () => {
    setCurrentDecimals(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="设置小数位数">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>设置小数位数 - {symbol}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="decimals">显示小数位数</Label>
            <Select
              value={currentDecimals === null ? 'auto' : currentDecimals.toString()}
              onValueChange={(value) => {
                if (value === 'auto') {
                  setCurrentDecimals(null);
                } else {
                  setCurrentDecimals(parseInt(value));
                }
              }}
            >
              <SelectTrigger id="decimals">
                <SelectValue placeholder="选择小数位数" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">自动（默认：价格&lt;1显示4位，否则2位）</SelectItem>
                <SelectItem value="0">0 位</SelectItem>
                <SelectItem value="1">1 位</SelectItem>
                <SelectItem value="2">2 位</SelectItem>
                <SelectItem value="3">3 位</SelectItem>
                <SelectItem value="4">4 位</SelectItem>
                <SelectItem value="5">5 位</SelectItem>
                <SelectItem value="6">6 位</SelectItem>
                <SelectItem value="7">7 位</SelectItem>
                <SelectItem value="8">8 位</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {currentDecimals === null 
                ? '将使用默认逻辑：价格小于1时显示4位小数，否则显示2位小数'
                : `将固定显示 ${currentDecimals} 位小数`}
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleReset}>
              重置为默认
            </Button>
            <Button onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
