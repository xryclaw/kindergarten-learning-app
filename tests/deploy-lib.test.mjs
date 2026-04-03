import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildReleaseName,
  buildRemoteReleasePath,
  buildRsyncDestination,
  resolveDeployConfig,
} from '../scripts/deploy-lib.mjs'

test('resolveDeployConfig applies stable defaults', () => {
  const config = resolveDeployConfig({})

  assert.equal(config.appName, 'kindergarten-learning-app')
  assert.equal(config.host, '82.156.153.243')
  assert.equal(config.user, 'ubuntu')
  assert.equal(config.port, 22)
  assert.equal(config.remoteRoot, '/var/www/kindergarten-learning-app')
  assert.equal(config.currentSymlink, '/var/www/kindergarten-learning-app/current')
})

test('buildReleaseName includes timestamp and short sha', () => {
  const releaseName = buildReleaseName({
    timestamp: '2026-04-03T00:52:01Z',
    sha: 'abcdef1234567890',
  })

  assert.equal(releaseName, '20260403T005201Z-abcdef1')
})

test('buildRemoteReleasePath and destination are derived from config', () => {
  const config = resolveDeployConfig({
    DEPLOY_HOST: 'example.com',
    DEPLOY_USER: 'deploy',
    DEPLOY_REMOTE_ROOT: '/srv/apps/kindergarten-learning-app',
  })
  const releaseName = '20260403T005201Z-abcdef1'

  assert.equal(
    buildRemoteReleasePath(config, releaseName),
    '/srv/apps/kindergarten-learning-app/releases/20260403T005201Z-abcdef1',
  )
  assert.equal(
    buildRsyncDestination(config, releaseName),
    'deploy@example.com:/srv/apps/kindergarten-learning-app/releases/20260403T005201Z-abcdef1/',
  )
})

test('resolveDeployConfig falls back when port is empty', () => {
  const config = resolveDeployConfig({
    DEPLOY_PORT: '',
  })

  assert.equal(config.port, 22)
})
