/**
 * 快应用智能体生成器 - AI 智能生成
 */

import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { collectUserInputSimple } from './prompts/collector.js'
import { TemplateFillerAgent } from './agents/TemplateFillerAgent.js'
import { ConfigParserAgent } from './agents/ConfigParserAgent.js'
import chalk from 'chalk'
import ora from 'ora'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
    try {
        console.log(chalk.blue.bold('='.repeat(60)))
        console.log(chalk.blue.bold('快应用智能体生成器'))
        console.log(chalk.blue.bold('使用 AI 智能理解配置，自动生成项目'))
        console.log(chalk.blue.bold('='.repeat(60)))
        console.log()

        // 步骤 1: 收集用户输入
        console.log(chalk.cyan('步骤 1/4: 收集配置信息'))
        const userInput = await collectUserInputSimple()

        // 步骤 2: 使用 AI 完整解析配置
        console.log(chalk.cyan('\n步骤 2/4: AI 智能解析配置'))

        const configParser = new ConfigParserAgent()

        // 使用 LLM 解析 curl 命令或 API 配置
        if (userInput.apiUrl) {
            const spinner = ora('AI 正在深度分析 API 配置...').start()
            try {
                const parsedApi = await configParser.parseCurlOrConfig(userInput.apiUrl)
                spinner.succeed('API 配置解析完成')

                // 合并解析结果
                Object.assign(userInput, parsedApi)
            } catch (error) {
                spinner.fail('API 配置解析失败')
                throw error
            }
        }

        // 使用 LLM 推断响应字段映射
        if (userInput.responseExample) {
            const spinner = ora('AI 正在深度分析响应结构...').start()
            try {
                const fieldMapping = await configParser.inferFieldMapping(userInput.responseExample)
                spinner.succeed('响应字段映射完成')

                userInput.fieldMapping = {
                    ...userInput.fieldMapping,
                    ...fieldMapping
                }
            } catch (error) {
                spinner.fail('响应字段映射失败')
                throw error
            }
        }

        // 步骤 3: 使用 AI 生成模板变量和请求模板
        console.log(chalk.cyan('\n步骤 3/4: AI 生成模板配置'))

        const templateFiller = new TemplateFillerAgent()
        const spinner = ora('AI 正在生成模板变量和请求模板...').start()
        let templateVars
        try {
            templateVars = await templateFiller.generateTemplateVars(userInput)
            spinner.succeed('模板变量生成完成')
        } catch (error) {
            spinner.fail('模板变量生成失败')
            throw error
        }

        console.log(chalk.green('✓ 配置解析完成'))
        console.log(chalk.gray(`  项目名称: ${templateVars.PROJECT_NAME}`))
        console.log(chalk.gray(`  智能体: ${templateVars.AGENT_NAME}`))
        console.log(chalk.gray(`  API: ${templateVars.API_BASE_URL}${templateVars.API_ENDPOINT}`))
        console.log(chalk.gray(`  流式响应: ${templateVars.IS_STREAM ? '是' : '否'}`))

        // 步骤 4: 生成项目文件
        console.log(chalk.cyan('\n步骤 4/4: 生成项目文件'))

        const outputDir = path.join(__dirname, '../output', templateVars.PROJECT_NAME)
        await generateProject(outputDir, templateVars, templateFiller)

        // 显示项目结构
        console.log(chalk.green('\n' + '='.repeat(60)))
        console.log(chalk.green.bold('✓ 项目生成成功！'))
        console.log(chalk.green('='.repeat(60)))
        console.log(generateProjectStructure(outputDir, templateVars.PROJECT_NAME))

    } catch (error) {
        console.error(chalk.red('\n❌ 生成失败:'))
        console.error(chalk.red(error instanceof Error ? error.message : String(error)))
        if (error instanceof Error && error.stack) {
            console.error(chalk.gray('\n堆栈跟踪:'))
            console.error(chalk.gray(error.stack))
        }
        process.exit(1)
    }
}

