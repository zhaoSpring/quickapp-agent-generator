# AI 驱动的快应用智能体生成器工作流程

## 概述

quickapp-agent-generator 采用完全 AI 驱动的方式，通过 LLM 智能理解 API 配置并自动生成快应用项目。用户只需提供 curl 命令和响应示例，AI 会自动提取所有配置信息并生成完整的项目代码。

## 核心优势

### 🎯 完全 AI 驱动
- ✅ LLM 完整理解 curl 命令的所有部分（URL、方法、请求头、请求体）
- ✅ 自动识别动态字段（用户问题、会话ID等）
- ✅ 智能推断响应字段路径（支持复杂嵌套结构）
- ✅ 自动生成请求模板（将动态值替换为占位符）
- ✅ 保留所有静态配置（model、temperature 等）

### 🚀 用户体验优化
- ✅ 无需手动配置复杂字段
- ✅ 支持任意复杂的 API 格式
- ✅ 自动处理 OpenAI、通义千问等主流格式
- ✅ 一次配置，立即可用

## 完整工作流程

### 步骤 1: 用户输入基本信息

用户提供项目的基本信息：

```
项目名称: my-ai-agent
项目描述: 基于 GPT-4 的智能助手
包名: com.example.myagent
```

### 步骤 2: 粘贴 curl 命令

用户直接粘贴完整的 curl 命令，包括所有请求头和请求体：

```bash
curl --location 'https://api.openai.com/v1/chat/completions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer sk-proj-xxx' \
--data '{
  "model": "gpt-4",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2000
}'
```

**AI 自动提取：**
- API URL: `https://api.openai.com/v1/chat/completions`
- HTTP 方法: `POST`
- 所有请求头（包括 Authorization）
- 完整的请求体结构
- 流式响应标识: `stream: true`
- 动态字段路径: `messages[user].content`

### 步骤 3: 粘贴响应示例

用户提供 API 的响应示例（支持流式和非流式）：

**流式响应示例：**
```
data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"你"}}]}
data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"好"}}]}
data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"！"}}]}
data: [DONE]
```

**AI 自动分析：**
- 响应格式: OpenAI SSE 格式
- 内容字段路径: `choices[0].delta.content`
- 消息ID字段: `id`
- 流式响应: `true`

### 步骤 4: 配置智能体信息

用户提供智能体的展示信息：

```
智能体名称: GPT-4 助手
智能体描述: 基于 GPT-4 的智能对话助手
智能体图标: https://example.com/icon.png
开场问题:
  1. 你好，有什么可以帮助你的吗？
  2. 今天天气怎么样？
  3. 推荐一些好书
```

### 步骤 5: AI 生成项目

AI 自动完成以下工作：

#### 5.1 生成 API 配置文件

**生成 `src/common/apiConfig.js`：**

```javascript
export default {
  // API 基础配置
  baseUrl: 'https://api.openai.com',
  endpoint: '/v1/chat/completions',
  method: 'POST',
  isStream: true,
  
  // 请求体模板（动态字段已替换为占位符）
  requestTemplate: {
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "{{question}}"}  // 自动替换
    ],
    "stream": true,
    "temperature": 0.7,
    "max_tokens": 2000
  },
  
  // 响应体字段映射
  responseMapping: {
    content: 'choices[0].delta.content',  // AI 推断的路径
    messageId: 'id',
    stage: 'stage',
    contentType: 'contentType',
    status: 'status',
    message: 'message',
  },
  
  // 智能体配置
  agentConfig: {
    id: 'my-ai-agent',
    name: 'GPT-4 助手',
    description: '基于 GPT-4 的智能对话助手',
    icon: 'https://example.com/icon.png',
    openingQuestions: [
      '你好，有什么可以帮助你的吗？',
      '今天天气怎么样？',
      '推荐一些好书'
    ],
  },
  
  // 请求头配置（完整保留）
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-proj-xxx"
  },
  
  needCookie: false,
}
```

#### 5.2 生成其他配置文件

- `package.json` - 项目配置
- `src/manifest.json` - 应用清单
- `README.md` - 项目说明

#### 5.3 复制模板文件

- 复制 UI 组件（聊天界面、Markdown 渲染等）
- 复制公共模块（API 调用、请求处理等）
- 复制资源文件（图标、样式等）

## AI Agent 详解

### ConfigParserAgent - 配置解析

**功能 1: 解析 curl 命令**

```typescript
async parseCurlOrConfig(input: string): Promise<Partial<ParsedConfig>>
```

