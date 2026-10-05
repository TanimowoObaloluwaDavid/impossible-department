/**
 * Captures documentation screenshots of the built site using headless Chrome
 * over the DevTools Protocol. No npm dependencies: Node 22+ ships a global
 * WebSocket, and Chrome exposes the CDP HTTP endpoint we need on localhost.
 *
 *   node scripts/screenshots.mjs [outputDir]
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9333
const ROOT = path.resolve(import.meta.dirname, '..')
const DIST = path.join(ROOT, 'dist')
const OUT = path.resolve(process.argv[2] ?? path.join(ROOT, 'docs'))

if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}`)
  process.exit(1)
}
if (!existsSync(path.join(DIST, 'index.html'))) {
  console.error('dist/index.html missing — run `npm run build` first.')
  process.exit(1)
}

const SHOTS = [
  { name: 'hero', anchor: null, width: 1440, height: 900 },
  { name: 'petition', anchor: '#petition', width: 1440, height: 1100 },
  { name: 'prophecy', anchor: '#prophecy', width: 1440, height: 900 },
  { name: 'queue', anchor: '#queue', width: 1440, height: 1000 },
  { name: 'physics', anchor: '#physics', width: 1440, height: 900 },
  { name: 'fine-print', anchor: '#fine-print', width: 1440, height: 1200 },
  { name: 'mobile-hero', anchor: null, width: 414, height: 900 },
  { name: 'mobile-petition', anchor: '#petition', width: 414, height: 1000 },
]

const profile = path.join(process.env.TEMP ?? '.', 'imd-shot-profile')
await rm(profile, { recursive: true, force: true })

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--hide-scrollbars',
  '--force-device-scale-factor=2',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--disable-background-networking',
  '--allow-file-access-from-files',
  'about:blank',
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (res.ok) return (await res.json()).webSocketDebuggerUrl
    } catch {
      /* not up yet */
    }
    await sleep(250)
  }
  throw new Error('Chrome DevTools endpoint never became available')
}

const ws = new WebSocket(await endpoint())
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let nextId = 1
const pending = new Map()

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(`${msg.error.message}`))
    else resolve(msg.result)
  }
})

function send(method, params = {}, sessionId) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })
}

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)

await mkdir(OUT, { recursive: true })

const url = `file:///${path.join(DIST, 'index.html').replace(/\\/g, '/')}`

for (const shot of SHOTS) {
  await send(
    'Emulation.setDeviceMetricsOverride',
    { width: shot.width, height: shot.height, deviceScaleFactor: 2, mobile: shot.width < 700 },
    sessionId,
  )
  await send('Page.navigate', { url }, sessionId)
  await sleep(1200)

  if (shot.anchor) {
    await send(
      'Runtime.evaluate',
      {
        expression: `(() => {
          const el = document.querySelector('${shot.anchor}')
          if (!el) return 'missing'
          window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16, behavior: 'instant' })
          return 'ok'
        })()`,
        returnByValue: true,
      },
      sessionId,
    )
    await sleep(700)
  }

  const { data } = await send(
    'Page.captureScreenshot',
    { format: 'png', captureBeyondViewport: false, fromSurface: true },
    sessionId,
  )
  const file = path.join(OUT, `${shot.name}.png`)
  await writeFile(file, Buffer.from(data, 'base64'))
  console.log(`wrote ${path.relative(ROOT, file)}`)
}

ws.close()
chrome.kill()
await sleep(500)
await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 }).catch(() => {
  console.warn('left temporary Chrome profile behind (harmless)')
})
console.log('done')
process.exit(0)