// 生成项目文件
async function generateProject(
    outputDir: string,
    templateVars: any,
    templateFiller: TemplateFillerAgent
): Promise<void> {
    const templateDir = path.join(__dirname, '../template')

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    console.log(chalk.gray('复制模板文件...'))

    // 复制静态文件（不需要填充的文件）
    const staticFiles = [
        'babel.config.js',
        '.gitignore',
        'hap.config.js',
        'src/app.ux',
        'src/common/api.js',
        'src/common/apiHelper.js',
        'src/common/request.js',
        'src/constants/index.js',
        'src/components/codeBlock.ux',
        'src/components/container.ux',
        'src/components/homeIntro.ux',
        'src/components/markdown.ux',
        'src/components/newChatDialog.ux',
        'src/components/thinkingIndicator.ux',
        'src/components/titleBar.ux',
        'sign/debug/certificate.pem',
        'sign/debug/private.pem',
    ]

    for (const file of staticFiles) {
        const srcPath = path.join(templateDir, file)
        const destPath = path.join(outputDir, file)

        if (fs.existsSync(srcPath)) {
            const destDir = path.dirname(destPath)
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true })
            }
            fs.copyFileSync(srcPath, destPath)
        }
    }

    // 复制 pages 目录
    copyDirectory(
        path.join(templateDir, 'src/pages'),
        path.join(outputDir, 'src/pages')
    )

    // 复制 assets 目录
    copyDirectory(
        path.join(templateDir, 'src/assets'),
        path.join(outputDir, 'src/assets')
    )

    console.log(chalk.gray('填充模板文件...'))

    // 填充需要替换变量的文件
    const templateFiles = [
        'package.json',
        'README.md',
        'src/manifest.json',
        'src/common/apiConfig.js',
    ]

    for (const file of templateFiles) {
        const content = await templateFiller.fillTemplate(file, templateVars)
        const destPath = path.join(outputDir, file)
        const destDir = path.dirname(destPath)

        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true })
        }

        fs.writeFileSync(destPath, content, 'utf-8')
    }

    console.log(chalk.green('✓ 项目文件生成完成'))
}

// 复制目录
function copyDirectory(src: string, dest: string): void {
    if (!fs.existsSync(src)) {
        return
    }

    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true })
    }

    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath)
        } else {
            fs.copyFileSync(srcPath, destPath)
        }
    }
}

// 生成项目结构说明
function generateProjectStructure(outputDir: string, projectName: string): string {
    return `
${chalk.cyan('项目已生成到:')} ${chalk.yellow(outputDir)}

${chalk.cyan('项目结构:')}
${chalk.gray(projectName + '/')}
${chalk.gray('├── src/')}
${chalk.gray('│   ├── pages/')}
${chalk.gray('│   │   └── Index/          # 主聊天页面')}
${chalk.gray('│   ├── components/         # 组件')}
${chalk.gray('│   ├── common/            # 公共模块')}
${chalk.gray('│   │   ├── api.js')}
${chalk.gray('│   │   ├── apiConfig.js   # API 配置（已生成）')}
${chalk.gray('│   │   ├── apiHelper.js')}
${chalk.gray('│   │   └── request.js')}
${chalk.gray('│   ├── constants/         # 常量定义')}
${chalk.gray('│   ├── assets/           # 资源文件')}
${chalk.gray('│   ├── app.ux           # 应用入口')}
${chalk.gray('│   └── manifest.json    # 应用配置')}
${chalk.gray('├── package.json')}
${chalk.gray('├── babel.config.js')}
${chalk.gray('├── hap.config.js')}
${chalk.gray('└── README.md')}

${chalk.cyan('下一步:')}
${chalk.yellow('1.')} cd output/${path.basename(outputDir)}
${chalk.yellow('2.')} npm install
${chalk.yellow('3.')} npm run start

${chalk.cyan('开发指南:')}
${chalk.gray('- 修改 API 配置: src/common/apiConfig.js')}
${chalk.gray('- 修改智能体信息: src/common/apiConfig.js 中的 agentConfig')}
${chalk.gray('- 修改 UI 样式: src/pages/Index/index.ux')}
${chalk.gray('- 添加新组件: src/components/')}
`
}


export { main }
