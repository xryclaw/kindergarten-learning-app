import test from 'node:test'
import assert from 'node:assert/strict'

import { createBuildDefines, getBuildTime, getGitShortSha } from '../scripts/build-meta.mjs'

test('getGitShortSha returns a non-empty version token', () => {
  const version = getGitShortSha()

  assert.match(version, /^[a-z0-9]+$/i)
})

test('getBuildTime returns an ISO timestamp', () => {
  const buildTime = getBuildTime()

  assert.match(buildTime, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\./)
})

test('createBuildDefines exposes Vite-safe constants', () => {
  const defines = createBuildDefines()

  assert.ok(defines.__APP_VERSION__)
  assert.ok(defines.__BUILD_TIME__)
  assert.equal(typeof defines.__APP_VERSION__, 'string')
  assert.equal(typeof defines.__BUILD_TIME__, 'string')
})
