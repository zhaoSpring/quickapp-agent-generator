/**
 * 测试 LLM 连接
 */

import { ChatOpenAI } from '@langchain/openai'
import 'dotenv/config'
import chalk from 'chalk'

async function testLLM() {
    console.log(chalk.blue.bold('\n🧪 测试 LLM 连接\n'))

    console.log(chalk.gray('配置:'))
    console.log(chalk.gray(`  Model: ${process.env.MODEL_NAME}`))
    console.log(chalk.gray(`  Base URL: ${process.env.OPENAI_BASE_URL}`))
    console.log(chalk.gray(`  Provider: ${process.env.X_MODEL_PROVIDER_ID}\n`))

    const llm = new ChatOpenAI({
        model: process.env.MODEL_NAME || 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY,
        configuration: {
            baseURL: process.env.OPENAI_BASE_URL,
            defaultHeaders: {
                ...(process.env.X_MODEL_PROVIDER_ID && {
                    'X-Model-Provider-Id': process.env.X_MODEL_PROVIDER_ID,
                }),
                ...(process.env.X_MODEL_REQUEST_ID && {
                    'X-Model-Request-Id': process.env.X_MODEL_REQUEST_ID,
                }),
            },
        },
    })

    try {
        console.log(chalk.cyan('发送测试消息...'))
        const startTime = Date.now()
        const response = await llm.invoke('Please introduce yourself in one sentence.')
        const duration = ((Date.now() - startTime) / 1000).toFixed(2)

        console.log(chalk.green('\n✅ 连接成功！'))
        console.log(chalk.gray(`⏱️  响应时间: ${duration}秒`))
        console.log(chalk.yellow('\n📝 响应:'))
        console.log(chalk.white(response.content))
        console.log(chalk.cyan('\n✨ LLM 配置正常，可以运行: npm run generate'))
    } catch (error: any) {
        console.log(chalk.red('\n❌ 连接失败\n'))
        console.log(chalk.red(error.message))
        if (error.status) {
            console.log(chalk.gray(`\nHTTP Status: ${error.status}`))
        }
        console.log(chalk.gray('\n💡 请检查 .env 配置文件'))
        process.exit(1)
    }
}

testLLM()
