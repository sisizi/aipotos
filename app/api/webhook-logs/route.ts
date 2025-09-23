/**
 * Webhook日志查看端点
 */

import { NextResponse } from 'next/server';
import { getWebhookLogs, clearWebhookLogs } from '@/lib/webhook-logger';

export async function GET() {
  const logs = getWebhookLogs();
  return NextResponse.json({
    success: true,
    logs,
    count: logs.length,
    timestamp: new Date().toISOString()
  });
}

export async function DELETE() {
  clearWebhookLogs();
  return NextResponse.json({
    success: true,
    message: 'Webhook logs cleared',
    timestamp: new Date().toISOString()
  });
}