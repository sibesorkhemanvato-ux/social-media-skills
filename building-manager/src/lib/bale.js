const STORAGE_KEY = 'bm3.baleConnection'

function normalizeUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '')
}

export const configuredBaleBridgeUrl = normalizeUrl(import.meta.env.VITE_BALE_BRIDGE_URL)
export const configuredBaleBotUsername = String(import.meta.env.VITE_BALE_BOT_USERNAME || '').trim().replace(/^@/, '')

export function readBaleConnection() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!saved?.accessToken || !saved?.bridgeUrl) return null
    return { ...saved, bridgeUrl: normalizeUrl(saved.bridgeUrl) }
  } catch {
    return null
  }
}

export function saveBaleConnection(connection) {
  const safeConnection = {
    bridgeUrl: normalizeUrl(connection.bridgeUrl),
    accessToken: connection.accessToken,
    botUsername: connection.botUsername || configuredBaleBotUsername,
    connectedAt: connection.connectedAt || new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safeConnection))
  return safeConnection
}

export function clearBaleConnection() {
  localStorage.removeItem(STORAGE_KEY)
}

export async function baleBridgeRequest(path, { method = 'GET', body, connection, signal } = {}) {
  const active = connection || readBaleConnection()
  const bridgeUrl = normalizeUrl(active?.bridgeUrl || configuredBaleBridgeUrl)
  if (!bridgeUrl) throw new Error('پل امن بله هنوز فعال نشده است.')

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (active?.accessToken) headers.Authorization = `Bearer ${active.accessToken}`

  const response = await fetch(`${bridgeUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'ارتباط با سرویس بله برقرار نشد.')
  return data
}

/**
 * اعلان‌های برنامه فقط به پل امن ارسال می‌شوند. توکن اصلی بازوی بله هرگز در
 * مرورگر، localStorage، فایل خروجی Vite یا مخزن Git قرار نمی‌گیرد.
 */
export async function notifyBale(text) {
  const connection = readBaleConnection()
  if (!connection) return false
  try {
    await baleBridgeRequest('/api/notify', {
      method: 'POST',
      connection,
      body: { text: String(text).slice(0, 2000) },
    })
    return true
  } catch {
    return false
  }
}
