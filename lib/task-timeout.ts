/**
 * 任务超时管理
 */

import { DatabaseService } from '@/services/database';
import { addWebhookLog } from '@/lib/webhook-logger';

// 存储活跃任务的超时定时器
const taskTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * 设置任务超时（10分钟）
 * @param taskId 任务ID
 */
export function setTaskTimeout(taskId: string) {
  // 清除已存在的超时定时器
  clearTaskTimeout(taskId);

  console.log(`Setting 10-minute timeout for task: ${taskId}`);
  addWebhookLog('task-timeout-set', { taskId, timeoutMinutes: 10 });

  // 设置10分钟（600秒）超时
  const timeoutId = setTimeout(async () => {
    try {
      console.log(`Task ${taskId} timed out after 10 minutes`);
      addWebhookLog('task-timeout-triggered', { taskId });

      const dbService = new DatabaseService();

      // 检查任务当前状态
      const task = await dbService.getTask(taskId);

      if (task && (task.status === 'pending' || task.status === 'processing')) {
        // 标记任务为失败
        await dbService.updateTask(taskId, {
          status: 'failed',
          error_message: 'Task timed out after 10 minutes - no response from AI service',
          processing_time: 600, // 10分钟
        });

        addWebhookLog('task-timeout-failed', {
          taskId,
          previousStatus: task.status,
          message: 'Task marked as failed due to timeout'
        });

        console.log(`Task ${taskId} marked as failed due to timeout`);
      } else {
        console.log(`Task ${taskId} timeout triggered but task is already ${task?.status || 'not found'}`);
      }

      // 清理超时记录
      taskTimeouts.delete(taskId);

    } catch (error) {
      console.error(`Error handling timeout for task ${taskId}:`, error);
      addWebhookLog('task-timeout-error', {
        taskId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, 10 * 60 * 1000); // 10分钟

  taskTimeouts.set(taskId, timeoutId);
}

/**
 * 清除任务超时定时器
 * @param taskId 任务ID
 */
export function clearTaskTimeout(taskId: string) {
  const timeoutId = taskTimeouts.get(taskId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    taskTimeouts.delete(taskId);
    console.log(`Cleared timeout for task: ${taskId}`);
    addWebhookLog('task-timeout-cleared', { taskId });
  }
}

/**
 * 获取活跃的超时任务数量
 */
export function getActiveTimeoutCount(): number {
  return taskTimeouts.size;
}

/**
 * 清理所有超时定时器
 */
export function clearAllTimeouts() {
  taskTimeouts.forEach((timeoutId, taskId) => {
    clearTimeout(timeoutId);
    console.log(`Cleared timeout for task: ${taskId}`);
  });
  taskTimeouts.clear();
  addWebhookLog('all-timeouts-cleared', { count: taskTimeouts.size });
}