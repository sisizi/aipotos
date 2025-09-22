/**
 * SSE (Server-Sent Events) utility functions
 */

// 存储活跃的SSE连接
const activeConnections = new Map<string, WritableStreamDefaultWriter>();

/**
 * 注册SSE连接
 */
export function registerSSEConnection(taskId: string, writer: WritableStreamDefaultWriter) {
  activeConnections.set(taskId, writer);
}

/**
 * 移除SSE连接
 */
export function removeSSEConnection(taskId: string) {
  activeConnections.delete(taskId);
}

/**
 * 向指定任务的SSE连接推送更新
 */
export function pushTaskUpdate(taskId: string, update: {
  type: 'status' | 'progress' | 'completed' | 'failed';
  data: Record<string, unknown>;
}) {
  const connection = activeConnections.get(taskId);
  if (connection) {
    try {
      const message = `data: ${JSON.stringify({
        type: 'task_update',
        taskId,
        update,
        timestamp: Date.now()
      })}\n\n`;

      connection.write(message);

      // 如果任务完成或失败，清理连接
      if (update.type === 'completed' || update.type === 'failed') {
        setTimeout(() => {
          connection.close();
          activeConnections.delete(taskId);
        }, 5000); // 5秒后关闭连接
      }

      return true;
    } catch (error) {
      console.error('Error pushing SSE update:', error);
      activeConnections.delete(taskId);
      return false;
    }
  }
  return false;
}

/**
 * 获取活跃连接数量
 */
export function getActiveConnectionsCount(): number {
  return activeConnections.size;
}

/**
 * 清理所有连接
 */
export function cleanupAllConnections() {
  activeConnections.forEach((connection, taskId) => {
    try {
      connection.close();
    } catch (error) {
      console.error(`Error closing connection for task ${taskId}:`, error);
    }
  });
  activeConnections.clear();
}