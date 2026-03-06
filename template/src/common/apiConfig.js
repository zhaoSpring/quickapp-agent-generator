/**
 * API 配置文件
 * 此文件由生成器根据用户输入自动生成
 */

export default {
    // API 基础配置
    baseUrl: '{{API_BASE_URL}}',
    endpoint: '{{API_ENDPOINT}}',
    method: '{{API_METHOD}}',
    isStream: {{IS_STREAM}},

    // 请求体模板
    requestTemplate: {{REQUEST_TEMPLATE}},

    // 请求头配置
    headers: {{REQUEST_HEADERS}},

    // 是否需要 Cookie
    needCookie: {{NEED_COOKIE}},

    // 响应体字段映射
    responseMapping: {
        stage: '{{RESPONSE_STAGE_FIELD}}',
        content: '{{RESPONSE_CONTENT_FIELD}}',
        contentType: '{{RESPONSE_CONTENT_TYPE_FIELD}}',
        messageId: '{{RESPONSE_MESSAGE_ID_FIELD}}',
        status: '{{RESPONSE_STATUS_FIELD}}',
        message: '{{RESPONSE_MESSAGE_FIELD}}',
    },

    // 智能体配置
    agentConfig: {
        id: '{{AGENT_ID}}',
        name: '{{AGENT_NAME}}',
        description: '{{AGENT_DESCRIPTION}}',
        icon: '{{AGENT_ICON}}',
        openingQuestions: [
            '{{OPENING_QUESTION_1}}',
            '{{OPENING_QUESTION_2}}',
            '{{OPENING_QUESTION_3}}'
        ]
    }
}
