#!/usr/bin/env node

/**
 * CLI 入口文件
 */

import { main } from './index.js'

main().catch((error) => {
    console.error('Error:', error)
    process.exit(1)
})
