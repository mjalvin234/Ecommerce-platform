# 芯核交易中心

这是一个基于 `Vite + React + TypeScript` 的前端演示项目，已经整理为同时支持以下三种本地使用方式：

1. 直接演示：双击离线演示 HTML
2. 开发模式：启动本地开发服务进行调试
3. 离线构建：生成单文件 HTML 后，再双击在本机打开

**目录说明**：本目录 `可以分享/` 为可对外提供的工程根目录；上级目录中的 `不可以分享/` 仅作「勿提交密钥」说明，不含运行源码。所有 `npm` 命令请在本目录（`可以分享`）下执行。

## 当前目录结构

```text
.
├── 00_双击打开演示.html      # 推荐发给客户的直接演示入口
├── index.html                 # Vite 开发入口
├── open-local.command         # macOS 下双击自动打开可用页面
├── package.json               # 项目脚本
├── package-lock.json
├── tsconfig.json
├── vite.config.ts             # Vite 配置，已支持相对路径构建
├── .env.example               # 环境变量示例（勿将真实 .env 提交到 Git）
├── metadata.json
├── scripts/
│   └── build-offline.cjs      # 生成离线 HTML
├── src/                       # React 源码
├── miniprogram/               # 微信小程序（开发者工具请打开此目录）
└── README.md
```

## 方式一：直接双击演示

如果你的目标是“把整个文件夹发给别人，对方直接双击即可演示”，推荐直接使用：

```text
00_双击打开演示.html
```

这个文件不依赖 Node.js，不需要安装环境，适合直接发客户或做本地展示。

在 macOS 下，也可以双击：

```text
open-local.command
```

## 方式二：开发模式

前提：本机已安装 Node.js

```bash
npm install
npm run dev
```

启动后访问终端提示的本地地址，默认通常为 `http://localhost:3000`。

## 方式三：离线构建后本地打开

前提：本机已安装 Node.js，并已先完成一次构建

```bash
npm install
npm run build:offline
```

构建完成后，项目根目录会生成：

```text
B2B_Demo_Offline.html
```

此时有两种打开方式：

```bash
open B2B_Demo_Offline.html
```

## 说明

- `00_双击打开演示.html` 是纯静态离线演示页，适合交付给不会运行前端环境的用户。
- `vite.config.ts` 已使用 `base: './'`，适合本地相对路径打开。
- `scripts/build-offline.cjs` 会把构建结果整理成单文件 HTML，便于交付和演示。
- `open-local.command` 会优先打开 `00_双击打开演示.html`，其次再尝试构建产物。
- 微信小程序：在微信开发者工具中选择「导入项目」，**项目目录**请选本文件夹下的 `miniprogram`。
