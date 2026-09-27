import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Field } from '../components/ui'
import {
  baleBridgeRequest,
  clearBaleConnection,
  configuredBaleBotUsername,
  configuredBaleBridgeUrl,
  readBaleConnection,
  saveBaleConnection,
} from '../lib/bale'

const faDigits = (value) => String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])
const normalizeCode = (value) => String(value).replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/\D/g, '').slice(0, 8)

export default function BaleConnection({ db, me }) {
  const { profile, settings } = db
  const [connection, setConnection] = useState(() => readBaleConnection())
  const [health, setHealth] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const bridgeUrl = connection?.bridgeUrl || configuredBaleBridgeUrl
  const botUsername = connection?.botUsername || health?.botUsername || configuredBaleBotUsername
  const botLink = botUsername ? `https://ble.ir/${botUsername}` : 'https://ble.ir/botfather'

  const profileName = useMemo(
    () => profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' '),
    [profile],
  )

  useEffect(() => {
    if (!bridgeUrl) return
    const controller = new AbortController()
    baleBridgeRequest('/health', {
      connection: { bridgeUrl },
      signal: controller.signal,
    })
      .then(setHealth)
      .catch(() => setHealth({ ok: false }))
    return () => controller.abort()
  }, [bridgeUrl])

  useEffect(() => {
    if (!connection) return
    const controller = new AbortController()
    baleBridgeRequest('/api/status', { connection, signal: controller.signal })
      .then((data) => setHealth((current) => ({ ...current, ...data, ok: true })))
      .catch(() => {
        clearBaleConnection()
        setConnection(null)
        setMessage({ tone: 'error', text: 'اتصال قبلی منقضی شده است؛ دوباره کد اتصال بگیرید.' })
      })
    return () => controller.abort()
  }, [connection])

  const pair = async (event) => {
    event.preventDefault()
    if (!bridgeUrl || code.length !== 8) return
    setBusy(true)
    setMessage(null)
    try {
      const data = await baleBridgeRequest('/api/pair', {
        method: 'POST',
        connection: { bridgeUrl },
        body: {
          code,
          profile: {
            displayName: profileName,
            unitNo: String(me?.no || ''),
            buildingName: settings.buildingName,
          },
        },
      })
      const next = saveBaleConnection({
        bridgeUrl,
        accessToken: data.accessToken,
        botUsername: data.botUsername || botUsername,
      })
      setConnection(next)
      setCode('')
      setMessage({ tone: 'success', text: 'حساب شما با موفقیت به بازوی بله متصل شد.' })
    } catch (error) {
      setMessage({ tone: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  const sendTest = async () => {
    setBusy(true)
    setMessage(null)
    try {
      await baleBridgeRequest('/api/notify', {
        method: 'POST',
        connection,
        body: { text: `✅ اتصال «${settings.buildingName}» برای واحد ${me?.no} با موفقیت فعال است.` },
      })
      setMessage({ tone: 'success', text: 'پیام آزمایشی در بله ارسال شد.' })
    } catch (error) {
      setMessage({ tone: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  const disconnect = async () => {
    if (!confirm('اتصال این دستگاه به بازوی بله قطع شود؟')) return
    setBusy(true)
    try {
      if (connection) await baleBridgeRequest('/api/connection', { method: 'DELETE', connection })
    } catch {
      // Even if the server is unavailable, remove the expired local session.
    } finally {
      clearBaleConnection()
      setConnection(null)
      setHealth((current) => ({ ...current, connected: false }))
      setMessage({ tone: 'success', text: 'اتصال این دستگاه قطع شد.' })
      setBusy(false)
    }
  }

  return (
    <div className="stack bale-page">
      <Card className="bale-hero">
        <div className="bale-hero-row">
          <span className="bale-mark" aria-hidden="true">💬</span>
          <div>
            <div className="row bale-title-row">
              <h2>اتصال امن به بله</h2>
              {connection ? <Badge tone="green">متصل</Badge> : <Badge tone="amber">متصل نیست</Badge>}
            </div>
            <p className="muted">اعلان شارژ، پرداخت و درخواست‌های ساختمان را در گفت‌وگوی خصوصی بازو دریافت کنید.</p>
          </div>
        </div>
      </Card>

      {!bridgeUrl ? (
        <Card title="پل امن بله آمادهٔ فعال‌سازی است" className="bale-unavailable">
          <p>
            بخش اتصال با معماری امن پیاده‌سازی شده است، اما سرویس میانی هنوز نشانی فعال ندارد.
            تا زمان فعال‌سازی، هیچ توکنی از شما در این صفحه دریافت یا در مرورگر ذخیره نمی‌شود.
          </p>
          <p className="muted small">
            توکن اصلی فقط باید در Secret سرویس Cloudflare Worker نگهداری شود؛ قرار دادن آن در HTML، تنظیمات گوشی یا GitHub ممنوع است.
          </p>
        </Card>
      ) : connection ? (
        <Card title="وضعیت اتصال" extra={<Badge tone={health?.ok === false ? 'amber' : 'green'}>{health?.ok === false ? 'نیازمند بررسی' : 'فعال'}</Badge>}>
          <div className="bale-status-grid">
            <div><span>ساختمان</span><strong>{settings.buildingName}</strong></div>
            <div><span>حساب متصل</span><strong>{profileName}</strong></div>
            <div><span>واحد</span><strong>{faDigits(me?.no || '—')}</strong></div>
            <div><span>بازو</span><strong>{botUsername ? `@${botUsername}` : 'بازوی ساختمان'}</strong></div>
          </div>
          <div className="row mt">
            <Button variant="primary" onClick={sendTest} disabled={busy}>ارسال پیام آزمایشی</Button>
            <a className="btn soft bale-link" href={botLink} target="_blank" rel="noreferrer">باز کردن بله</a>
            <Button variant="danger" onClick={disconnect} disabled={busy}>قطع اتصال</Button>
          </div>
        </Card>
      ) : (
        <Card title="اتصال در سه مرحله">
          <ol className="bale-steps">
            <li>
              <span>۱</span>
              <div><strong>بازو را در بله باز کنید</strong><p className="muted small">دکمه زیر را بزنید و گفت‌وگو را شروع کنید.</p></div>
              <a className="btn soft bale-link" href={botLink} target="_blank" rel="noreferrer">باز کردن بازو</a>
            </li>
            <li>
              <span>۲</span>
              <div><strong>دستور اتصال را بفرستید</strong><p className="muted small">در بله پیام <bdi>/connect</bdi> را بفرستید؛ بازو یک کد ۸ رقمی یک‌بارمصرف می‌دهد.</p></div>
            </li>
            <li>
              <span>۳</span>
              <form className="bale-code-form" onSubmit={pair}>
                <Field label="کد یک‌بارمصرف ۸ رقمی">
                  <input
                    className="input bale-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="۱۲۳۴۵۶۷۸"
                    value={faDigits(code)}
                    onChange={(event) => setCode(normalizeCode(event.target.value))}
                    aria-describedby="bale-code-help"
                  />
                </Field>
                <Button type="submit" variant="primary" disabled={busy || code.length !== 8}>تأیید و اتصال</Button>
                <p id="bale-code-help" className="muted small">کد فقط ۱۰ دقیقه اعتبار دارد و پس از یک‌بار استفاده باطل می‌شود.</p>
              </form>
            </li>
          </ol>
        </Card>
      )}

      {message && <div className={`bale-message ${message.tone}`} role="status">{message.text}</div>}

      <Card title="امنیت اتصال">
        <ul className="security-list">
          <li><span aria-hidden="true">🔐</span><div><strong>توکن بازو بیرون از برنامه است</strong><p>توکن فقط به‌صورت Secret رمزگذاری‌شده در سرویس میانی قرار می‌گیرد و هرگز وارد HTML، JavaScript، localStorage یا GitHub نمی‌شود.</p></div></li>
          <li><span aria-hidden="true">⏱️</span><div><strong>کد اتصال یک‌بارمصرف است</strong><p>کد پس از ۱۰ دقیقه یا بلافاصله بعد از استفاده حذف می‌شود.</p></div></li>
          <li><span aria-hidden="true">📱</span><div><strong>هر دستگاه قابل قطع است</strong><p>کلید این دستگاه فقط اجازهٔ ارسال اعلان به گفت‌وگوی متصل خودتان را دارد و از همین صفحه قابل لغو است.</p></div></li>
        </ul>
      </Card>
    </div>
  )
}
