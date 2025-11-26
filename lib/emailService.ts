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
  to: string | string[]; // 兼容旧版本（字符串）和新版本（数组）
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

    // 兼容旧版本：确保 to 是数组
    const recipientArray = Array.isArray(config.to) ? config.to : [config.to];
    const recipients = recipientArray.join(', ');
    
    console.log('[邮件服务] 发送告警邮件到:', recipients);

    // 发送邮件到所有收件人
    await transporter.sendMail({
      from: config.from,
      to: recipients, // 将数组转为逗号分隔的字符串
      subject,
      text,
      html,
    });

    // 记录发送时间
    recordEmailSent(throttleKey);

    return { success: true, message: '邮件发送成功' };
  } catch (error) {
    console.error('[邮件服务] 发送邮件失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const errorCode = (error as { code?: string })?.code;
    
    // 提供更详细的错误信息
    let detailedMessage = `邮件发送失败: ${errorMessage}`;
    if (errorCode) {
      detailedMessage += ` (错误代码: ${errorCode})`;
    }
    
    // 常见错误提示
    if (errorCode === 'ETIMEDOUT' || errorCode === 'ESOCKET') {
      detailedMessage += ' - 可能是网络连接超时或 SMTP 服务器无法访问';
    } else if (errorCode === 'EAUTH') {
      detailedMessage += ' - 邮箱认证失败，请检查邮箱地址和授权码';
    } else if (errorCode === 'ECONNECTION') {
      detailedMessage += ' - 无法连接到 SMTP 服务器';
    }
    
    return { 
      success: false, 
      message: detailedMessage
    };
  }
}

// 测试邮件配置
export async function testEmailConfig(config: EmailConfig): Promise<{ success: boolean; message: string }> {
  console.log('[邮件服务] testEmailConfig 函数被调用');
  
  try {
    console.log('[邮件服务] 检查配置是否启用:', config.enabled);
    
    if (!config.enabled) {
      console.log('[邮件服务] 邮件通知未启用');
      return { success: false, message: '邮件通知未启用' };
    }

    console.log('[邮件服务] 创建 SMTP 传输器');
    console.log('[邮件服务] SMTP 配置:', {
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      user: config.smtp.auth.user
    });
    
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass,
      },
    });

    console.log('[邮件服务] 开始验证 SMTP 连接');
    // 验证配置
    await transporter.verify();
    console.log('[邮件服务] SMTP 连接验证成功');

    console.log('[邮件服务] 准备发送测试邮件');
    console.log('[邮件服务] 收件人列表:', config.to);
    console.log('[邮件服务] 收件人类型:', typeof config.to);
    console.log('[邮件服务] 是否为数组:', Array.isArray(config.to));
    
    // 兼容旧版本：确保 to 是数组
    const recipientArray = Array.isArray(config.to) ? config.to : [config.to];
    const recipients = recipientArray.join(', ');
    console.log('[邮件服务] 收件人字符串:', recipients);
    
    await transporter.sendMail({
      from: config.from,
      to: recipients, // 将数组转为逗号分隔的字符串
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

    console.log('[邮件服务] 测试邮件发送成功');
    return { success: true, message: '邮件配置测试成功，测试邮件已发送' };
  } catch (error) {
    console.error('[邮件服务] 邮件配置测试捕获到错误');
    console.error('[邮件服务] 错误对象:', error);
    console.error('[邮件服务] 错误类型:', typeof error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const errorCode = (error as { code?: string })?.code;
    
    // 提供更详细的错误信息
    let detailedMessage = `邮件配置测试失败: ${errorMessage}`;
    if (errorCode) {
      detailedMessage += ` (错误代码: ${errorCode})`;
    }
    
    // 常见错误提示
    if (errorCode === 'ETIMEDOUT' || errorCode === 'ESOCKET') {
      detailedMessage += ' - 网络连接超时，可能是 Vercel 无法访问 SMTP 服务器。建议尝试使用 465 端口（SSL）';
    } else if (errorCode === 'EAUTH') {
      detailedMessage += ' - 邮箱认证失败，请检查邮箱地址和授权码是否正确';
    } else if (errorCode === 'ECONNECTION' || errorCode === 'ECONNREFUSED') {
      detailedMessage += ' - 无法连接到 SMTP 服务器，可能被防火墙阻止';
    } else if (errorCode === 'ENOTFOUND') {
      detailedMessage += ' - SMTP 服务器地址无效';
    }
    
    return { 
      success: false, 
      message: detailedMessage
    };
  }
}
