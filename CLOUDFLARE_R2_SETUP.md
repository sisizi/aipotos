# Cloudflare R2 设置指南

## 环境变量配置

请在项目根目录创建 `.env.local` 文件，并添加以下环境变量：

```env
# Cloudflare R2 配置
R2_ACCESS_KEY_ID=U3jdLtvWBZpOmPUSxWovduVg2iskuE3rUUZK8Fsz
R2_SECRET_ACCESS_KEY=6f2c127a24681e2efc430d39779da7b6
R2_ENDPOINT=456f491ab34e78bd39ac0318ca14a4cf152c4723ec39d30cf67e137166183482
R2_BUCKET_NAME=aiphoto-images
```

## 功能说明

1. **图片编辑页面**: `/edit-image` - 用户上传图片并进行AI编辑
2. **Cloudflare R2 集成**: 上传的图片会自动存储到您的R2存储桶中
3. **文件限制**: 支持最大5MB的图片文件
4. **支持格式**: 所有常见图片格式 (jpg, png, gif, webp等)

## 使用流程

1. 用户点击首页的 "Get Started" 按钮
2. 跳转到图片编辑页面
3. 上传参考图片（最多5张）
4. 输入编辑描述
5. 点击 "Generate Now" 生成新图片
6. 图片自动上传到Cloudflare R2存储

## 注意事项

- 确保R2存储桶已创建并配置了正确的权限
- 如果使用自定义域名，请更新 `lib/r2.ts` 中的URL配置
- 建议在生产环境中使用环境变量而不是硬编码凭证
