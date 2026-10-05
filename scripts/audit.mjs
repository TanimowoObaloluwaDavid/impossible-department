/**
 * Headless audit of the built site. Confirms every documented section renders,
 * is visible, and has sensible geometry, plus checks the captured PNGs are not
 * blank. Complements scripts/screenshots.mjs, which cannot be eyeballed.
 *
 *   node scripts/audit.mjs
 */
import { spawn } from 'node:child_process'
import { readdir, stat, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9334
const ROOT = path.resolve(import.meta.dirname, '..')
const DIST = path.join(ROOT, 'dist')
const DOCS = path.join(ROOT, 'docs')

const SECTIONS = ['#petition', '#prophecy', '#queue', '#physics', '#fine-print']
const MIN_PNG_BYTES = 12_000

const profile = path.join(process.env.TEMP ?? '.', 'imd-audit-profile')
await rm(profile, { recursive: true, force: true })

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--allow-file-access-from-files',
  'about:blank',
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let wsUrl
for (let i = 0; i < 60 && !wsUrl; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/version`)
    if (res.ok) wsUrl = (await res.json()).webSocketDebuggerUrl
  } catch {
    /* not up yet */
  }
  if (!wsUrl) await sleep(250)
}
if (!wsUrl) throw new Error('DevTools endpoint never came up')

const ws = new WebSocket(wsUrl)
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true })
  ws.addEventListener('error', rej, { once: true })
})

let nextId = 1
const pending = new Map()
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id)
    pending.delete(m.id)
    if (m.error) reject(new Error(m.error.message))
    else resolve(m.result)
  }
})
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
await send('Page.enable', {}, sessionId)
await send('Runtime.enable', {}, sessionId)
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId)
await send('Page.navigate', { url: `file:///${path.join(DIST, 'index.html').replace(/\\/g, '/')}` }, sessionId)
await sleep(1500)

const failures = []
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures.push(label)
}

const evaluate = async (expression) => {
  const { result, exceptionDetails } = await send(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true },
    sessionId,
  )
  if (exceptionDetails) throw new Error(exceptionDetails.text)
  return result.value
}

const rootChildren = await evaluate(`document.getElementById('root').children.length`)
check('React mounted', rootChildren > 0, `${rootChildren} root child(ren)`)

const h1 = await evaluate(`document.querySelector('.hero__title')?.textContent ?? ''`)
check('Hero title present', h1.replace(/\s+/g, '') === 'TheImpossibleDepartment', JSON.stringify(h1))

const cssLoaded = await evaluate(`getComputedStyle(document.body).fontFamily`)
check('CSS applied', !cssLoaded.includes('Times'), cssLoaded.slice(0, 40))

for (const sel of SECTIONS) {
  const info = await evaluate(`(() => {
    const el = document.querySelector('${sel}')
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { w: Math.round(r.width), h: Math.round(r.height), text: el.innerText.trim().length }
  })()`)
  check(`Section ${sel} renders`, !!info && info.w > 200 && info.h > 80 && info.text > 40,
    info ? `${info.w}x${info.h}, ${info.text} chars` : 'not found')
}

// Reverse validation: a legible name must draw errors, compliant nonsense must
// draw none. Each step is a separate evaluate so React can flush between them —
// reading the DOM in the same tick as the event always shows stale state.
// React listens for a trusted-looking input event; assigning .value directly
// is ignored, so go through the native setter and dispatch manually.
await evaluate(`(() => {
  const input = document.querySelector('.field__input')
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  window.__type = (v) => {
    setter.call(input, v)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }
  return true
})()`)

const errorsFor = async (value) => {
  await evaluate(`window.__type(${JSON.stringify(value)})`)
  await sleep(150)
  return evaluate(`document.querySelectorAll('.errors__item').length`)
}

check('Legible name draws errors', (await errorsFor('John Smith')) > 0, `${await errorsFor('John Smith')} errors`)
check('Compliant nonsense draws no errors', (await errorsFor('Xkcdbr7a')) === 0, `${await errorsFor('Xkcdbr7a')} errors`)

// Leave a legible name in the field before submitting, so the class reflects it.
await evaluate(`window.__type('John Smith')`)
await sleep(150)
await evaluate(`document.querySelector('.form').requestSubmit()`)
await sleep(250)
const submitted = await evaluate(`JSON.stringify({
  outcome: !!document.querySelector('.outcome'),
  cls: document.querySelector('.field__input').className,
})`)
const sub = JSON.parse(submitted)
check('Submitting produces an outcome', sub.outcome === true)
check('Legible name marked invalid on submit', sub.cls.includes('is-invalid'), sub.cls)

// The queue must not be stuck at 0 items.
await evaluate(`document.querySelector('#queue').scrollIntoView()`)
await sleep(2500)
const queueRows = await evaluate(`document.querySelectorAll('.queue__row').length`)
check('Queue loaded rows', queueRows > 0, `${queueRows} rows`)

const pngs = existsSync(DOCS) ? (await readdir(DOCS)).filter((f) => f.endsWith('.png')) : []
check('Screenshots captured', pngs.length >= 8, `${pngs.length} png`)
for (const f of pngs) {
  const { size } = await stat(path.join(DOCS, f))
  check(`  ${f} non-blank`, size > MIN_PNG_BYTES, `${(size / 1024).toFixed(0)} kB`)
}

ws.close()
chrome.kill()
await sleep(500)
await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 }).catch(() => {})

console.log(`\n${failures.length === 0 ? 'ALL CHECKS PASSED' : `FAILURES: ${failures.join(', ')}`}`)
process.exit(failures.length === 0 ? 0 : 1)