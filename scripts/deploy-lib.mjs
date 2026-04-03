import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const DEFAULT_APP_NAME = 'kindergarten-learning-app'
const DEFAULT_HOST = '82.156.153.243'
const DEFAULT_USER = 'ubuntu'
const DEFAULT_PORT = 22
const DEFAULT_REMOTE_ROOT = `/var/www/${DEFAULT_APP_NAME}`
const DEFAULT_IDENTITY_FILE = path.join(os.homedir(), '.ssh', 'id_ed25519')
const DEFAULT_RETENTION = 5

export function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const entries = {}
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }
    const separator = line.indexOf('=')
    if (separator === -1) {
      continue
    }
    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    entries[key] = value
  }
  return entries
}

export function resolveDeployConfig(env = {}) {
  const appName = env.DEPLOY_APP_NAME || DEFAULT_APP_NAME
  const remoteRoot = env.DEPLOY_REMOTE_ROOT || `/var/www/${appName}`
  const retention = Number.parseInt(env.DEPLOY_RETENTION ?? `${DEFAULT_RETENTION}`, 10)
  const port = Number.parseInt(env.DEPLOY_PORT ?? `${DEFAULT_PORT}`, 10)

  return {
    appName,
    host: env.DEPLOY_HOST || DEFAULT_HOST,
    user: env.DEPLOY_USER || DEFAULT_USER,
    port: Number.isNaN(port) ? DEFAULT_PORT : port,
    remoteRoot,
    releasesDir: `${remoteRoot}/releases`,
    currentSymlink: `${remoteRoot}/current`,
    identityFile: env.DEPLOY_IDENTITY_FILE || DEFAULT_IDENTITY_FILE,
    serverName: env.DEPLOY_SERVER_NAME || '_',
    retention: Number.isNaN(retention) ? DEFAULT_RETENTION : retention,
  }
}

export function compactSha(sha = 'local') {
  return sha.slice(0, 7)
}

export function formatReleaseTimestamp(timestamp = new Date().toISOString()) {
  return timestamp.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export function buildReleaseName({ timestamp, sha } = {}) {
  return `${formatReleaseTimestamp(timestamp)}-${compactSha(sha)}`
}

export function buildRemoteReleasePath(config, releaseName) {
  return `${config.releasesDir}/${releaseName}`
}

export function buildRsyncDestination(config, releaseName) {
  return `${config.user}@${config.host}:${buildRemoteReleasePath(config, releaseName)}/`
}

export function buildSiteUrl(config) {
  if (!config.serverName || config.serverName === '_') {
    return `http://${config.host}`
  }
  return `http://${config.serverName}`
}
