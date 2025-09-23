/**
 * Webhook日志记录工具
 */

// 内存中存储最近的webhook日志（生产环境应该使用数据库）
const webhookLogs: Array<{
  timestamp: string;
  type: string;
  data: any;
}> = [];

const MAX_LOGS = 50;

export function addWebhookLog(type: string, data: any) {
  webhookLogs.unshift({
    timestamp: new Date().toISOString(),
    type,
    data
  });

  // 保持日志数量限制
  if (webhookLogs.length > MAX_LOGS) {
    webhookLogs.splice(MAX_LOGS);
  }
}

export function getWebhookLogs() {
  return [...webhookLogs];
}

export function clearWebhookLogs() {
  webhookLogs.length = 0;
}