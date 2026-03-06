/**
 * API 辅助函数
 * 用于处理动态 API 配置
 */

import apiConfig from './apiConfig'

/**
 * 构建请求体
 * @param {Object} params - 参数对象
 * @param {string} params.sessionId - 会话ID
 * @param {string} params.question - 用户问题
 * @param {string} params.botId - 智能体ID
 * @returns {Object} 请求体
 */
export function buildRequestBody({ sessionId, question, botId }) {
    const template = apiConfig.requestTemplate

    // 深度克隆模板
    const body = JSON.parse(JSON.stringify(template))

    // 递归替换占位符
    function replacePlaceholders(obj) {
        if (typeof obj === 'string') {
            return obj
                .replace(/\{\{sessionId\}\}/g, sessionId || '')
                .replace(/\{\{question\}\}/g, question || '')
                .replace(/\{\{botId\}\}/g, botId || '')
        }

        if (Array.isArray(obj)) {
            return obj.map(item => replacePlaceholders(item))
        }

        if (obj && typeof obj === 'object') {
            const result = {}
            for (const key in obj) {
                result[key] = replacePlaceholders(obj[key])
            }
            return result
        }

        return obj
    }

    return replacePlaceholders(body)
}

/**
 * 从响应中提取数据
 * @param {Object} response - 原始响应数据
 * @returns {Object} 标准化的响应数据
 */
export function parseResponse(response) {
    if (!response) return null

    const mapping = apiConfig.responseMapping

    // 使用路径获取嵌套值，支持数组索引
    function getNestedValue(obj, path) {
        if (!path) return undefined

        // 处理数组索引，如 choices[0].delta.content
        const pathWithArrays = path.replace(/\[(\d+)\]/g, '.$1')
        const keys = pathWithArrays.split('.')

        let value = obj
        for (const key of keys) {
            if (value === null || value === undefined) {
                return undefined
            }

            // 处理数组索引
            const arrayIndex = parseInt(key)
            if (!isNaN(arrayIndex) && Array.isArray(value)) {
                value = value[arrayIndex]
            } else if (typeof value === 'object') {
                value = value[key]
            } else {
                return undefined
            }
        }
        return value
    }

    return {
        stage: getNestedValue(response, mapping.stage),
        content: getNestedValue(response, mapping.content),
        contentType: getNestedValue(response, mapping.contentType),
        messageId: getNestedValue(response, mapping.messageId),
        status: getNestedValue(response, mapping.status),
        message: getNestedValue(response, mapping.message),
    }
}

/**
 * 获取完整的 API URL
 * @returns {string} 完整的 API URL
 */
export function getApiUrl() {
    const { baseUrl, endpoint } = apiConfig
    // 确保 URL 格式正确
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    return base + path
}

/**
 * 获取请求配置
 * @returns {Object} 请求配置
 */
export function getRequestConfig() {
    return {
        method: apiConfig.method,
        headers: apiConfig.headers || {
            'Content-Type': 'application/json',
        },
        needCookie: apiConfig.needCookie || false,
    }
}

/**
 * 判断是否为流式响应
 * @returns {boolean}
 */
export function isStreamResponse() {
    return apiConfig.isStream === true
}

/**
 * 获取智能体配置
 * @returns {Object} 智能体配置
 */
export function getAgentConfig() {
    return apiConfig.agentConfig
}
