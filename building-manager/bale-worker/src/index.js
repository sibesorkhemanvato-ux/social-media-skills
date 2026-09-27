const BALE_API = 'https://tapi.bale.ai'
const PAIR_TTL_SECONDS = 10 * 60
const CONNECTION_TTL_SECONDS = 180 * 24 * 60 * 60
const MAX_BODY_BYTES = 8_000

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || ''
  const allowed = String(env.APP_ORIGINS || env.APP_ORIGIN || '')
    .split(',')
    .map((item) => item.trim().replace(/\/$/, ''))
    .filter(Boolean)
  return allowed.includes(origin.replace(/\/$/, '')) ? origin : ''
}

function responseHeaders(origin = '') {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin
    headers.Vary = 'Origin'
  }
  return headers
}

function json(payload, status = 200, origin = '') {
  return new Response(JSON.stringify(payload), { status, headers: responseHeaders(origin) })
}

async function readJson(request) {
  const size = Number(request.headers.get('Content-Length') || 0)
  if (size > MAX_BODY_BYTES) throw new Error('payload_too_large')
  return request.json()
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function randomDigits(length = 8) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => String(byte % 10)).join('')
}

function randomToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function baleApi(env, method, body) {
  if (!env.BALE_BOT_TOKEN) throw new Error('bot_not_configured')
  const result = await fetch(`${BALE_API}/bot${env.BALE_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  })
  const data = await result.json().catch(() => ({}))
  if (!result.ok || !data.ok) throw new Error(data.description || `bale_${result.status}`)
  return data.result
}

async function sendMessage(env, chatId, text) {
  return baleApi(env, 'sendMessage', { chat_id: chatId, text: cleanText(text, 4096) })
}

async function getConnection(request, env) {
  const authorization = request.headers.get('Authorization') || ''
  const match = authorization.match(/^Bearer ([A-Za-z0-9_-]{40,80})$/)
  if (!match) return null
  const hash = await sha256(match[1])
  const connection = await env.BALE_CONNECTIONS.get(`connection:${hash}`, { type: 'json' })
  return connection ? { hash, connection } : null
}

async function handleHealth(env, origin) {
  try {
    const bot = await baleApi(env, 'getMe')
    return json({ ok: true, botUsername: bot.username || env.BALE_BOT_USERNAME || '' }, 200, origin)
  } catch {
    return json({ ok: false, error: 'سرویس بله در دسترس نیست.' }, 503, origin)
  }
}

async function handlePair(request, env, origin) {
  let body
  try {
    body = await readJson(request)
  } catch {
    return json({ error: 'درخواست معتبر نیست.' }, 400, origin)
  }

  const code = cleanText(body.code, 8).replace(/\D/g, '')
  if (code.length !== 8) return json({ error: 'کد اتصال باید ۸ رقمی باشد.' }, 400, origin)

  const pairKey = `pair:${code}`
  const pending = await env.BALE_CONNECTIONS.get(pairKey, { type: 'json' })
  if (!pending?.chatId) return json({ error: 'کد اشتباه یا منقضی شده است.' }, 404, origin)

  // Delete first: even two simultaneous requests cannot reuse the one-time code.
  await env.BALE_CONNECTIONS.delete(pairKey)

  const profile = {
    displayName: cleanText(body.profile?.displayName, 80),
    unitNo: cleanText(body.profile?.unitNo, 20),
    buildingName: cleanText(body.profile?.buildingName, 100),
  }
  if (!profile.displayName || !profile.unitNo) return json({ error: 'مشخصات حساب کامل نیست.' }, 400, origin)

  const accessToken = randomToken()
  const hash = await sha256(accessToken)
  const connectedAt = new Date().toISOString()
  const connection = { chatId: pending.chatId, baleUserId: pending.userId, profile, connectedAt }
  const previousHash = await env.BALE_CONNECTIONS.get(`chat:${pending.chatId}`)

  await Promise.all([
    previousHash ? env.BALE_CONNECTIONS.delete(`connection:${previousHash}`) : Promise.resolve(),
    env.BALE_CONNECTIONS.put(`connection:${hash}`, JSON.stringify(connection), { expirationTtl: CONNECTION_TTL_SECONDS }),
    env.BALE_CONNECTIONS.put(`chat:${pending.chatId}`, hash, { expirationTtl: CONNECTION_TTL_SECONDS }),
  ])

  let botUsername = env.BALE_BOT_USERNAME || ''
  try {
    const bot = await baleApi(env, 'getMe')
    botUsername = bot.username || botUsername
  } catch {
    // Pairing is already valid; a temporary getMe failure must not expose or discard it.
  }

  await sendMessage(env, pending.chatId, `✅ ${profile.displayName}، اتصال واحد ${profile.unitNo} به «${profile.buildingName || 'مدیر ساختمان'}» فعال شد.`)
  return json({ accessToken, connectedAt, botUsername }, 201, origin)
}

async function handleStatus(request, env, origin) {
  const active = await getConnection(request, env)
  if (!active) return json({ error: 'اتصال معتبر نیست.' }, 401, origin)
  return json({ ok: true, connected: true, connectedAt: active.connection.connectedAt }, 200, origin)
}

async function handleNotify(request, env, origin) {
  const active = await getConnection(request, env)
  if (!active) return json({ error: 'اتصال معتبر نیست.' }, 401, origin)

  const rateKey = `rate:${active.hash}`
  if (await env.BALE_CONNECTIONS.get(rateKey)) return json({ error: 'لطفاً چند لحظه بعد دوباره تلاش کنید.' }, 429, origin)

  let body
  try {
    body = await readJson(request)
  } catch {
    return json({ error: 'درخواست معتبر نیست.' }, 400, origin)
  }
  const text = cleanText(body.text, 2000)
  if (!text) return json({ error: 'متن اعلان خالی است.' }, 400, origin)

  await env.BALE_CONNECTIONS.put(rateKey, '1', { expirationTtl: 2 })
  try {
    await sendMessage(env, active.connection.chatId, text)
    return json({ ok: true }, 200, origin)
  } catch {
    return json({ error: 'ارسال پیام در بله ناموفق بود.' }, 502, origin)
  }
}

async function handleDisconnect(request, env, origin) {
  const active = await getConnection(request, env)
  if (!active) return json({ ok: true }, 200, origin)
  await Promise.all([
    env.BALE_CONNECTIONS.delete(`connection:${active.hash}`),
    env.BALE_CONNECTIONS.delete(`chat:${active.connection.chatId}`),
  ])
  return json({ ok: true }, 200, origin)
}

async function issuePairCode(env, message) {
  let code
  // Eight digits plus a short expiry make guessing impractical. Avoid the rare KV collision.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const candidate = randomDigits()
    if (!await env.BALE_CONNECTIONS.get(`pair:${candidate}`)) {
      code = candidate
      break
    }
  }
  if (!code) throw new Error('pair_code_unavailable')

  await env.BALE_CONNECTIONS.put(`pair:${code}`, JSON.stringify({
    chatId: message.chat.id,
    userId: message.from?.id || message.chat.id,
    createdAt: new Date().toISOString(),
  }), { expirationTtl: PAIR_TTL_SECONDS })

  const appLine = env.APP_URL ? `\n\nباز کردن برنامه:\n${env.APP_URL}` : ''
  await sendMessage(
    env,
    message.chat.id,
    `کد اتصال یک‌بارمصرف شما:\n\n${code}\n\nاین کد را در بخش «اتصال به بله» وارد کنید. کد تا ۱۰ دقیقه معتبر است و فقط یک‌بار استفاده می‌شود.${appLine}`,
  )
}

async function handleWebhook(request, env) {
  let update
  try {
    update = await readJson(request)
  } catch {
    return json({ ok: false }, 400)
  }

  const message = update.message
  if (!message?.chat?.id) return json({ ok: true })
  const text = cleanText(message.text, 100).split(/\s+/)[0].replace(/@[^\s]+$/, '').toLowerCase()

  try {
    if (text === '/start' || text === '/connect' || text === '/اتصال') {
      await issuePairCode(env, message)
    } else if (text === '/disconnect' || text === '/قطع') {
      const hash = await env.BALE_CONNECTIONS.get(`chat:${message.chat.id}`)
      if (hash) {
        await Promise.all([
          env.BALE_CONNECTIONS.delete(`connection:${hash}`),
          env.BALE_CONNECTIONS.delete(`chat:${message.chat.id}`),
        ])
      }
      await sendMessage(env, message.chat.id, 'اتصال‌های فعال این گفت‌وگو لغو شدند. برای اتصال دوباره /connect را بفرستید.')
    } else {
      await sendMessage(env, message.chat.id, 'برای اتصال برنامه /connect و برای قطع اتصال /disconnect را بفرستید.')
    }
  } catch {
    // Always acknowledge Bale quickly. Operational errors stay out of the public response.
  }
  return json({ ok: true })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const webhookPath = `/webhook/${env.BALE_WEBHOOK_SECRET || 'not-configured'}`

    if (url.pathname === webhookPath && request.method === 'POST') return handleWebhook(request, env)

    const origin = allowedOrigin(request, env)
    if (!origin) return json({ error: 'مبدأ درخواست مجاز نیست.' }, 403)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Max-Age': '86400',
          Vary: 'Origin',
        },
      })
    }

    if (url.pathname === '/health' && request.method === 'GET') return handleHealth(env, origin)
    if (url.pathname === '/api/pair' && request.method === 'POST') return handlePair(request, env, origin)
    if (url.pathname === '/api/status' && request.method === 'GET') return handleStatus(request, env, origin)
    if (url.pathname === '/api/notify' && request.method === 'POST') return handleNotify(request, env, origin)
    if (url.pathname === '/api/connection' && request.method === 'DELETE') return handleDisconnect(request, env, origin)
    return json({ error: 'مسیر پیدا نشد.' }, 404, origin)
  },
}
