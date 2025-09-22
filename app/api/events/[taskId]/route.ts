/**
 * Server-Sent Events (SSE) 接口用于实时推送任务状态更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { registerSSEConnection, removeSSEConnection } from '@/lib/sse-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  // 创建 SSE 流
  const stream = new ReadableStream({
    start(controller) {
      // 发送初始连接确认
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', taskId })}\n\n`));

      // 保存连接以便稍后推送更新
      const writer = {
        write: (data: string) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error('SSE write error:', error);
          }
        },
        close: () => {
          try {
            controller.close();
          } catch (error) {
            console.error('SSE close error:', error);
          }
        }
      };

      registerSSEConnection(taskId, writer as WritableStreamDefaultWriter);

      // 设置连接关闭处理
      const cleanup = () => {
        removeSSEConnection(taskId);
        try {
          controller.close();
        } catch {
          // 连接可能已经关闭
        }
      };

      // 监听客户端断开连接
      request.signal.addEventListener('abort', cleanup);

      // 设置心跳检测（每30秒发送一次）
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`));
        } catch {
          clearInterval(heartbeat);
          cleanup();
        }
      }, 30000);

      // 设置超时清理（10分钟后自动关闭连接）
      setTimeout(() => {
        clearInterval(heartbeat);
        cleanup();
      }, 600000);
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

