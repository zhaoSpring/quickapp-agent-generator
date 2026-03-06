/**
 * 请求模块（简化版）
 * 移除了登录、Cookie 等复杂逻辑
 */

import fetch from '@system.fetch'
import requesttask from '@system.requesttask'
import { getNetworkType } from './api'

/**
 * 获取请求头参数
 * @param {boolean} needCookie - 是否需要 Cookie
 * @returns {Object} 请求头对象
 */
export async function getHeaderParams(needCookie = false) {
    try {
        const headers = {
            'Content-Type': 'application/json',
        }

        // 如果需要 Cookie，可以在这里添加逻辑
        // 简化版暂时不处理 Cookie

        return headers
    } catch (error) {
        console.error('获取header参数失败:', error)
        throw error
    }
}

/**
 * 发送普通请求
 * @param {Object} config - 请求配置
 * @returns {Promise} 返回响应数据
 */
export async function dispatchRequest(config) {
    // 获取默认header参数
    const defaultHeaders = await getHeaderParams(config.needCookie)

    // 合并配置
    const mergedConfig = {
        ...config,
        header: {
            ...defaultHeaders,
            ...(config.header || {}),
        },
    }

    try {
        const response = await fetch.fetch(mergedConfig)
        console.log('dispatchRequest response:', response)

        const data = (response && response.data) || {}

        // 尝试解析 JSON 数据
        let parseData = {}
        try {
            if (typeof data.data === 'string') {
                // 如果是字符串，尝试解析
                if (data.data.startsWith('data:')) {
                    // SSE 格式的数据直接返回
                    return data.data
                }
                parseData = JSON.parse(data.data)
            } else {
                parseData = data.data || {}
            }
        } catch (e) {
            console.warn('解析响应数据失败:', e)
            parseData = data.data || {}
        }

        const result = { ...data, ...parseData }

        // 处理响应头，将其添加到结果对象中
        if (response && response.headers) {
            Object.defineProperty(result, '_headers', {
                value: response.headers,
                enumerable: false,
            })
        }

        return result
    } catch (error) {
        console.error('dispatchRequest error:', error)
        throw error
    }
}

/**
 * 发送流式请求（支持 EventSource/SSE）
 * @param {Object} params - 请求参数
 * @param {string} params.url - 请求地址
 * @param {Object} params.header - 请求头
 * @param {Object|string} params.data - 请求体
 * @param {string} params.method - HTTP 方法
 * @param {boolean} params.enableEventSource - 是否启用服务端事件推送
 * @param {Function} params.onEvent - 事件数据到达时的回调
 * @param {Function} params.onOpen - 连接建立时的回调
 * @param {Function} params.onClosed - 连接关闭时的回调
 * @param {Function} params.onHeadersReceived - 接收到响应头时的回调
 * @param {number} params.maxRetries - 最大重试次数
 * @param {boolean} params.needCookie - 是否需要 Cookie
 * @returns {Object} 返回请求任务对象
 */
export async function dispatchStreamRequest({
    url,
    header = {},
    data = {},
    method = 'POST',
    enableEventSource = true,
    onEvent,
    onOpen,
    onClosed,
    onHeadersReceived,
    maxRetries = 1,
    needCookie = false,
}) {
    let retryCount = 0 // 当前重试次数
    let isCanceled = false // 是否已取消请求
    let currentReq = null // 当前请求任务对象

    const eventHandlers = []
    const openHandlers = []
    const closedHandlers = []
    const headersReceivedHandlers = []

    // 执行所有回调函数
    const runHandlers = (handlers, ...args) => {
        for (let i = 0; i < handlers.length; i++) {
            try {
                typeof handlers[i] === 'function' && handlers[i](...args)
            } catch (e) {
                console.error('Handler execution error:', e)
            }
        }
    }

    // 检查网络是否在线
    async function checkOnline() {
        try {
            const type = await getNetworkType()
            return type !== 'none'
        } catch (e) {
            return true
        }
    }

    // 发起请求
    async function start() {
        const defaultHeaders = await getHeaderParams(needCookie)

        currentReq = requesttask.request({
            url,
            method,
            header: {
                ...defaultHeaders,
                ...header,
            },
            data: typeof data === 'string' ? data : JSON.stringify(data),
            enableEventSource,
        })

        // 绑定事件回调
        currentReq.onEvent((evt) => {
            runHandlers(eventHandlers, evt)
        })

        if (currentReq.onHeadersReceived) {
            currentReq.onHeadersReceived((resp) => {
                runHandlers(headersReceivedHandlers, resp)
            })
        }

        currentReq.onOpen((resp) => {
            runHandlers(openHandlers, resp)
        })

        currentReq.onClosed(async (response) => {
            const { statusCode, data } = response || {}
            console.log('流式请求连接关闭:', statusCode, data)

            // 如果已取消，直接执行关闭回调
            if (isCanceled) {
                runHandlers(closedHandlers, response)
                return
            }

            // 如果状态码为 200 且未达到最大重试次数，尝试重试
            if (statusCode === 200 && retryCount < maxRetries) {
                const online = await checkOnline()
                if (!online) {
                    runHandlers(closedHandlers, response)
                    return
                }
                retryCount++
                console.log('开始第', retryCount, '次重试')
                await start()
                return
            }

            runHandlers(closedHandlers, response)
        })

        return currentReq
    }

    // 注册初始回调
    if (typeof onEvent === 'function') eventHandlers.push(onEvent)
    if (typeof onOpen === 'function') openHandlers.push(onOpen)
    if (typeof onClosed === 'function') closedHandlers.push(onClosed)
    if (typeof onHeadersReceived === 'function') headersReceivedHandlers.push(onHeadersReceived)

    // 启动请求
    await start()

    // 返回任务对象
    return {
        onEvent(handler) {
            eventHandlers.push(handler)
        },
        onOpen(handler) {
            openHandlers.push(handler)
        },
        onHeadersReceived(handler) {
            headersReceivedHandlers.push(handler)
        },
        onClosed(handler) {
            closedHandlers.push(handler)
        },
        abort() {
            // 手动取消请求
            isCanceled = true
            if (currentReq && typeof currentReq.abort === 'function') {
                currentReq.abort()
            }
        },
    }
}
