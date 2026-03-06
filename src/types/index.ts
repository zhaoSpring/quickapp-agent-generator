

/**
 * 字段映射配置
 */
export interface FieldMapping {
    // 请求字段映射
    request: {
        sessionId: string
        question: string
        botId: string
    }

    // 响应字段映射
    response: {
        stage: string
        content: string
        contentType: string
        messageId: string
        status: string
        message: string
    }
}

/**
 * 用户输入的配置信息
 */
export interface UserInput {
    // 项目信息
    projectName: string
    projectDescription: string
    packageName: string

    // API 信息
    apiUrl: string
    apiMethod: 'GET' | 'POST'
    isStream: boolean

    // 请求体示例（JSON 字符串）
    requestExample: string

    // 响应体示例（JSON 字符串）
    responseExample: string

    // 字段映射（可选，如果不提供则使用默认值）
    fieldMapping?: FieldMapping

    // 智能体信息
    agentId: string
    agentName: string
    agentDescription: string
    agentIcon: string
    openingQuestions: string[]

    // 请求头（可选）
    headers?: Record<string, string>

    // 是否需要 Cookie
    needCookie?: boolean
}
