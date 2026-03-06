/**
 * 常量定义
 */

// 消息提示文案
export const MESSAGE_PROMPTS = {
    // 思考阶段提示
    THINK_SEARCHING: '思考中...',
    THINK_DONE: '思考完成',
    THINK_UNABLE: '当前无法回答，请稍后重试',
    THINK_OFFLINE: '网络异常，请检查网络连接',
    THINK_TERMINATED: '已停止回答',

    // 状态提示
    STATUS_INTERRUPTED: '回答已中断',
    STATUS_OFFLINE_INTERRUPTED: '网络异常，回答已中断',

    // 重试后缀
    RETRY_SUFFIX: '，刷新重试',
}

// 消息角色
export const MESSAGE_ROLES = {
    USER: 'user',
    ASSISTANT: 'assistant',
}

// 内容类型
export const CONTENT_TYPES = {
    TEXT: 'TEXT',
    WEB_PAGE: 'WEB_PAGE',
    IMAGE: 'IMAGE',
}

// 响应阶段
export const RESPONSE_STAGES = {
    THINKING: 'THINKING',
    ANSWERING: 'ANSWERING',
}
