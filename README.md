# 幼儿园学习乐园 🌟

一个专为幼儿园小朋友设计的互动学习 Web 应用，包含汉字学习、拼音练习、互动测验和学习卡片四个模块。

## 🚀 在线预览

**GitHub Pages**: https://[你的用户名].github.io/kindergarten-learning-app/

## 📦 功能模块

- ✍️ **汉字学习** - 《江南》古诗认字、田字格书写练习
- 🔤 **拼音练习** - 整体认读音节、复韵母、拼音配对游戏
- 🎯 **互动测验** - 8道趣味题目，星级评分系统
- 🎴 **学习卡片** - 翻转卡片、记忆翻牌游戏

## 🛠️ 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📤 部署到 GitHub Pages

### 方法一：GitHub Actions 自动部署（推荐）

1. 在 GitHub 创建仓库 `kindergarten-learning-app`
2. 推送代码到仓库
3. 进入 Settings → Pages → Source 选择 "GitHub Actions"
4. 自动部署完成！

### 方法二：手动部署

```bash
# 构建
npm run build

# 部署 dist 文件夹到 gh-pages 分支
npx gh-pages -d dist
```

## 🌐 其他免费部署选项

| 平台 | 特点 | 部署方式 |
|------|------|----------|
| **Vercel** | 自动部署，国内访问快 | 连接 GitHub 仓库 |
| **Netlify** | 拖拽部署，功能丰富 | 拖拽 dist 文件夹 |
| **Cloudflare Pages** | 全球 CDN，速度快 | 连接 GitHub 仓库 |

## 📝 技术栈

- Vue 3 + Vite
- 纯前端实现，无需后端
- 响应式设计，支持手机/平板/电脑