**LLM Prompt：**
```
你是一个 API 配置解析专家。请仔细分析以下 curl 命令，提取所有信息。

任务：
1. 提取完整的 API URL
2. 提取 HTTP 方法（GET/POST/PUT/DELETE 等）
3. 提取所有请求头（headers），包括 Authorization、Content-Type、Cookie 等
4. 提取完整的请求体（body），保持原始结构
5. 判断是否为流式响应
6. 识别请求体中的动态字段（如用户问题、会话ID等）
```

**返回结果：**
```json
{
  "apiUrl": "https://api.openai.com/v1/chat/completions",
  "apiMethod": "POST",
  "isStream": true,
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-proj-xxx"
  },
  "requestBody": {
    "model": "gpt-4",
    "messages": [...],
    "stream": true,
    "temperature": 0.7
  },
  "dynamicFields": {
    "questionPath": "messages[user].content",
    "sessionIdPath": null
  }
}
```

**功能 2: 分析响应结构**

```typescript
async inferFieldMapping(responseExample: string): Promise<any>
```

**LLM Prompt：**
```
你是一个 API 响应结构分析专家。请仔细分析以下响应示例，找出所有关键字段的精确路径。

任务：
1. 判断响应格式（流式 SSE 或普通 JSON）
2. 找出对话内容字段的完整路径
3. 找出消息ID、阶段、内容类型等字段的路径
4. 识别错误处理相关字段
```

**返回结果：**
```json
{
  "isStreamResponse": true,
  "responseFormat": "OpenAI SSE 格式",
  "content": "choices[0].delta.content",
  "messageId": "id",
  "stage": "stage",
  "contentType": "contentType",
  "status": "status",
  "message": "message",
  "explanation": "标准的 OpenAI 流式响应格式，内容在 choices 数组的 delta.content 中"
}
```

### TemplateFillerAgent - 模板填充

**功能 1: 生成模板变量**

```typescript
async generateTemplateVars(userConfig: any): Promise<TemplateVars>
```

**LLM Prompt：**
```
你是一个快应用配置专家。请分析用户配置，生成完整的模板变量。

任务：
1. 从 apiUrl 中分离出 baseUrl 和 endpoint
2. 将请求体中的动态值替换为占位符：
   - 用户问题字段 → {{question}}
   - 会话ID字段 → {{sessionId}}
   - 保持其他字段原样（如 stream, model, temperature 等）
3. 保留所有请求头
4. 生成完整的模板变量
```

**返回结果：**
```json
{
  "PROJECT_NAME": "my-ai-agent",
  "API_BASE_URL": "https://api.openai.com",
  "API_ENDPOINT": "/v1/chat/completions",
  "API_METHOD": "POST",
  "IS_STREAM": true,
  "REQUEST_TEMPLATE": {
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "{{question}}"}
    ],
    "stream": true,
    "temperature": 0.7
  },
  "REQUEST_HEADERS": {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-proj-xxx"
  },
  "RESPONSE_CONTENT_FIELD": "choices[0].delta.content",
  ...
}
```

**功能 2: 填充模板文件**

```typescript
async fillTemplate(templatePath: string, vars: TemplateVars): Promise<string>
```

**LLM Prompt：**
```
你是一个模板填充专家。请将以下模板变量填充到模板文件中。

任务：
1. 将模板中的 {{占位符}} 替换为对应的变量值
2. 对于 REQUEST_TEMPLATE 和 REQUEST_HEADERS，直接替换为 JSON 对象（不要加引号）
3. 对于 IS_STREAM 和 NEED_COOKIE，替换为布尔值（不要加引号）
4. 保持代码格式和缩进
```

## 支持的 API 格式

### 1. OpenAI 格式

**请求：**
```json
{
  "model": "gpt-4",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "stream": true
}
```

**响应：**
```
data: {"choices":[{"delta":{"content":"Hi"}}]}
```

**AI 识别：**
- 动态字段: `messages[user].content`
- 内容路径: `choices[0].delta.content`

### 2. 通义千问格式

**请求：**
```json
{
  "model": "qwen-max",
  "input": {
    "messages": [
      {"role": "user", "content": "你好"}
    ]
  }
}
```

**响应：**
```json
{
  "output": {
    "text": "你好！"
  }
}
```

**AI 识别：**
- 动态字段: `input.messages[user].content`
- 内容路径: `output.text`

### 3. 自定义格式

AI 可以自动适应任何自定义的 API 格式，无需手动配置。

## 使用示例

### 1. 测试 LLM 连接

```bash
npm run test-llm
```

