# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## 项目说明

这是一个基于快应用框架开发的 AI 智能体应用，使用动态 API 配置系统，支持任意 API 结构。

## 功能特性

- ✅ 基础聊天界面
- ✅ 消息发送和接收
- ✅ Markdown 渲染
- ✅ 代码块高亮
- ✅ 流式响应支持
- ✅ 首页引导
- ✅ 新建会话
- ✅ 思考状态提示
- ✅ 网络状态监听
- ✅ 图片预览

## 技术栈

- 快应用框架
- Less CSS 预处理器
- Marked (Markdown 解析)
- Highlight.js (代码高亮)

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run watch
```

### 构建

```bash
npm run build
```

### 发布

```bash
npm run release
```

## API 配置

API 配置文件位于 `src/common/apiConfig.js`，包含以下配置：

- `baseUrl`: API 基础 URL
- `endpoint`: API 端点
- `method`: 请求方法 (GET/POST)
- `isStream`: 是否为流式响应
- `requestTemplate`: 请求体模板
- `responseMapping`: 响应体字段映射
- `agentConfig`: 智能体配置

### 请求体模板

支持以下占位符：
- `{{sessionId}}`: 会话 ID
- `{{question}}`: 用户问题
- `{{botId}}`: 智能体 ID

### 响应体字段映射

定义如何从响应中提取数据：
- `stage`: 阶段字段 (THINKING, ANSWERING)
- `content`: 内容字段
- `contentType`: 内容类型字段 (TEXT, WEB_PAGE)
- `messageId`: 消息 ID 字段
- `status`: 错误状态字段
- `message`: 错误消息字段

## 目录结构

```
.
├── src/
│   ├── pages/
│   │   └── Index/          # 主聊天页面
│   ├── components/         # 组件
│   │   ├── container.ux
│   │   ├── titleBar.ux
│   │   ├── homeIntro.ux
│   │   ├── markdown.ux
│   │   ├── codeBlock.ux
│   │   ├── thinkingIndicator.ux
│   │   └── newChatDialog.ux
│   ├── common/            # 公共模块
│   │   ├── api.js
│   │   ├── apiConfig.js
│   │   ├── apiHelper.js
│   │   └── request.js
│   ├── constants/         # 常量定义
│   ├── assets/           # 资源文件
│   ├── app.ux           # 应用入口
│   └── manifest.json    # 应用配置
├── package.json
├── babel.config.js
└── hap.config.js
```

## 许可证

MIT
