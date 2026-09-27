const required = ['BALE_BOT_TOKEN', 'BALE_WORKER_URL', 'BALE_WEBHOOK_SECRET']
const missing = required.filter((name) => !process.env[name])
if (missing.length) {
  console.error(`متغیرهای لازم تنظیم نشده‌اند: ${missing.join(', ')}`)
  process.exit(1)
}

const api = `https://tapi.bale.ai/bot${process.env.BALE_BOT_TOKEN}`
const workerUrl = process.env.BALE_WORKER_URL.replace(/\/+$/, '')
const webhookSecret = process.env.BALE_WEBHOOK_SECRET
if (!/^[A-Za-z0-9_-]{32,128}$/.test(webhookSecret)) {
  console.error('BALE_WEBHOOK_SECRET باید ۳۲ تا ۱۲۸ نویسه و فقط شامل حروف، عدد، خط تیره یا زیرخط باشد.')
  process.exit(1)
}

async function call(method, body) {
  const response = await fetch(`${api}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.ok) throw new Error(data.description || `${method} failed (${response.status})`)
  return data.result
}

try {
  const bot = await call('getMe', {})
  await call('setWebhook', { url: `${workerUrl}/webhook/${webhookSecret}` })
  console.log(`وب‌هوک بازوی @${bot.username || bot.id} با موفقیت فعال شد.`)
} catch (error) {
  console.error(`فعال‌سازی وب‌هوک ناموفق بود: ${error.message}`)
  process.exit(1)
}
