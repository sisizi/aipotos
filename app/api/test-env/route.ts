import { NextResponse } from 'next/server';

/**
 * 处理GET请求的异步函数，用于检查环境变量的设置状态
 * @param request - Next.js的NextRequest对象，表示传入的请求
 * @returns 返回NextResponse对象，包含环境变量状态信息
 */
export async function GET() {
  try {
    // 检查R2相关的环境变量是否已设置
    const envVars = {
      R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? 'Set' : 'Missing', // 检查R2账户ID
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? 'Set' : 'Missing', // 检查R2访问密钥ID
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? 'Set' : 'Missing', // 检查R2秘密访问密钥
      R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ? 'Set' : 'Missing', // 检查R2存储桶名称
    };

    // 返回成功响应，包含环境变量状态信息
    return NextResponse.json({
      success: true,
      data: envVars,
      message: 'Environment variables status',
    });
  } catch (error) {
    // 捕获并处理可能出现的错误，返回错误响应
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error', // 确保错误信息是字符串类型
    }, { status: 500 }); // 设置HTTP状态码为500表示服务器错误
  }
}
