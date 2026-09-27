import test from 'node:test'
import assert from 'node:assert/strict'
import worker from '../src/index.js'

class MemoryKv {
  values = new Map()

  async get(key, options) {
    const value = this.values.get(key) ?? null
    if (value && options?.type === 'json') return JSON.parse(value)
    return value
  }

  async put(key, value) {
    this.values.set(key, value)
  }

  async delete(key) {
    this.values.delete(key)
  }
}

const origin = 'https://sibesorkhemanvato-ux.github.io'
const env = () => ({
  APP_ORIGIN: origin,
  APP_URL: `${origin}/social-media-skills/`,
  BALE_BOT_TOKEN: 'server-only-token',
  BALE_BOT_USERNAME: 'building_test_bot',
  BALE_WEBHOOK_SECRET: 'webhook-secret',
  BALE_CONNECTIONS: new MemoryKv(),
})

function request(path, { method = 'GET', body, token, requestOrigin = origin } = {}) {
  const headers = { Origin: requestOrigin }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  return new Request(`https://worker.example${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

test('pairs once and sends notifications without exposing the bot token', async (context) => {
  const bindings = env()
  const sent = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    const method = String(url).split('/').at(-1)
    const payload = JSON.parse(options.body)
    if (method === 'getMe') return Response.json({ ok: true, result: { id: 1, username: 'building_test_bot' } })
    if (method === 'sendMessage') {
      sent.push(payload)
      return Response.json({ ok: true, result: { message_id: sent.length } })
    }
    return Response.json({ ok: false }, { status: 404 })
  }
  context.after(() => { globalThis.fetch = originalFetch })

  const webhook = await worker.fetch(new Request('https://worker.example/webhook/webhook-secret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { text: '/connect', chat: { id: 42 }, from: { id: 7 } } }),
  }), bindings)
  assert.equal(webhook.status, 200)
  const code = sent[0].text.match(/\b\d{8}\b/)?.[0]
  assert.match(code, /^\d{8}$/)

  const paired = await worker.fetch(request('/api/pair', {
    method: 'POST',
    body: { code, profile: { displayName: 'کاربر تست', unitNo: '۲', buildingName: 'ساختمان تست' } },
  }), bindings)
  assert.equal(paired.status, 201)
  const pairData = await paired.json()
  assert.match(pairData.accessToken, /^[A-Za-z0-9_-]{40,80}$/)
  assert.equal(JSON.stringify(pairData).includes(bindings.BALE_BOT_TOKEN), false)
  assert.equal(await bindings.BALE_CONNECTIONS.get(`pair:${code}`), null)

  const reused = await worker.fetch(request('/api/pair', {
    method: 'POST',
    body: { code, profile: { displayName: 'مهاجم', unitNo: '۹' } },
  }), bindings)
  assert.equal(reused.status, 404)

  const status = await worker.fetch(request('/api/status', { token: pairData.accessToken }), bindings)
  assert.equal(status.status, 200)
  assert.equal((await status.json()).connected, true)

  const notified = await worker.fetch(request('/api/notify', {
    method: 'POST',
    token: pairData.accessToken,
    body: { text: 'پیام آزمایشی' },
  }), bindings)
  assert.equal(notified.status, 200)
  assert.equal(sent.at(-1).chat_id, 42)
  assert.equal(sent.at(-1).text, 'پیام آزمایشی')
})

test('rejects browser requests from unapproved origins', async () => {
  const response = await worker.fetch(request('/health', { requestOrigin: 'https://evil.example' }), env())
  assert.equal(response.status, 403)
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null)
})
