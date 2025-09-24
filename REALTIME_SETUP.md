# Supabase Realtime Setup

## 在Supabase控制台启用Realtime

1. **登录Supabase控制台**: https://supabase.com/dashboard
2. **选择项目**: 选择你的AI Photo项目
3. **进入Database**: 点击左侧菜单的"Database"
4. **选择Replication**: 点击"Replication"标签页
5. **启用tasks表的实时功能**:
   - 在"Source"表格中找到"tasks"表
   - 点击右侧的切换开关，启用实时功能
   - 确保显示为"Enabled"

## 检查配置

在浏览器控制台中，你应该能看到：
```
📡 启动Realtime监听任务: [task-id]
📡 Realtime订阅状态: SUBSCRIBED
```

## 测试流程

1. 点击Generate生成图片
2. 检查控制台日志是否显示Realtime订阅成功
3. 等待AI生成完成
4. 当数据库更新时，应该立即收到实时推送：
   ```
   🔄 收到Realtime更新: { new: { status: 'completed', output_image_url: '...' } }
   🎉 任务完成，显示图片: [url]
   ```

## 故障排除

如果Realtime不工作：
1. 检查Supabase控制台中tasks表的Replication是否启用
2. 检查网络连接
3. 查看浏览器控制台的错误日志
4. 确认Supabase项目配置正确