'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Send, Plus, X } from 'lucide-react';
import { EmailConfig } from '@/lib/types';
import { saveEmailConfig, loadEmailConfig } from '@/lib/utils';

export function EmailConfigDialog() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<EmailConfig>({
    enabled: false,
    smtp: {
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user: '',
        pass: '',
      },
    },
    from: '',
    to: [], // 改为数组
    subjectPrefix: '[币安提醒]',
    throttleMinutes: 5,
  });
  const [newRecipient, setNewRecipient] = useState(''); // 新收件人输入
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 加载配置
  useEffect(() => {
    const savedConfig = loadEmailConfig();
    if (savedConfig) {
      // 兼容旧版本：如果 to 是字符串，转换为数组
      const normalizedConfig = {
        ...savedConfig,
        to: Array.isArray(savedConfig.to) 
          ? savedConfig.to 
          : (savedConfig.to ? [savedConfig.to as string] : [])
      };
      setConfig(normalizedConfig);
    }
  }, []);

  // 添加收件人
  const handleAddRecipient = () => {
    const email = newRecipient.trim();
    if (!email) return;
    
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('请输入有效的邮箱地址');
      return;
    }
    
    // 检查是否已存在
    const currentRecipients = Array.isArray(config.to) ? config.to : (config.to ? [config.to] : []);
    if (currentRecipients.includes(email)) {
      alert('该邮箱已存在');
      return;
    }
    
    setConfig({ ...config, to: [...currentRecipients, email] });
    setNewRecipient('');
  };

  // 删除收件人
  const handleRemoveRecipient = (email: string) => {
    const currentRecipients = Array.isArray(config.to) ? config.to : (config.to ? [config.to] : []);
    setConfig({ ...config, to: currentRecipients.filter(e => e !== email) });
  };

  // 保存配置
  const handleSave = () => {
    const currentRecipients = Array.isArray(config.to) ? config.to : (config.to ? [config.to] : []);
    if (currentRecipients.length === 0) {
      alert('请至少添加一个收件人邮箱');
      return;
    }
    saveEmailConfig(config);
    setOpen(false);
  };

  // 测试配置
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: '测试失败: ' + (error instanceof Error ? error.message : '未知错误'),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="h-4 w-4 mr-2" />
          邮件配置
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>邮件通知配置</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 启用开关 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enabled"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="enabled">启用邮件通知</Label>
          </div>

          {/* SMTP 服务器 */}
          <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP 服务器地址</Label>
            <Input
              id="smtp-host"
              value={config.smtp.host}
              onChange={(e) => setConfig({
                ...config,
                smtp: { ...config.smtp, host: e.target.value }
              })}
              placeholder="smtp.qq.com"
            />
          </div>

          {/* SMTP 端口 */}
          <div className="space-y-2">
            <Label htmlFor="smtp-port">SMTP 端口</Label>
            <Input
              id="smtp-port"
              type="number"
              value={config.smtp.port}
              onChange={(e) => setConfig({
                ...config,
                smtp: { ...config.smtp, port: parseInt(e.target.value) || 587 }
              })}
              placeholder="587"
            />
          </div>

          {/* 发件邮箱 */}
          <div className="space-y-2">
            <Label htmlFor="smtp-user">发件邮箱</Label>
            <Input
              id="smtp-user"
              type="email"
              value={config.smtp.auth.user}
              onChange={(e) => setConfig({
                ...config,
                smtp: { ...config.smtp, auth: { ...config.smtp.auth, user: e.target.value } },
                from: `"币安价格提醒" <${e.target.value}>`
              })}
              placeholder="your-email@qq.com"
            />
          </div>

          {/* 邮箱密码/授权码 */}
          <div className="space-y-2">
            <Label htmlFor="smtp-pass">邮箱密码/授权码</Label>
            <Input
              id="smtp-pass"
              type="password"
              value={config.smtp.auth.pass}
              onChange={(e) => setConfig({
                ...config,
                smtp: { ...config.smtp, auth: { ...config.smtp.auth, pass: e.target.value } }
              })}
              placeholder="授权码（非登录密码）"
            />
            <p className="text-xs text-muted-foreground">
              QQ邮箱需要使用授权码，不是登录密码。在邮箱设置中生成。
            </p>
          </div>

          {/* 收件邮箱列表 */}
          <div className="space-y-2">
            <Label>收件邮箱</Label>
            
            {/* 已添加的收件人列表 */}
            {(Array.isArray(config.to) ? config.to : (config.to ? [config.to] : [])).length > 0 && (
              <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                {(Array.isArray(config.to) ? config.to : (config.to ? [config.to] : [])).map((email: string, index: number) => (
                  <div key={index} className="flex items-center justify-between gap-2 p-2 bg-background rounded border">
                    <span className="text-sm flex-1 truncate">{email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveRecipient(email)}
                      title="删除"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {/* 添加新收件人 */}
            <div className="flex gap-2">
              <Input
                id="new-recipient"
                type="email"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRecipient();
                  }
                }}
                placeholder="输入收件邮箱，按回车或点击添加"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddRecipient}
                title="添加收件人"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              可以添加多个收件邮箱，告警邮件将发送给所有收件人
            </p>
          </div>

          {/* 邮件主题前缀 */}
          <div className="space-y-2">
            <Label htmlFor="subject-prefix">邮件主题前缀</Label>
            <Input
              id="subject-prefix"
              value={config.subjectPrefix}
              onChange={(e) => setConfig({ ...config, subjectPrefix: e.target.value })}
              placeholder="[币安提醒]"
            />
          </div>

          {/* 节流时间 */}
          <div className="space-y-2">
            <Label htmlFor="throttle">邮件发送间隔（分钟）</Label>
            <Input
              id="throttle"
              type="number"
              value={config.throttleMinutes}
              onChange={(e) => setConfig({ ...config, throttleMinutes: parseInt(e.target.value) || 5 })}
              placeholder="5"
            />
            <p className="text-xs text-muted-foreground">
              防止频繁发送邮件，同一告警在此时间内只发送一次
            </p>
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {testResult.message}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !config.enabled}
            >
              <Send className="h-4 w-4 mr-2" />
              {testing ? '测试中...' : '测试配置'}
            </Button>
            <Button onClick={handleSave}>
              保存配置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
