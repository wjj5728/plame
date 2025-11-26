import nodemailer from 'nodemailer';
import { formatPrice } from './utils';

// 邮件配置接口
export interface EmailConfig {
  enabled: boolean;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: string;
  to: string[]; // 改为数组支持多个收件人
  subjectPrefix: string;
  throttleMinutes: number;
}

// 邮件发送记录（用于节流）
const emailThrottle = new Map<string, number>();

// 检查是否可以发送邮件（节流检查）
function canSendEmail(key: string, throttleMinutes: number): boolean {
  const now = Date.now();
  const lastSent = emailThrottle.get(key);
  
  if (!lastSent) {
    return true;
  }
  
  const minutesPassed = (now - lastSent) / 1000 / 60;
  return minutesPassed >= throttleMinutes;
}

// 记录邮件发送时间
function recordEmailSent(key: string): void {
  emailThrottle.set(key, Date.now());
}

// 发送价格告警邮件
export async function sendPriceAlertEmail(
  config: EmailConfig,
  symbol: string,
  type: 'futures' | 'spot',
  condition: 'above' | 'below',
  targetPrice: number,
  currentPrice: number
): Promise<{ success: boolean; message: string }> {
  try {
    // 检查是否启用邮件通知
    if (!config.enabled) {
      return { success: false, message: '邮件通知未启用' };
    }

    // 节流检查
    const throttleKey = `${symbol}-${type}-${condition}-${targetPrice}`;
    if (!canSendEmail(throttleKey, config.throttleMinutes)) {
      return { 
        success: false, 
        message: `邮件发送过于频繁，请等待 ${config.throttleMinutes} 分钟后再试` 
      };
    }

    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass,
      },
    });

    // 准备邮件内容
    const typeText = type === 'futures' ? '合约' : '现货';
    const conditionText = condition === 'above' ? '高于' : '低于';
    const subject = `${config.subjectPrefix} ${symbol} ${typeText}价格${conditionText} ${formatPrice(targetPrice)}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e0e0e0;
          }
          .alert-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .price {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
          }
          .label {
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #999;
            font-size: 12px;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔔 币安价格告警</h1>
        </div>
        <div class="content">
          <div class="alert-info">
            <div class="label">交易对</div>
            <h2 style="margin: 5px 0;">${symbol}</h2>
            
            <div class="label" style="margin-top: 15px;">类型</div>
            <p style="margin: 5px 0;">${typeText}</p>
            
            <div class="label" style="margin-top: 15px;">触发条件</div>
            <p style="margin: 5px 0;">价格${conditionText}目标价格</p>
            
            <div class="label" style="margin-top: 15px;">目标价格</div>
            <div class="price">${formatPrice(targetPrice)}</div>
            
            <div class="label" style="margin-top: 15px;">当前价格</div>
            <div class="price" style="color: ${condition === 'above' ? '#10b981' : '#ef4444'};">
              ${formatPrice(currentPrice)}
            </div>
          </div>
          
          <div class="warning">
            <strong>⚠️ 提示：</strong>此邮件由系统自动发送，请勿直接回复。
          </div>
          
          <div class="footer">
            <p>触发时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
            <p>币安价格监控系统</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${symbol} 价格告警触发

交易对: ${symbol}
类型: ${typeText}
触发条件: 价格${conditionText}目标价格
目标价格: ${formatPrice(targetPrice)}
当前价格: ${formatPrice(currentPrice)}

触发时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
    `;

    // 发送邮件到所有收件人
    await transporter.sendMail({
      from: config.from,
      to: config.to.join(', '), // 将数组转为逗号分隔的字符串
      subject,
      text,
      html,
    });

    // 记录发送时间
    recordEmailSent(throttleKey);

    return { success: true, message: '邮件发送成功' };
  } catch (error) {
    console.error('发送邮件失败:', error);
    return { 
      success: false, 
      message: `邮件发送失败: ${error instanceof Error ? error.message : '未知错误'}` 
    };
  }
}

// 测试邮件配置
export async function testEmailConfig(config: EmailConfig): Promise<{ success: boolean; message: string }> {
  try {
    if (!config.enabled) {
      return { success: false, message: '邮件通知未启用' };
    }

    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass,
      },
    });

    // 验证配置
    await transporter.verify();

    // 发送测试邮件到所有收件人
    await transporter.sendMail({
      from: config.from,
      to: config.to.join(', '), // 将数组转为逗号分隔的字符串
      subject: `${config.subjectPrefix} 测试邮件`,
      text: '这是一封测试邮件，如果您收到此邮件，说明邮件配置正确。',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 8px;
              border: 1px solid #e0e0e0;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ 邮件配置测试</h1>
          </div>
          <div class="content">
            <p>恭喜！您的邮件配置正确。</p>
            <p>这是一封测试邮件，如果您收到此邮件，说明币安价格提醒系统可以正常发送邮件通知。</p>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              测试时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
            </p>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true, message: '邮件配置测试成功，测试邮件已发送' };
  } catch (error) {
    console.error('邮件配置测试失败:', error);
    return { 
      success: false, 
      message: `邮件配置测试失败: ${error instanceof Error ? error.message : '未知错误'}` 
    };
  }
}
