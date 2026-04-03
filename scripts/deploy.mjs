import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'

import {
  buildReleaseName,
  buildRemoteReleasePath,
  buildRsyncDestination,
  buildSiteUrl,
  loadDotEnvFile,
  resolveDeployConfig,
} from './deploy-lib.mjs'

const projectRoot = path.resolve(import.meta.dirname, '..')
const clientDistDir = path.join(projectRoot, 'client', 'dist')
const serverDir = path.join(projectRoot, 'server')

function parseArgs(argv) {
  const parsed = {
    skipBuild: false,
    host: undefined,
    user: undefined,
    port: undefined,
    identityFile: undefined,
    remoteRoot: undefined,
    serverName: undefined,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--skip-build') {
      parsed.skipBuild = true
      continue
    }
    const nextValue = argv[index + 1]
    switch (arg) {
      case '--host':
        parsed.host = nextValue
        index += 1
        break
      case '--user':
        parsed.user = nextValue
        index += 1
        break
      case '--port':
        parsed.port = nextValue
        index += 1
        break
      case '--identity-file':
        parsed.identityFile = nextValue
        index += 1
        break
      case '--remote-root':
        parsed.remoteRoot = nextValue
        index += 1
        break
      case '--server-name':
        parsed.serverName = nextValue
        index += 1
        break
      default:
        throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return parsed
}

function run(command, args, options = {}) {
  console.log(`> ${command} ${args.join(' ')}`)
  execFileSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    ...options,
  })
}

function capture(command, args) {
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
  }).trim()
}

function remoteShellCommand(config, remoteCommand) {
  return [
    '-p',
    `${config.port}`,
    '-o',
    'BatchMode=yes',
    '-o',
    'StrictHostKeyChecking=accept-new',
    '-i',
    config.identityFile,
    `${config.user}@${config.host}`,
    remoteCommand,
  ]
}

function ensureDistExists() {
  if (!fs.existsSync(clientDistDir)) {
    throw new Error('client/dist/ does not exist. Run npm run build first or omit --skip-build.')
  }
}

function main() {
  const argv = parseArgs(process.argv.slice(2))
  const dotEnv = loadDotEnvFile(path.join(projectRoot, '.env.deploy.local'))
  const config = resolveDeployConfig({
    ...dotEnv,
    ...process.env,
    ...(argv.host ? { DEPLOY_HOST: argv.host } : {}),
    ...(argv.user ? { DEPLOY_USER: argv.user } : {}),
    ...(argv.port ? { DEPLOY_PORT: argv.port } : {}),
    ...(argv.identityFile ? { DEPLOY_IDENTITY_FILE: argv.identityFile } : {}),
    ...(argv.remoteRoot ? { DEPLOY_REMOTE_ROOT: argv.remoteRoot } : {}),
    ...(argv.serverName ? { DEPLOY_SERVER_NAME: argv.serverName } : {}),
  })

  if (!argv.skipBuild) {
    run('npm', ['run', 'build'])
  }
  ensureDistExists()

  const sha = capture('git', ['rev-parse', 'HEAD'])
  const releaseName = buildReleaseName({ sha })
  const remoteReleasePath = buildRemoteReleasePath(config, releaseName)
  const rsyncDestination = buildRsyncDestination(config, releaseName)

  console.log(`Deploy target: ${config.user}@${config.host}:${config.remoteRoot}`)
  console.log(`Release: ${releaseName}`)

  // Create release directories
  run('ssh', remoteShellCommand(config, `mkdir -p '${remoteReleasePath}/client' '${remoteReleasePath}/server' '${config.releasesDir}' '${config.remoteRoot}/data'`))

  // Deploy frontend
  console.log('Deploying frontend...')
  run('rsync', [
    '-az',
    '--delete',
    '-e',
    `ssh -p ${config.port} -o BatchMode=yes -o StrictHostKeyChecking=accept-new -i ${config.identityFile}`,
    `${clientDistDir}/`,
    `${rsyncDestination}/client/dist/`,
  ])

  // Deploy backend
  console.log('Deploying backend...')
  run('rsync', [
    '-az',
    '--delete',
    '--exclude=node_modules',
    '--exclude=*.log',
    '-e',
    `ssh -p ${config.port} -o BatchMode=yes -o StrictHostKeyChecking=accept-new -i ${config.identityFile}`,
    `${serverDir}/`,
    `${rsyncDestination}/server/`,
  ])

  // Install backend dependencies on server
  console.log('Installing backend dependencies...')
  run('ssh', remoteShellCommand(config, `cd '${remoteReleasePath}/server' && npm install --production`))

  const fixPermissionsCommand = `
set -euo pipefail
chmod 755 '${remoteReleasePath}'
find '${remoteReleasePath}' -type d -exec chmod 755 {} +
find '${remoteReleasePath}' -type f -exec chmod 644 {} +
`
  run('ssh', remoteShellCommand(config, fixPermissionsCommand))

  const retentionStart = config.retention + 1
  const activateCommand = `
set -euo pipefail
ln -sfn '${remoteReleasePath}' '${config.currentSymlink}'

# Setup systemd service if not exists
if [ ! -f /etc/systemd/system/kindergarten-app.service ]; then
  echo "Setting up systemd service..."
  sudo tee /etc/systemd/system/kindergarten-app.service > /dev/null << 'EOF'
[Unit]
Description=Kindergarten Learning App
After=network.target

[Service]
Type=simple
User=${config.user}
WorkingDirectory=${config.remoteRoot}/current
Environment=NODE_ENV=production
Environment=DB_PATH=${config.remoteRoot}/data/app.db
Environment=JWT_SECRET=${config.jwtSecret || 'change-this-secret'}
Environment=PORT=3000
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
  sudo systemctl daemon-reload
  sudo systemctl enable kindergarten-app
fi

# Restart service
sudo systemctl restart kindergarten-app

# Cleanup old releases
if [ -d '${config.releasesDir}' ]; then
  find '${config.releasesDir}' -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -r | tail -n +${retentionStart} | while read -r old_release; do
    [ -n "$old_release" ] && rm -rf '${config.releasesDir}/'"$old_release"
  done
fi
`
  run('ssh', remoteShellCommand(config, activateCommand))

  console.log(`Deployment complete: ${buildSiteUrl(config)}`)
}

main()
