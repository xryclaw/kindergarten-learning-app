import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const clientRoot = path.join(projectRoot, 'client')

test('vite build base targets root deployment', async () => {
  const configModule = await import(pathToFileURL(path.join(clientRoot, 'vite.config.js')).href)
  const config = configModule.default

  assert.equal(config.base, '/')
})

test('index.html contains a visible app shell fallback', () => {
  const html = fs.readFileSync(path.join(clientRoot, 'index.html'), 'utf8')

  assert.match(html, /id="app"/)
  assert.match(html, /正在加载幼儿园学习乐园/)
  assert.match(html, /noscript/i)
})
