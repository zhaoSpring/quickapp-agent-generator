/**
 * 版本配置收集器 - 完全 AI 驱动
 * 用户只需提供 curl 命令和响应示例，AI 自动提取所有配置
 */

import { UserInput } from '../types'


export async function collectUserInputSimple(): Promise<UserInput> {
  console.log('\n=== 快应用智能体生成器  - AI 驱动 ===\n')
  console.log('本工具使用 AI 完整理解你的 API 配置，无需手动填写复杂字段\n')

  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer: string) => {
        resolve(answer)
      })
    })
  }

  try {
    console.log('步骤 1/4: 项目基本信息')
    console.log('-'.repeat(60))
    const projectName = await question('项目名称（英文，如 my-agent）: ')
    const projectDescription = await question('项目描述: ')
    const packageName = await question('包名（如 com.example.myagent）: ')

    console.log('\n步骤 2/4: API 配置')
    console.log('-'.repeat(60))
    console.log('💡 直接粘贴完整的 curl 命令，AI 会自动提取所有信息！')
    console.log('💡 包括：URL、方法、请求头、请求体、认证信息等\n')

    const apiInput = await question('请粘贴 curl 命令: ')

    console.log('\n请提供响应示例（用于 AI 分析字段结构）:')
    console.log('💡 提示: 直接粘贴完整的响应内容')
    console.log('💡 流式响应示例:')
    console.log('   data: {"choices":[{"delta":{"content":"你好"}}]}')
    console.log('   data: {"choices":[{"delta":{"content":"！"}}]}')
    console.log('   data: [DONE]')
    console.log('💡 普通响应示例:')
    console.log('   {"data":{"content":"你好！","messageId":"123"}}')
    console.log('输入完成后，单独一行输入 END 并回车\n')

    let responseLines: string[] = []
    while (true) {
      const line = await question('')
      if (line.trim() === 'END') break
      responseLines.push(line)
    }

    const responseExample = responseLines.join('\n')

    console.log('\n步骤 3/4: 智能体信息')
    console.log('-'.repeat(60))
    const agentName = await question('智能体名称: ')
    const agentDescription = await question('智能体描述: ')
    const agentIcon = await question('智能体图标 URL（可选，直接回车跳过）: ')

    console.log('\n请输入 3 个开场问题:')
    const q1 = await question('问题 1: ')
    const q2 = await question('问题 2: ')
    const q3 = await question('问题 3: ')

    rl.close()

    // 自动生成智能体ID（使用项目名称）
    const agentId = projectName.replace(/[^a-zA-Z0-9]/g, '-')

    return {
      projectName,
      projectDescription,
      packageName,
      apiUrl: apiInput, // 完整的 curl 命令，交给 LLM 处理
      apiMethod: 'POST', // 默认值，LLM 会覆盖
      isStream: true, // 默认值，LLM 会覆盖
      requestExample: '', // LLM 会生成
      responseExample,
      fieldMapping: {
        request: {
          sessionId: 'sessionId',
          question: 'question',
          botId: 'botId',
        },
        response: {
          stage: 'stage',
          content: 'content',
          contentType: 'contentType',
          messageId: 'messageId',
          status: 'status',
          message: 'message',
        }
      },
      agentId,
      agentName,
      agentDescription,
      agentIcon: agentIcon || 'https://mify.mioffice.cn/logo/logo-site.png',
      openingQuestions: [q1, q2, q3].filter(q => q && q.trim()),
      headers: {}, // LLM 会提取
    }
  } catch (e) {
    rl.close()
    throw e
  }
}
