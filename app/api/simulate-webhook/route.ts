/**
 * 模拟webhook端点 - 用于测试webhook处理流程
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { taskId, state, resultUrls, failMsg } = await request.json();

    if (!taskId || !state) {
      return NextResponse.json({
        success: false,
        error: 'taskId and state are required'
      }, { status: 400 });
    }

    // 构造模拟的webhook payload
    const webhookPayload = {
      taskId,
      state, // 'success' | 'fail' | 'waiting'
      resultJson: state === 'success' ? JSON.stringify({
        resultUrls: resultUrls || ['https://via.placeholder.com/512x512.png?text=Test+Image']
      }) : undefined,
      failMsg: state === 'fail' ? (failMsg || 'Simulated failure') : undefined,
      costTime: Math.floor(Math.random() * 60) + 10, // 10-70秒随机时间
      completeTime: Date.now()
    };

    console.log('Simulating webhook with payload:', webhookPayload);

    // 发送到真实的webhook端点
    const webhookUrl = `${request.nextUrl.origin}/api/webhook/nano-banana`;
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    const webhookResult = await webhookResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        simulatedPayload: webhookPayload,
        webhookResponse: {
          status: webhookResponse.status,
          result: webhookResult
        }
      },
      message: 'Webhook simulation completed'
    });

  } catch (error) {
    console.error('Webhook simulation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}