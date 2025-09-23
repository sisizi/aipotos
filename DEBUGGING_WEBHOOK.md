# Webhook 调试指南

## 问题现象
kei.ai生成了图片但没有存储到R2中

## 调试步骤

### 1. 检查webhook配置
```
GET /api/debug/config
```
检查：
- `webhookUrl` 是否正确
- 环境变量是否设置正确
- `WEBHOOK_BASE_URL`, `NEXTAUTH_URL`, `VERCEL_URL` 中至少一个应该设置

### 2. 查看webhook日志
```
GET /api/webhook-logs
```
检查：
- 是否收到了webhook请求
- webhook的`taskId`是否匹配
- 处理过程中是否有错误

### 3. 查看最近的任务
```
GET /api/debug/tasks?limit=10
```
检查：
- 任务是否正确创建
- `nano_banana_task_id` 是否正确保存
- 任务状态是否正确

### 4. 测试R2存储功能
```
GET /api/test-r2  # 健康检查
POST /api/test-r2 # 测试存储
{
  "imageUrl": "https://example.com/test.jpg",
  "taskId": "test-task-id",
  "userId": "test-user-id"
}
```

### 5. 模拟webhook调用
```
POST /api/simulate-webhook
{
  "taskId": "your-nano-banana-task-id",
  "state": "success",
  "resultUrls": ["https://example.com/result.jpg"]
}
```

### 6. 检查特定任务
```
POST /api/debug/tasks
{
  "nanoBananaTaskId": "your-nano-banana-task-id"
}
```

## 常见问题和解决方案

### 1. Webhook URL配置错误
**症状**：没有收到webhook请求
**检查**：`/api/debug/config` 中的 `webhookUrl`
**解决**：设置正确的环境变量

### 2. 任务ID不匹配
**症状**：收到webhook但找不到本地任务
**检查**：webhook日志中的 `task-lookup-failed` 事件
**解决**：检查任务创建过程是否正确保存了 `nano_banana_task_id`

### 3. R2存储失败
**症状**：webhook处理成功但图片没有存储
**检查**：webhook日志中的 `handle-success-error` 事件
**解决**：检查R2配置和网络连接

### 4. 图片下载失败
**症状**：R2存储过程中出错
**检查**：控制台中的图片下载日志
**解决**：检查图片URL是否可访问

## 环境变量清单

必需的环境变量：
```
# Webhook配置
WEBHOOK_BASE_URL=https://your-domain.com
# 或者
NEXTAUTH_URL=https://your-domain.com
# 或者
VERCEL_URL=your-domain.com

# Nano Banana API
NANO_BANANA_BASE_URL=https://api.kie.ai/api/v1/jobs
NANO_BANANA_API_KEY=your-api-key

# R2存储
R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.your-domain.com
```

## 监控和日志

### 实时监控
- `/api/webhook-logs` - 查看webhook接收日志
- 控制台日志 - 查看详细的处理过程

### 清理日志
```
DELETE /api/webhook-logs
```

## 测试流程

1. 首先确保配置正确：`GET /api/debug/config`
2. 测试R2连接：`GET /api/test-r2`
3. 创建一个测试任务
4. 使用模拟webhook测试：`POST /api/simulate-webhook`
5. 检查是否成功存储到R2

## 故障排除快速检查

如果图片没有存储到R2，按以下顺序检查：

1. **Webhook是否到达？** → 检查 `/api/webhook-logs`
2. **任务是否找到？** → 检查日志中是否有 `task-lookup-failed`
3. **R2连接是否正常？** → 测试 `/api/test-r2`
4. **图片是否可下载？** → 检查控制台中的下载日志
5. **数据库是否更新？** → 检查任务状态是否变为completed