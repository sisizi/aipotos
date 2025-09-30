# 多语言 (i18n) 配置说明

## 已完成的工作

### 1. 配置文件
- ✅ **[i18n/routing.ts](i18n/routing.ts)** - 路由配置，支持 `en` (英语) 和 `zh` (中文)
- ✅ **[i18n/request.ts](i18n/request.ts)** - 请求配置，加载翻译文件
- ✅ **[middleware.ts](middleware.ts)** - 中间件，自动处理语言路由

### 2. 翻译文件
- ✅ **[messages/en.json](messages/en.json)** - 英文翻译
- ✅ **[messages/zh.json](messages/zh.json)** - 中文翻译

### 3. 组件更新
- ✅ **[component/LanguageSwitcher.tsx](component/LanguageSwitcher.tsx)** - 语言切换组件
- ✅ **[component/Header.tsx](component/Header.tsx)** - 已集成语言切换器和翻译
- ✅ **[component/HeroSection.tsx](component/HeroSection.tsx)** - 已使用翻译

### 4. 项目结构
- ✅ 所有页面移动到 `app/[locale]/` 目录
- ✅ 更新了 [next.config.ts](next.config.ts) 集成 next-intl 插件
- ✅ 更新了 [app/[locale]/layout.tsx](app/[locale]/layout.tsx) 支持动态语言

## URL 结构
- 英文页面: `http://localhost:3001/en/`
- 中文页面: `http://localhost:3001/zh/`
- 根路径 `/` 会自动重定向到默认语言 `/en/`

## 如何使用

### 1. 在客户端组件中使用翻译
```tsx
'use client';
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('nav'); // 使用 'nav' 命名空间

  return (
    <div>
      <h1>{t('home')}</h1>
      <button>{t('login')}</button>
    </div>
  );
}
```

### 2. 使用国际化路由
```tsx
import { Link } from '@/i18n/routing'; // 使用 i18n 的 Link

export default function MyComponent() {
  return (
    <Link href="/edit-image">
      Go to Edit Page
    </Link>
  );
}
```

### 3. 添加新的翻译
在 `messages/en.json` 和 `messages/zh.json` 中添加新的键值对：

**messages/en.json:**
```json
{
  "mySection": {
    "title": "My Title",
    "description": "My Description"
  }
}
```

**messages/zh.json:**
```json
{
  "mySection": {
    "title": "我的标题",
    "description": "我的描述"
  }
}
```

### 4. 在组件中使用新翻译
```tsx
const t = useTranslations('mySection');
<h1>{t('title')}</h1>
<p>{t('description')}</p>
```

## 已有的翻译键

### nav (导航)
- `home`, `features`, `pricing`, `about`, `login`, `logout`, `loading`

### hero (首页主区域)
- `title`, `subtitle`, `description`, `cta`

### useCases (使用场景)
- `title`, `subtitle`
- `novelComic.title`, `novelComic.description`
- `businessPhoto.title`, `businessPhoto.description`
- `personalPhoto.title`, `personalPhoto.description`
- `poster.title`, `poster.description`

### proModel (Pro/Max 模型)
- `title`, `subtitle`, `pro`, `max`, `likes`, `views`

### common (通用)
- `learnMore`, `getStarted`, `loading`, `error`

## 测试
开发服务器已启动在 http://localhost:3001

- 访问 http://localhost:3001/en/ 查看英文版
- 访问 http://localhost:3001/zh/ 查看中文版
- 点击页面右上角的语言切换按钮 (EN / 中文) 进行切换

## 下一步
如果需要添加更多组件的翻译支持，请按照以下步骤：
1. 在 `messages/en.json` 和 `messages/zh.json` 中添加翻译键
2. 在组件中导入 `useTranslations` hook
3. 使用 `t('key')` 替换硬编码的文本