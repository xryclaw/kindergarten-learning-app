import { execFileSync } from 'node:child_process'

function runGit(args, fallback) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return fallback
  }
}

export function getGitShortSha() {
  return runGit(['rev-parse', '--short', 'HEAD'], 'dev')
}

export function getBuildTime() {
  return new Date().toISOString()
}

export function createBuildDefines() {
  return {
    __APP_VERSION__: JSON.stringify(getGitShortSha()),
    __BUILD_TIME__: JSON.stringify(getBuildTime()),
  }
}
