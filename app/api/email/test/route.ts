import { NextRequest, NextResponse } from 'next/server';
import { testEmailConfig, EmailConfig } from '@/lib/emailService';

// 设置最大执行时间（Vercel 免费版限制 10 秒）
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  console.log('[邮件测试] API 被调用');
  
  try {
    console.log('[邮件测试] 开始解析请求体');
    const body = await request.json();
    console.log('[邮件测试] 请求体解析成功');
    
    const { config } = body;

    // 验证必需参数
    if (!config) {
      console.error('[邮件测试] 缺少配置参数');
      return NextResponse.json(
        { success: false, message: '缺少邮件配置' },
        { status: 400 }
      );
    }

    console.log('[邮件测试] 开始测试邮件配置');
    console.log('[邮件测试] SMTP 主机:', config.smtp?.host);
    console.log('[邮件测试] SMTP 端口:', config.smtp?.port);
    console.log('[邮件测试] SMTP secure:', config.smtp?.secure);
    console.log('[邮件测试] 发件人:', config.from);
    console.log('[邮件测试] 收件人:', config.to);
    console.log('[邮件测试] 收件人类型:', typeof config.to);
    console.log('[邮件测试] 收件人数量:', Array.isArray(config.to) ? config.to.length : 'N/A');

    // 测试邮件配置
    console.log('[邮件测试] 调用 testEmailConfig 函数');
    const result = await testEmailConfig(config as EmailConfig);
    console.log('[邮件测试] testEmailConfig 返回结果:', JSON.stringify(result));

    console.log('[邮件测试] 测试结果:', result.success ? '成功' : '失败');
    if (!result.success) {
      console.error('[邮件测试] 失败原因:', result.message);
    }

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('[邮件测试] API 捕获到错误');
    console.error('[邮件测试] 错误对象:', error);
    console.error('[邮件测试] 错误类型:', typeof error);
    console.error('[邮件测试] 错误名称:', error instanceof Error ? error.name : 'Unknown');
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('[邮件测试] 错误信息:', errorMessage);
    console.error('[邮件测试] 错误堆栈:', errorStack);
    
    return NextResponse.json(
      { 
        success: false, 
        message: `服务器错误: ${errorMessage}`,
        errorType: error instanceof Error ? error.name : typeof error,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
