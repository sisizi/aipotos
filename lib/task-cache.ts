/**
 * 任务结果缓存 - 用于快速推送给客户端
 */

interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed';
  output_image_url?: string;
  error_message?: string;
  timestamp: number;
}

// 内存缓存，用于临时存储任务结果
const taskCache = new Map<string, TaskResult>();

/**
 * 缓存任务结果
 */
export function cacheTaskResult(result: TaskResult) {
  taskCache.set(result.taskId, result);
  console.log(`📦 Task result cached for ${result.taskId}: ${result.status}`);
  console.log(`📦 Cache now has ${taskCache.size} items`);
  console.log(`📦 Cached data:`, result);

  // 10分钟后自动清理缓存
  setTimeout(() => {
    taskCache.delete(result.taskId);
    console.log(`Task cache cleared for ${result.taskId}`);
  }, 10 * 60 * 1000);
}

/**
 * 获取任务结果
 */
export function getTaskResult(taskId: string): TaskResult | undefined {
  const result = taskCache.get(taskId);
  console.log(`📦 Cache lookup for ${taskId}: ${result ? 'Found' : 'Not found'}`);
  if (result) {
    console.log(`📦 Retrieved data:`, result);
  }
  return result;
}

/**
 * 清理指定任务的缓存
 */
export function clearTaskResult(taskId: string): boolean {
  return taskCache.delete(taskId);
}

/**
 * 获取缓存大小
 */
export function getCacheSize(): number {
  return taskCache.size;
}