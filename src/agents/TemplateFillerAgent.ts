/**
 * 模板填充 Agent - 智能生成模板变量
 */

import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface TemplateVars {
    // 项目基础信息
    PROJECT_NAME: string
    PROJECT_DESCRIPTION: string
    PACKAGE_NAME: string
    APP_NAME: string

    // API 配置
    API_BASE_URL: string
    API_ENDPOINT: string
    API_METHOD: string
    IS_STREAM: boolean
    REQUEST_TEMPLATE: string
    REQUEST_HEADERS: string
    NEED_COOKIE: boolean

    // 响应字段映射
    RESPONSE_STAGE_FIELD: string
    RESPONSE_CONTENT_FIELD: string
    RESPONSE_CONTENT_TYPE_FIELD: string
    RESPONSE_MESSAGE_ID_FIELD: string
    RESPONSE_STATUS_FIELD: string
    RESPONSE_MESSAGE_FIELD: string

    // 智能体配置
    AGENT_ID: string
    AGENT_NAME: string
    AGENT_DESCRIPTION: string
    AGENT_ICON: string
    OPENING_QUESTION_1: string
    OPENING_QUESTION_2: string
    OPENING_QUESTION_3: string
}

export class TemplateFillerAgent {
    private llm: ChatOpenAI
    private templateDir: string

    constructor() {
        this.llm = new ChatOpenAI({
            model: process.env.MODEL_NAME || 'gpt-5',
            apiKey: process.env.OPENAI_API_KEY,
            configuration: {
                baseURL: process.env.OPENAI_BASE_URL,
                defaultHeaders: {
                    // 支持自定义请求头（用于 Mify AI 等服务）
                    ...(process.env.X_MODEL_PROVIDER_ID && {
                        'X-Model-Provider-Id': process.env.X_MODEL_PROVIDER_ID,
                    }),
                    ...(process.env.X_MODEL_REQUEST_ID && {
                        'X-Model-Request-Id': process.env.X_MODEL_REQUEST_ID,
                    }),
                },
            },
        })
        this.templateDir = path.join(__dirname, '../../template')
    }

    /**
     * 核心方法：使用 LLM 理解配置并生成请求模板
     */
    async generateTemplateVars(userConfig: any): Promise<TemplateVars> {
        console.log('🤖 使用 LLM 生成模板变量和请求模板...')

        const parser = new JsonOutputParser()

        const prompt = PromptTemplate.fromTemplate(`
你是一个快应用配置专家。请分析用户配置，生成完整的模板变量。

用户配置：
{config}

任务：
1. 从 apiUrl 中分离出 baseUrl 和 endpoint
2. 将请求体中的动态值替换为占位符：
   - 用户问题字段 → {{{{question}}}}
   - 会话ID字段 → {{{{sessionId}}}}
   - 保持其他字段原样（如 stream, model, temperature 等）
3. 保留所有请求头
4. 生成完整的模板变量

返回 JSON 格式：
{{
  "PROJECT_NAME": "项目名称",
  "PROJECT_DESCRIPTION": "项目描述",
  "PACKAGE_NAME": "包名",
  "APP_NAME": "应用名称（通常与智能体名称相同）",
  "API_BASE_URL": "API 基础 URL（如 https://api.example.com）",
  "API_ENDPOINT": "API 端点路径（如 /v1/chat/completions）",
  "API_METHOD": "HTTP 方法",
  "IS_STREAM": true 或 false,
  "REQUEST_TEMPLATE": "请求体模板（JSON 对象，将动态字段替换为占位符）",
  "REQUEST_HEADERS": "请求头（JSON 对象，保留所有头）",
  "NEED_COOKIE": true 或 false（如果请求头包含 Cookie 则为 true）,
  "RESPONSE_STAGE_FIELD": "响应中的阶段字段路径",
  "RESPONSE_CONTENT_FIELD": "响应中的内容字段路径",
  "RESPONSE_CONTENT_TYPE_FIELD": "响应中的内容类型字段路径",
  "RESPONSE_MESSAGE_ID_FIELD": "响应中的消息ID字段路径",
  "RESPONSE_STATUS_FIELD": "响应中的状态字段路径",
  "RESPONSE_MESSAGE_FIELD": "响应中的消息字段路径",
  "AGENT_ID": "智能体ID",
  "AGENT_NAME": "智能体名称",
  "AGENT_DESCRIPTION": "智能体描述",
  "AGENT_ICON": "智能体图标URL",
  "OPENING_QUESTION_1": "开场问题1",
  "OPENING_QUESTION_2": "开场问题2",
  "OPENING_QUESTION_3": "开场问题3"
}}

重要提示：
- REQUEST_TEMPLATE 必须是 JSON 对象（不是字符串）
- REQUEST_HEADERS 必须是 JSON 对象（不是字符串）
- 对于 OpenAI messages 格式，将 messages 数组中 role="user" 的 content 替换为 {{{{question}}}}
- 保持请求体的完整结构，只替换动态值
- API_BASE_URL 只包含协议和域名，API_ENDPOINT 包含路径和查询参数
- 如果请求头包含 Cookie，NEED_COOKIE 设为 true

示例：
原始请求体：
{{"question": "你好", "stream": true, "model": "gpt-4"}}

生成模板：
{{"question": "{{{{question}}}}", "stream": true, "model": "gpt-4"}}

{format_instructions}
`)

        const chain = prompt.pipe(this.llm).pipe(parser)

        try {
            const result = await chain.invoke({
                config: JSON.stringify(userConfig, null, 2),
                format_instructions: parser.getFormatInstructions()
            })

            console.log('✓ 模板变量生成完成')

            // 确保 REQUEST_TEMPLATE 和 REQUEST_HEADERS 是对象
            if (typeof result.REQUEST_TEMPLATE === 'string') {
                result.REQUEST_TEMPLATE = JSON.parse(result.REQUEST_TEMPLATE)
            }
            if (typeof result.REQUEST_HEADERS === 'string') {
                result.REQUEST_HEADERS = JSON.parse(result.REQUEST_HEADERS)
            }

            return result as TemplateVars
        } catch (error) {
            console.error('❌ LLM 生成失败:', error)
            throw new Error('LLM 生成模板变量失败，请检查配置格式')
        }
    }