输出：
```
🧪 测试 LLM 连接

配置:
  Model: gpt-4
  Base URL: https://api.openai.com/v1

发送测试消息...

✅ 连接成功！
⏱️  响应时间: 1.23秒

📝 响应:
I am an AI assistant powered by OpenAI.

✨ LLM 配置正常，可以运行: npm run generate
```

### 2. 生成项目

```bash
npm run generate
```

交互流程：
```
=== 快应用智能体生成器 ===

步骤 1/4: 收集配置信息
项目名称: my-openai-agent
项目描述: 基于 OpenAI 的智能助手
包名: com.example.openai

步骤 2/4: AI 智能解析配置
请粘贴 curl 命令: [粘贴完整 curl]
AI 正在深度分析 API 配置... ✓

请提供响应示例: [粘贴响应]
AI 正在深度分析响应结构... ✓

步骤 3/4: AI 生成模板配置
AI 正在生成模板变量和请求模板... ✓

步骤 4/4: 生成项目文件
复制模板文件... ✓
填充模板文件... ✓

✓ 项目生成成功！

项目已生成到: output/my-openai-agent

下一步:
1. cd output/my-openai-agent
2. npm install
3. npm run watch
```

## 技术架构

### 核心技术栈

- **LangChain** - LLM 应用框架
- **OpenAI API** - 大语言模型
- **TypeScript** - 类型安全
- **Handlebars** - 模板引擎（降级方案）

### 项目结构

```
quickapp-agent-generator/
├── src/
│   ├── agents/                    # AI Agent
│   │   ├── ConfigParserAgent.ts   # 配置解析
│   │   └── TemplateFillerAgent.ts # 模板填充
│   ├── prompts/                   # 用户交互
│   │   └── collector.ts           # 输入收集
│   ├── types/                     # 类型定义
│   │   └── index.ts
│   └── index.ts                   # 主入口
├── template/                      # 项目模板
│   ├── src/
│   │   ├── pages/                 # 页面
│   │   ├── components/            # 组件
│   │   ├── common/                # 公共模块
│   │   └── manifest.json          # 应用清单
│   ├── package.json
│   └── README.md
├── test-llm.ts                    # LLM 连接测试
├── package.json
└── README.md
```

## 配置说明

### 环境变量 (.env)

```env
# LLM 配置
MODEL_NAME=gpt-4                              # 模型名称
OPENAI_API_KEY=sk-xxx                         # API 密钥
OPENAI_BASE_URL=https://api.openai.com/v1    # API 地址
TEMPERATURE=0.7                               # 温度参数

# 可选：自定义请求头（用于 Mify AI 等服务）
X_MODEL_PROVIDER_ID=your-provider-id
X_MODEL_REQUEST_ID=your-request-id
```

### 支持的 LLM

- OpenAI GPT-4 / GPT-4 Turbo
- OpenAI GPT-3.5 Turbo
- Azure OpenAI
- 兼容 OpenAI API 的自部署模型
- Mify AI 等第三方服务

## 最佳实践

### 1. 准备完整的 curl 命令

✅ 包含所有请求头（特别是 Authorization）
✅ 包含完整的请求体
✅ 保持原始格式，不要手动修改

### 2. 提供真实的响应示例

✅ 使用实际 API 返回的响应
✅ 流式响应包含多行 data: 前缀
✅ 包含完整的字段结构

### 3. 选择合适的 LLM

✅ 推荐使用 GPT-4 或更强的模型
✅ GPT-3.5 可能在复杂场景下准确率较低
✅ 确保 API 配额充足

### 4. 验证生成的配置

✅ 检查 `src/common/apiConfig.js`
✅ 确认请求模板中的占位符正确
✅ 确认响应字段路径准确

## 故障排除

### LLM 连接失败

```bash
npm run test-llm
```

检查：
- API 密钥是否正确
- Base URL 是否可访问
- 网络连接是否正常

### 配置解析不准确

可能原因：
- curl 命令格式不完整
- 响应示例不真实
- LLM 模型能力不足

解决方案：
- 使用完整的 curl 命令
- 提供真实的 API 响应
- 升级到 GPT-4 模型

### 生成的项目无法运行

检查：
- `src/common/apiConfig.js` 中的配置
- API 密钥是否有效
- 响应字段路径是否正确

## 总结

quickapp-agent-generator 通过完全 AI 驱动的方式，实现了：

✅ **零配置** - 无需手动填写复杂字段
✅ **高准确率** - AI 理解语义，避免信息丢失
✅ **强适应性** - 支持任意复杂的 API 格式
✅ **快速生成** - 2-3 分钟完成项目搭建

让快应用开发更简单、更高效！
