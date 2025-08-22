import * as fs from 'node:fs'
import * as path from 'node:path'
import * as dotenv from 'dotenv'

export type Environment = 'dev' | 'prod'

/**
 * Load API environment variables from .env.{environment} file
 */
export function loadApiEnv(environment: Environment): Record<string, string> {
  const envPath = path.join(__dirname, `../../../api/.env.${environment}`)

  if (!fs.existsSync(envPath)) {
    console.warn(`API environment file not found: ${envPath}`)
    console.warn('Using empty environment variables. Please create the file before deployment.')
    return {}
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  return dotenv.parse(envContent)
}

/**
 * Load Web environment variables from .env.{environment} file
 */
export function loadWebEnv(environment: Environment): Record<string, string> {
  const envPath = path.join(__dirname, `../../../web/.env.${environment}`)

  if (!fs.existsSync(envPath)) {
    console.warn(`Web environment file not found: ${envPath}`)
    console.warn('Using empty environment variables. Please create the file before deployment.')
    return {}
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  return dotenv.parse(envContent)
}

/**
 * Convert environment variables to Secret Manager format
 */
export function envToSecretData(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}
