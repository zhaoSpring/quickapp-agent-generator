# 快应用智能体生成器 - AI 驱动

quickapp-agent-generator 采用完全 AI 驱动的方式，通过 LLM 智能理解 API 配置并自动生成快应用项目。用户只需提供 curl 命令和响应示例，AI 会自动提取所有配置信息并生成完整的项目代码。

## 🚀 特性

- ✅ **完整信息提取**：LLM 理解 curl 命令的所有部分，不遗漏任何请求头或参数
- ✅ **智能字段识别**：自动识别动态字段（问题、会话ID），处理复杂格式（如 OpenAI messages）
- ✅ **精确路径推断**：深度分析响应结构，识别嵌套字段路径（如 `choices[0].delta.content`）
- ✅ **智能模板生成**：将动态值替换为占位符，保持静态配置原样
- ✅ **零手动配置**：只需提供 curl 命令和响应示例，AI 自动完成所有配置

## 📦 安装

### 全局安装（推荐）

```bash
npm install -g quickapp-agent-generator
```

### 使用 npx（无需安装）

```bash
npx quickapp-agent-generator
```

### 本地开发

```bash
git clone <repository-url>
cd quickapp-agent-generator
npm install
```

## 🎯 快速开始

### 1. 配置 AI 模型

首次使用需要配置 AI 模型。在项目根目录或用户目录创建 `.env` 文件：

```env
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
MODEL_NAME=gpt-4
```

或使用兼容的 API：

```env
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=http://model.mify.ai.srv/v1
MODEL_NAME=gpt-5
X_MODEL_PROVIDER_ID=azure_openai
X_MODEL_REQUEST_ID=1234
```

### 2. 运行生成器

```bash
# 全局安装后
quickapp-agent

# 或使用 npx
npx quickapp-agent-generator

# 本地开发
npm run generate
```

### 3. 按照提示输入配置

按照交互式提示输入配置，可以直接粘贴 curl 命令，AI 会自动解析。

## 💡 使用示例

### 步骤 1：粘贴完整的 curl 命令

```bash
curl --location 'https://api.openai.com/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-xxx' \
--data '{
  "model": "gpt-4",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true
}'
```

**AI 自动提取：**
- ✅ URL: `https://api.openai.com/v1/chat/completions`
- ✅ 方法: `POST`
- ✅ 所有请求头（包括 Authorization）
- ✅ 完整请求体结构
- ✅ 识别动态字段：`messages[user].content` → `{{question}}`
- ✅ 保留静态配置：`model`,  `stream`

### 步骤 2：粘贴响应示例

```
data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"你"}}]}
data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"好"}}]}
data: [DONE]
```

**AI 自动推断：**
- ✅ 响应格式：OpenAI SSE 格式
- ✅ 内容路径：`choices[0].delta.content`
- ✅ 消息ID路径：`id`
- ✅ 流式响应：`true`

### 步骤 3：生成完整项目

AI 自动生成 `apiConfig.js`：

```javascript
export default {
    baseUrl: 'https://api.openai.com',
    endpoint: '/v1/chat/completions',
    method: 'POST',
    isStream: true,
    requestTemplate: {
        "model": "gpt-4",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "{{question}}"}  // 自动替换为占位符
        ],
        "stream": true
    },
    headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer sk-xxx"
    },
    responseMapping: {
        content: 'choices[0].delta.content',  // AI 推断的路径
        messageId: 'id'
    }
}
```

## 🏗️ AI 工作流程

```
用户输入 curl 命令
        ↓
ConfigParserAgent.parseCurlOrConfig()
    → LLM 提取：URL、方法、请求头、请求体、动态字段
        ↓
ConfigParserAgent.inferFieldMapping()
    → LLM 分析响应结构，推断字段路径
        ↓
TemplateFillerAgent.generateTemplateVars()
    → LLM 生成模板变量，将动态值替换为占位符
        ↓
TemplateFillerAgent.fillTemplate()
    → LLM 填充模板文件
        ↓
生成完整的快应用项目
```

## 📁 项目结构

```
quickapp-agent-generator/
├── src/
│   ├── agents/                      # AI Agents
│   │   ├── ConfigParserAgent.ts    # LLM 解析 curl 和响应
│   │   └── TemplateFillerAgent.ts  # LLM 生成模板变量和填充
│   ├── prompts/                     # 用户输入收集
│   │   └── collector.ts            # 简化的输入流程
│   └── index.ts                     # 主入口
├── template/                        # 快应用模板
├── output/                          # 生成的项目
├── AI_WORKFLOW.md                   # AI 流程详细文档
└── .env                             # AI 模型配置
```

## 生成的项目

```
my-agent/
├── src/
│   ├── pages/Index/        # 聊天页面
│   ├── components/         # UI 组件
│   ├── common/
│   │   └── apiConfig.js    # API 配置（AI 生成）
│   └── manifest.json
├── package.json
└── hap.config.js
```

## 📚 可用命令

```bash
npm run generate    # 生成项目（AI 驱动）
npm run test-llm   # 测试 AI 连接
npm run dev         # 开发模式
npm run build       # 构建
```

## 开发生成的项目

```bash
cd output/your-project-name
npm install
npm run start
```

## 📚 可用命令

### 全局安装后

```bash
quickapp-agent          # 生成新项目
```

### 本地开发

```bash
npm run generate        # 生成项目（AI 驱动）
npm run test-llm       # 测试 AI 连接
npm run dev            # 开发模式
npm run build          # 构建
```

## 📋 发布到 npm

如果你想发布自己的版本：

```bash
# 1. 登录 npm
npm login

# 2. 更新版本号
npm version patch  # 或 minor, major

# 3. 发布
npm publish
```

## 🔧 技术栈

- **LangChain**: AI Agent 框架
- **OpenAI GPT**: 配置解析和模板生成
- **TypeScript**: 类型安全
- **快应用**: 目标平台

## 📝 许可证

MIT
