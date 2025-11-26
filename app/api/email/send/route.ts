import { NextRequest, NextResponse } from 'next/server';
import { sendPriceAlertEmail, EmailConfig } from '@/lib/emailService';

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

    // 发送邮件
    const result = await sendPriceAlertEmail(
      config as EmailConfig,
      symbol,
      type,
      condition,
      targetPrice,
      currentPrice
    );

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
