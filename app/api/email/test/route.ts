import { NextRequest, NextResponse } from 'next/server';
import { testEmailConfig, EmailConfig } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    // 验证必需参数
    if (!config) {
      return NextResponse.json(
        { success: false, message: '缺少邮件配置' },
        { status: 400 }
      );
    }

    // 测试邮件配置
    const result = await testEmailConfig(config as EmailConfig);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}
