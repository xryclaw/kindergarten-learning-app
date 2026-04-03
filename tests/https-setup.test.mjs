import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

test('package.json exposes a server:https script', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
  )

  assert.equal(packageJson.scripts['server:https'], 'bash ./scripts/enable-https.sh')
})

test('https enable script contains certbot ip-certificate flow', () => {
  const script = fs.readFileSync(
    path.join(projectRoot, 'scripts', 'enable-https.sh'),
    'utf8',
  )

  assert.match(script, /certbot/)
  assert.match(script, /--ip-address/)
  assert.match(script, /preferred-profile shortlived/)
  assert.match(script, /listen 443 ssl http2/)
  assert.match(script, /return 301 https:/)
})
