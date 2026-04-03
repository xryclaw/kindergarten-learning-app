# 幼儿园学习乐园 🌟

一个专为幼儿园小朋友设计的互动学习 Web 应用，包含汉字学习、拼音练习、互动测验和学习卡片四个模块。

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

## 🚀 部署到腾讯云服务器

当前项目采用“本地或 GitHub Actions 构建，云服务器只托管静态文件”的方式部署。

### 目录结构

服务器上的发布目录约定为：

```bash
/var/www/kindergarten-learning-app/
├── releases/
│   ├── 20260403T010000Z-abcdef1/
│   └── 20260403T013000Z-1234567/
└── current -> /var/www/kindergarten-learning-app/releases/20260403T013000Z-1234567
```

这样做的好处是：

- 部署是原子切换，不会出现半更新状态
- 回滚很简单，只需要把 `current` 指回旧版本
- 服务器不需要 Node.js 运行时

### 一次性初始化服务器

先复制一份部署配置：

```bash
cp .env.deploy.example .env.deploy.local
```

然后执行：

```bash
npm run server:bootstrap
```

这个脚本会在服务器上安装 `nginx` 和 `rsync`，创建站点目录，并写入 Nginx 配置。

如果你想从公网直接访问，还需要在腾讯云控制台的安全组里放行 `TCP 80`。

### 手动部署

```bash
npm run deploy
```

默认流程：

1. 本地执行 `npm run build`
2. 通过 `rsync` 上传 `dist/`
3. 生成新的 release 目录
4. 切换 `current` 软链接到新版本

如果你已经提前构建过，可以跳过构建：

```bash
npm run deploy -- --skip-build
```

### GitHub Actions 自动部署

仓库内已包含 [`.github/workflows/deploy.yml`](/Users/xry/kindergarten-learning-app/.github/workflows/deploy.yml)。

你需要在 GitHub 仓库 Secrets 中配置：

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_PORT`
- `DEPLOY_REMOTE_ROOT`
- `DEPLOY_SERVER_NAME`
- `DEPLOY_SSH_KEY`

推送到 `main` 后，Actions 会自动执行：

1. `npm ci`
2. `npm test`
3. `npm run build`
4. 部署到腾讯云服务器

## 📝 技术栈

- Vue 3 + Vite
- 纯前端实现，无需后端运行时
- 响应式设计，支持手机/平板/电脑
