/**
 * 配置解析 Agent - 智能解析 API 配置
 */

import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'
import 'dotenv/config'

export interface ParsedConfig {
    projectName: string
    projectDescription: string
    packageName: string
    agentName: string
    agentDescription: string
    agentId: string
    agentIcon: string
    openingQuestions: string[]

    apiUrl: string
    apiMethod: 'GET' | 'POST'
    isStream: boolean
    requestExample: string
    responseExample: string
    headers: Record<string, string>
    needCookie: boolean

    fieldMapping: {
        request: {
            sessionId: string
            question: string
            botId: string
        }
        response: {
            stage: string
            content: string
            contentType: string
            messageId: string
            status: string
            message: string
        }
    }
}

export class ConfigParserAgent {
    private llm: ChatOpenAI

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
    }

    /**
     * 智能解析 curl 命令或 API 配置 - 完全由 LLM 处理
     */
    async parseCurlOrConfig(input: string): Promise<Partial<ParsedConfig>> {
        console.log('🤖 使用 LLM 完整解析 curl 命令...')

        const parser = new JsonOutputParser()

        const prompt = PromptTemplate.fromTemplate(`
你是一个 API 配置解析专家。请仔细分析以下 curl 命令或 API 配置，提取所有信息。

输入内容：
{input}

任务：
1. 提取完整的 API URL
2. 提取 HTTP 方法（GET/POST/PUT/DELETE 等）
3. 提取所有请求头（headers），包括 Authorization、Content-Type、Cookie 等
4. 提取完整的请求体（body），保持原始结构
5. 判断是否为流式响应
6. 识别请求体中的动态字段（如用户问题、会话ID等）

返回 JSON 格式：
{{
  "apiUrl": "完整的 API URL，包括协议、域名、路径",
  "apiMethod": "HTTP 方法",
  "isStream": true 或 false,
  "headers": {{
    "Content-Type": "application/json",
    "Authorization": "Bearer xxx",
    // ... 所有请求头
  }},
  "requestBody": {{
    // 完整的请求体结构，保持原样
  }},
  "dynamicFields": {{
    "questionField": "请求体中表示用户问题的字段名，如 'question', 'query', 'prompt', 'messages'",
    "sessionIdField": "请求体中表示会话ID的字段名，如 'sessionId', 'conversationId'",
    "questionPath": "问题字段的完整路径，如 'question' 或 'messages[0].content'",
    "sessionIdPath": "会话ID字段的完整路径"
  }}
}}

重要提示：
- 不要遗漏任何请求头，特别是 Authorization、Cookie、自定义头
- 完整保留请求体的所有字段和结构
- 如果请求体包含 "stream": true 或请求头包含 "text/event-stream"，则 isStream 为 true
- 对于 OpenAI 格式的 messages 数组，questionPath 应为 "messages[user].content"
- 如果某个字段不存在，使用 null

{format_instructions}
`)

        const chain = prompt.pipe(this.llm).pipe(parser)

        try {
            const result = await chain.invoke({
                input,
                format_instructions: parser.getFormatInstructions()
            })

            console.log('✓ API 配置解析完成')
            console.log(`  URL: ${result.apiUrl}`)
            console.log(`  方法: ${result.apiMethod}`)
            console.log(`  流式: ${result.isStream}`)
            console.log(`  请求头数量: ${Object.keys(result.headers || {}).length}`)
            console.log(`  动态字段: ${JSON.stringify(result.dynamicFields)}`)

            return {
                apiUrl: result.apiUrl,
                apiMethod: result.apiMethod,
                isStream: result.isStream,
                headers: result.headers || { 'Content-Type': 'application/json' },
                requestExample: result.requestBody ? JSON.stringify(result.requestBody, null, 2) : '{}',
                fieldMapping: {
                    request: {
                        question: result.dynamicFields?.questionPath || 'question',
                        sessionId: result.dynamicFields?.sessionIdPath || 'sessionId',
                        botId: 'botId'
                    },
                    response: {
                        stage: 'stage',
                        content: 'content',
                        contentType: 'contentType',
                        messageId: 'messageId',
                        status: 'status',
                        message: 'message'
                    }
                }
            }
        } catch (error) {
            console.error('❌ LLM 解析失败:', error)
            throw new Error('LLM 解析 curl 命令失败，请检查输入格式')
        }
    }

    /**
     * 智能推断响应字段映射 - 完全由 LLM 处理
     */
    async inferFieldMapping(responseExample: string): Promise<any> {
        console.log('🤖 使用 LLM 深度分析响应结构...')

        const parser = new JsonOutputParser()

        const prompt = PromptTemplate.fromTemplate(`
你是一个 API 响应结构分析专家。请仔细分析以下响应示例，找出所有关键字段的精确路径。

响应示例：
{response}

任务：
1. 判断响应格式（流式 SSE 或普通 JSON）
2. 找出对话内容字段的完整路径
3. 找出消息ID、阶段、内容类型等字段的路径
4. 识别错误处理相关字段

返回 JSON 格式：
{{
  "isStreamResponse": true 或 false,
  "responseFormat": "描述响应格式，如 'OpenAI SSE 格式' 或 '通义千问格式'",
  "content": "内容字段的完整路径，如 'choices[0].delta.content' 或 'data.content'",
  "messageId": "消息ID字段路径，如 'id' 或 'message_id'",
  "stage": "阶段字段路径，如 'stage' 或 'status'",
  "contentType": "内容类型字段路径，如 'contentType' 或 'type'",
  "status": "状态字段路径（用于错误判断），如 'status' 或 'error.code'",
  "message": "错误消息字段路径，如 'message' 或 'error.message'",
  "explanation": "简要说明响应结构的特点"
}}

重要提示：
- 对于流式响应（包含 data: 前缀），分析 data: 后面的 JSON 结构
- 对于 OpenAI 格式：content 在 choices[0].delta.content
- 对于通义千问格式：content 在 output.text 或 output.choices[0].message.content
- 对于自定义格式：仔细查找包含实际对话内容的字段
- 路径必须精确，包括数组索引，如 choices[0].delta.content
- 如果某个字段在响应中不存在，推测最可能的字段名

{format_instructions}
`)

        const chain = prompt.pipe(this.llm).pipe(parser)

        try {
            const result = await chain.invoke({
                response: responseExample,
                format_instructions: parser.getFormatInstructions()
            })

            console.log('✓ 响应结构分析完成')
            console.log(`  格式: ${result.responseFormat}`)
            console.log(`  内容路径: ${result.content}`)
            console.log(`  说明: ${result.explanation}`)

            return {
                response: {
                    stage: result.stage || 'stage',
                    content: result.content || 'content',
                    contentType: result.contentType || 'contentType',
                    messageId: result.messageId || 'messageId',
                    status: result.status || 'status',
                    message: result.message || 'message',
                }
            }
        } catch (error) {
            console.error('❌ LLM 分析失败:', error)
            throw new Error('LLM 分析响应结构失败，请检查响应示例格式')
        }
    }
}
