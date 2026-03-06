/**
 * API 请求模块
 * 使用动态配置发送请求
 */

import { dispatchRequest, dispatchStreamRequest } from './request'
import {
    buildRequestBody,
    getApiUrl,
    getRequestConfig,
    isStreamResponse,
} from './apiHelper'

/**
 * 发送聊天请求（非流式）
 * @param {Object} params
 * @param {string} params.sessionId - 会话ID
 * @param {string} params.question - 用户问题
 * @param {string} params.botId - 智能体ID
 * @returns {Promise}
 */
export async function requestChat({ sessionId, question, botId }) {
    const url = getApiUrl()
    const config = getRequestConfig()
    const data = buildRequestBody({ sessionId, question, botId })

    return dispatchRequest({
        url,
        method: config.method,
        header: config.headers,
        data,
        needCookie: config.needCookie,
    })
}

/**
 * 发送聊天请求（流式）
 * @param {Object} params
 * @param {string} params.sessionId - 会话ID
 * @param {string} params.question - 用户问题
 * @param {string} params.botId - 智能体ID
 * @returns {Promise<RequestTask>}
 */
export async function requestChatStream({ sessionId, question, botId }) {
    const url = getApiUrl()
    const config = getRequestConfig()
    const data = buildRequestBody({ sessionId, question, botId })

    return dispatchStreamRequest({
        url,
        method: config.method,
        header: config.headers,
        data,
        needCookie: config.needCookie,
    })
}

/**
 * 根据配置选择合适的请求方法
 * @param {Object} params
 * @returns {Promise}
 */
export async function sendChatRequest(params) {
    if (isStreamResponse()) {
        return requestChatStream(params)
    } else {
        return requestChat(params)
    }
}

/**
 * 获取网络类型
 * @returns {Promise<string>}
 */
export async function getNetworkType() {
    return new Promise((resolve) => {
        const network = require('@system.network')
        network.getType({
            success: (data) => {
                resolve(data.type || 'wifi')
            },
            fail: () => {
                resolve('wifi')
            },
        })
    })
}

/**
 * 获取平台信息
 * @returns {Promise<Object>}
 */
export async function getPlatformInfo() {
    return new Promise((resolve) => {
        const device = require('@system.device')
        device.getInfo({
            success: (data) => {
                resolve(data)
            },
            fail: () => {
                resolve({ platformVersionCode: 1311 })
            },
        })
    })
}
