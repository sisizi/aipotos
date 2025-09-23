/**
 * 超时调试端点
 */

import { NextResponse } from 'next/server';
import { getActiveTimeoutCount, clearAllTimeouts } from '@/lib/task-timeout';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      activeTimeouts: getActiveTimeoutCount(),
      timestamp: new Date().toISOString()
    }
  });
}

export async function DELETE() {
  clearAllTimeouts();
  return NextResponse.json({
    success: true,
    message: 'All timeouts cleared',
    timestamp: new Date().toISOString()
  });
}