    // 从完整 URL 提取 baseUrl
    private extractBaseUrl(url: string): string {
        try {
            const urlObj = new URL(url)
            return `${urlObj.protocol}//${urlObj.host}`
        } catch {
            return 'https://api.example.com'
        }
    }

    // 从完整 URL 提取 endpoint
    private extractEndpoint(url: string): string {
        try {
            const urlObj = new URL(url)
            return urlObj.pathname + urlObj.search
        } catch {
            return '/chat'
        }
    }

    /**
     * 使用 LLM 填充模板文件
     */
    async fillTemplate(templatePath: string, vars: TemplateVars): Promise<string> {
        const fullPath = path.join(this.templateDir, templatePath)
        const templateContent = fs.readFileSync(fullPath, 'utf-8')

        console.log(`🤖 使用 LLM 填充模板: ${templatePath}`)

        const prompt = PromptTemplate.fromTemplate(`
你是一个模板填充专家。请将以下模板变量填充到模板文件中。

模板文件内容：
{template}

模板变量：
{vars}

任务：
1. 将模板中的 {{{{占位符}}}} 替换为对应的变量值
2. 对于 REQUEST_TEMPLATE 和 REQUEST_HEADERS，直接替换为 JSON 对象（不要加引号）
3. 对于 IS_STREAM 和 NEED_COOKIE，替换为布尔值（不要加引号）
4. 对于其他字符串变量，保持引号
5. 保持代码格式和缩进

重要提示：
- REQUEST_TEMPLATE 是 JSON 对象，替换时不要加引号，保持对象格式
- REQUEST_HEADERS 是 JSON 对象，替换时不要加引号，保持对象格式
- IS_STREAM 和 NEED_COOKIE 是布尔值，不要加引号
- 其他变量是字符串，保持原有引号

示例：
模板：requestTemplate: {{{{REQUEST_TEMPLATE}}}}
变量：REQUEST_TEMPLATE = {{"question": "{{{{question}}}}", "stream": true}}
结果：requestTemplate: {{"question": "{{{{question}}}}", "stream": true}}

直接返回填充后的完整文件内容，不要添加任何解释。
`)

        try {
            const result = await this.llm.invoke(
                await prompt.format({
                    template: templateContent,
                    vars: JSON.stringify(vars, null, 2)
                })
            )

            console.log(`✓ 模板填充完成: ${templatePath}`)
            return result.content as string
        } catch (error) {
            console.error(`❌ LLM 填充失败: ${templatePath}，使用传统方法`)
            // 降级到传统替换方法
            return this.fallbackFillTemplate(templateContent, vars)
        }
    }

    /**
     * 降级方法：传统模板替换
     */
    private fallbackFillTemplate(content: string, vars: TemplateVars): string {
        // 1. 替换 REQUEST_TEMPLATE（JSON 对象，不带引号）
        if (vars.REQUEST_TEMPLATE) {
            const requestTemplate = typeof vars.REQUEST_TEMPLATE === 'string'
                ? vars.REQUEST_TEMPLATE
                : JSON.stringify(vars.REQUEST_TEMPLATE, null, 4)
            content = content.replace(/\{\{\s*REQUEST_TEMPLATE\s*\}\}/g, requestTemplate)
        }

        // 2. 替换 REQUEST_HEADERS（JSON 对象，不带引号）
        if (vars.REQUEST_HEADERS) {
            const headers = typeof vars.REQUEST_HEADERS === 'string'
                ? vars.REQUEST_HEADERS
                : JSON.stringify(vars.REQUEST_HEADERS, null, 4)
            content = content.replace(/\{\{\s*REQUEST_HEADERS\s*\}\}/g, headers)
        }

        // 3. 替换布尔值占位符（不带引号）
        content = content.replace(/\{\{\s*IS_STREAM\s*\}\}/g, String(vars.IS_STREAM))
        content = content.replace(/\{\{\s*NEED_COOKIE\s*\}\}/g, String(vars.NEED_COOKIE || false))

        // 4. 替换其他所有占位符（字符串，带引号）
        for (const [key, value] of Object.entries(vars)) {
            if (key === 'REQUEST_TEMPLATE' || key === 'REQUEST_HEADERS' ||
                key === 'IS_STREAM' || key === 'NEED_COOKIE') {
                continue // 已经处理过了
            }

            const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
            const replacement = typeof value === 'string' ? value : String(value)
            content = content.replace(placeholder, replacement)
        }

        return content
    }
}
