#!/usr/bin/env node

/**
 * Integration Setup Checker
 *
 * This script checks if all required OAuth credentials are configured
 * Run: node scripts/check-integrations.js
 */

const fs = require('fs')
const path = require('path')

// Simple .env parser (no dependency on dotenv package)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!')
    process.exit(1)
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

loadEnv()

const integrations = {
  'GitHub': {
    required: ['GITHUB_OAUTH_CLIENT_ID', 'GITHUB_OAUTH_CLIENT_SECRET'],
    callbackUrl: '/api/integrations/auth/callback/github',
    setupUrl: 'https://github.com/settings/developers'
  },
  'Google Services (Drive/Gmail/Calendar)': {
    required: ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET'],
    callbackUrl: '/api/integrations/auth/callback/google-drive',
    setupUrl: 'https://console.cloud.google.com/apis/credentials'
  },
  'Slack': {
    required: ['SLACK_OAUTH_CLIENT_ID', 'SLACK_OAUTH_CLIENT_SECRET'],
    callbackUrl: '/api/integrations/auth/callback/slack',
    setupUrl: 'https://api.slack.com/apps'
  },
  'Jira': {
    required: ['JIRA_OAUTH_CLIENT_ID', 'JIRA_OAUTH_CLIENT_SECRET'],
    callbackUrl: '/api/integrations/auth/callback/jira',
    setupUrl: 'https://developer.atlassian.com/console/myapps/'
  },
  'Notion': {
    required: ['NOTION_OAUTH_CLIENT_ID', 'NOTION_OAUTH_CLIENT_SECRET'],
    callbackUrl: '/api/integrations/auth/callback/notion',
    setupUrl: 'https://www.notion.so/my-integrations'
  },
  'SERP API': {
    required: ['SERPAPI_KEY'],
    callbackUrl: 'N/A (Already integrated)',
    setupUrl: 'https://serpapi.com/'
  }
}

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

console.log('\n🔍 Checking Integration OAuth Configuration...\n')
console.log(`Base URL: ${baseUrl}\n`)
console.log('=' .repeat(80))

let allConfigured = true
let configuredCount = 0

Object.entries(integrations).forEach(([name, config]) => {
  const isConfigured = config.required.every(envVar => {
    const value = process.env[envVar]
    return value && value !== '' && !value.includes('your_')
  })

  const status = isConfigured ? '✅ Configured' : '❌ Missing'
  const color = isConfigured ? '\x1b[32m' : '\x1b[31m'
  const reset = '\x1b[0m'

  console.log(`\n${color}${status}${reset} ${name}`)

  config.required.forEach(envVar => {
    const value = process.env[envVar]
    const hasValue = value && value !== '' && !value.includes('your_')
    const varStatus = hasValue ? '✓' : '✗'
    const varColor = hasValue ? '\x1b[32m' : '\x1b[31m'

    console.log(`  ${varColor}${varStatus}${reset} ${envVar}`)
  })

  if (config.callbackUrl !== 'N/A (Already integrated)') {
    console.log(`  📍 Callback URL: ${baseUrl}${config.callbackUrl}`)
  }
  console.log(`  🔗 Setup: ${config.setupUrl}`)

  if (isConfigured) {
    configuredCount++
  } else {
    allConfigured = false
  }
})

console.log('\n' + '='.repeat(80))
console.log(`\n📊 Summary: ${configuredCount}/${Object.keys(integrations).length} integrations configured\n`)

if (allConfigured) {
  console.log('✅ All integrations are configured! You can start using them.\n')
  console.log('Next steps:')
  console.log('  1. Run: npm run dev')
  console.log('  2. Go to Settings → Integrations')
  console.log('  3. Click "Add Integration" and test OAuth flow\n')
} else {
  console.log('⚠️  Some integrations need configuration.\n')
  console.log('Follow the setup guide: INTEGRATION_SETUP.md\n')
  console.log('Quick start:')
  console.log('  1. Create OAuth apps at provider websites (see URLs above)')
  console.log('  2. Add credentials to .env file')
  console.log('  3. Restart your dev server')
  console.log('  4. Run this script again to verify\n')
}

// Check MongoDB connection
if (process.env.MONGODB_URI) {
  console.log('✅ MongoDB URI configured')
} else {
  console.log('❌ MongoDB URI missing (required for storing integrations)')
}

// Check NextAuth
if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL) {
  console.log('✅ NextAuth configured')
} else {
  console.log('❌ NextAuth configuration incomplete')
}

console.log('\n' + '='.repeat(80) + '\n')
