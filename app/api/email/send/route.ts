import { NextRequest, NextResponse } from 'next/server';
import { sendPriceAlertEmail, EmailConfig } from '@/lib/emailService';

// 设置最大执行时间（Vercel 免费版限制 10 秒）
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, symbol, type, condition, targetPrice, currentPrice } = body;

    // 验证必需参数
    if (!config || !symbol || !type || !condition || targetPrice === undefined || currentPrice === undefined) {
      return NextResponse.json(
        { success: false, message: '缺少必需参数' },
        { status: 400 }
      );
    }

    console.log('[邮件发送] 开始发送告警邮件');
    console.log('[邮件发送] 交易对:', symbol);
    console.log('[邮件发送] SMTP 主机:', config.smtp?.host);
    console.log('[邮件发送] 收件人数量:', config.to?.length || 0);

    // 发送邮件
    const result = await sendPriceAlertEmail(
      config as EmailConfig,
      symbol,
      type,
      condition,
      targetPrice,
      currentPrice
    );

    console.log('[邮件发送] 发送结果:', result.success ? '成功' : '失败');
    if (!result.success) {
      console.error('[邮件发送] 失败原因:', result.message);
    }

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('[邮件发送] API 错误:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[邮件发送] 错误堆栈:', errorStack);
    
    return NextResponse.json(
      { 
        success: false, 
        message: `服务器错误: ${errorMessage}`,
        error: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
