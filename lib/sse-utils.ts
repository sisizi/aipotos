/**
 * SSE (Server-Sent Events) utility functions
 */

// 存储活跃的SSE连接
interface SSEWriter {
  write: (message: string) => void;
  close: () => void;
}

const activeConnections = new Map<string, SSEWriter>();

/**
 * 注册SSE连接
 */
export function registerSSEConnection(taskId: string, writer: SSEWriter) {
  activeConnections.set(taskId, writer);
  console.log(`SSE connection registered for task ${taskId}`);
}

/**
 * 移除SSE连接
 */
export function removeSSEConnection(taskId: string) {
  const removed = activeConnections.delete(taskId);
  if (removed) {
    console.log(`SSE connection removed for task ${taskId}`);
  }
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
        type: update.type,
        taskId,
        task: update.data,
        timestamp: Date.now()
      })}\n\n`;

      connection.write(message);
      console.log(`SSE update sent for task ${taskId}: ${update.type}`);

      // 如果任务完成或失败，清理连接
      if (update.type === 'completed' || update.type === 'failed') {
        setTimeout(() => {
          try {
            connection.close();
          } catch (error) {
            console.error('Error closing SSE connection:', error);
          }
          activeConnections.delete(taskId);
        }, 3000); // 3秒后关闭连接
      }

      return true;
    } catch (error) {
      console.error('Error pushing SSE update:', error);
      activeConnections.delete(taskId);
      return false;
    }
  }
  console.log(`No active SSE connection for task ${taskId}`);
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
  console.log(`Cleaning up ${activeConnections.size} SSE connections`);
  activeConnections.forEach((connection, taskId) => {
    try {
      connection.close();
    } catch (error) {
      console.error(`Error closing connection for task ${taskId}:`, error);
    }
  });
  activeConnections.clear();
}