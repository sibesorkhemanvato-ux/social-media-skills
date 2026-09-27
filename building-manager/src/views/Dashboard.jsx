import { Card, Stat, Badge, Empty, Button } from '../components/ui'
import { money, periodLabel, shiftPeriod, faDateStr, num } from '../lib/utils'
import { sum, fundBalance } from '../lib/calc'
import { tally, dutiesFor } from '../lib/rules'
import { belongsToProfile, responsibilityTiming } from '../lib/responsibilities'

export default function Dashboard({ db, period, go, me, ledgers, publicDebtors }) {
  const { units, invoices, payments, expenses, announcements, tickets, settings, constitution: c, votes, log, responsibilities, profile } = db

  const balance = fundBalance(settings, payments, expenses)
  const monthBilled = sum(invoices.filter((i) => i.period === period), (i) => i.amount)
  const monthPaid = sum(payments.filter((p) => p.period === period), (p) => p.amount)
  const collectRate = monthBilled ? Math.round((monthPaid / monthBilled) * 100) : 0
  const totalDebt = sum(ledgers, (x) => x.l.total)
  const openVotes = votes.filter((v) => v.status === 'باز')
  const openTickets = tickets.filter((t) => t.status !== 'انجام‌شده')
  const myLedger = ledgers.find((x) => x.u.id === me?.id)
  const myDuty = dutiesFor(period, units).filter((d) => d.unit.id === me?.id)
  const responsibilityReminders = responsibilities.filter((item) => {
    const level = responsibilityTiming(item).level
    return belongsToProfile(item, profile, me) && item.status === 'فعال' && level !== 'normal'
  })

  const months = Array.from({ length: 6 }, (_, i) => shiftPeriod(period, i - 5))
  const chart = months.map((p) => ({
    p,
    billed: sum(invoices.filter((i) => i.period === p), (i) => i.amount),
    paid: sum(payments.filter((x) => x.period === p), (x) => x.amount),
  }))
  const max = Math.max(1, ...chart.flatMap((x) => [x.billed, x.paid]))

  return (
    <div className="stack">
      <Card className="me-card">
        <div className="row-between">
          <div>
            <h3>واحد {me?.no} — {me?.resident || me?.owner}</h3>
            <p className="muted small">این ساختمان مدیر انسانی ندارد؛ اپ طبق قانون‌نامه و رأی {num(c.quorum)} از {num(units.length)} تصمیم می‌گیرد.</p>
          </div>
          <div className="row">
            <div className="me-figure">
              <span className="small muted">بدهی شما</span>
              <strong className={myLedger?.l.total ? 'bad-text' : 'good-text'}>
                {myLedger?.l.total ? money(myLedger.l.total) : 'تسویه'}
              </strong>
              {myLedger?.l.fees > 0 && <span className="small bad-text">شامل {money(myLedger.l.fees)} جریمه دیرکرد</span>}
            </div>
            {myDuty.length > 0 && (
              <div className="me-figure">
                <span className="small muted">نوبت این ماه شما</span>
                <strong>{myDuty.map((d) => `${d.icon} ${d.label}`).join(' · ')}</strong>
              </div>
            )}
            {openVotes.length > 0 && <Button variant="primary" onClick={() => go('votes')}>🗳️ {num(openVotes.length)} رأی‌گیری منتظر شماست</Button>}
          </div>
        </div>
      </Card>

      {responsibilityReminders.length > 0 && (
        <div className="dashboard-reminders">
          {responsibilityReminders.map((item) => {
            const timing = responsibilityTiming(item)
            return (
              <button key={item.id} className={`responsibility-alert ${timing.level}`} onClick={() => go('account')}>
                <span className="alert-icon">{timing.level === 'overdue' ? '🚨' : '⏰'}</span>
                <span><strong>{item.title}</strong><small>{timing.label} · مهلت {faDateStr(item.dueDate)}</small></span>
                <span className="alert-action">حساب من</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="stats">
        <Stat label="موجودی صندوق" value={money(balance)} hint="قابل مشاهده برای همه واحدها" tone={balance < 0 ? 'bad' : 'good'} />
        <Stat label={`وصولی ${periodLabel(period)}`} value={`${num(collectRate)}٪`} hint={`${money(monthPaid)} از ${money(monthBilled)}`} tone={collectRate >= 80 ? 'good' : 'warn'} />
        <Stat label="بدهی و جریمه کل" value={money(totalDebt)} hint={`${num(ledgers.filter((x) => x.l.debt > 0).length)} واحد بدهکار`} tone={totalDebt ? 'bad' : 'good'} />
        <Stat label="درخواست‌های باز" value={num(openTickets.length)} hint="تعمیرات و خرابی‌ها" tone={openTickets.length ? 'warn' : 'good'} />
      </div>

      {publicDebtors.length > 0 && (
        <Card title="📣 بدهی‌های عمومی‌شده" className="danger-card">
          <p className="muted small">
            طبق بند قانون‌نامه، پس از {num(c.publicAfterDays)} روز تأخیر و {num(c.publicAfterWarnings)} هشدار خودکار،
            بدهی برای همهٔ ساکنین قابل مشاهده می‌شود. این کار را سیستم انجام داده است، نه هیچ فرد.
          </p>
          <table className="table">
            <thead><tr><th>واحد</th><th>ساکن</th><th>روز تأخیر</th><th>هشدارها</th><th>اصل بدهی</th><th>جریمه</th><th>جمع</th></tr></thead>
            <tbody>
              {publicDebtors.map(({ u, l }) => (
                <tr key={u.id}>
                  <td><strong>{u.no}</strong></td>
                  <td>{u.resident || u.owner}</td>
                  <td>{num(Math.max(...l.rows.map((r) => r.st.overdueDays)))}</td>
                  <td>{num(l.warnings)}</td>
                  <td>{money(l.debt)}</td>
                  <td className="bad-text">{money(l.fees)}</td>
                  <td><strong>{money(l.total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="grid-2">
        <Card title="شارژ در برابر وصولی (۶ ماه)">
          <div className="chart">
            {chart.map((x) => (
              <div className="chart-col" key={x.p}>
                <div className="bars">
                  <div className="bar billed" style={{ height: `${(x.billed / max) * 100}%` }} title={`صورتحساب: ${money(x.billed)}`} />
                  <div className="bar paid" style={{ height: `${(x.paid / max) * 100}%` }} title={`وصولی: ${money(x.paid)}`} />
                </div>
                <span>{periodLabel(x.p).split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <div className="legend"><i className="dot billed" /> صورتحساب <i className="dot paid" /> وصول‌شده</div>
        </Card>

        <Card title="رأی‌گیری‌های جاری" extra={<button className="link" onClick={() => go('votes')}>همه</button>}>
          {openVotes.length === 0 ? <Empty text="تصمیم بازی روی میز نیست." /> : (
            <ul className="list">
              {openVotes.map((v) => {
                const t = tally(v, units.length, c)
                return (
                  <li key={v.id}>
                    <div className="row-between">
                      <strong>{v.title}</strong>
                      <Badge tone={v.ballots?.[me?.id] ? 'green' : 'amber'}>{v.ballots?.[me?.id] ? 'رأی دادید' : 'منتظر رأی شما'}</Badge>
                    </div>
                    <p className="muted small">{num(t.yes)} موافق از نصاب {num(t.quorum)} · مهلت تا {faDateStr(v.deadline)}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid-2">
        <Card title="کارهایی که سیستم خودش انجام می‌دهد">
          <ul className="rule-list">
            <li>📅 صدور خودکار شارژ اول هر ماه برای {num(units.length)} واحد</li>
            <li>⏰ یادآوری هر {num(c.warningEveryHours)} ساعت پس از پایان مهلت {num(c.dueDays)} روزه</li>
            <li>➕ جریمه {num(c.lateFeeDailyPercent)}٪ روزانه از روز {num(c.lateGraceDays)} پس از مهلت</li>
            <li>📣 عمومی‌کردن بدهی پس از {num(c.publicAfterDays)} روز و {num(c.publicAfterWarnings)} هشدار</li>
            <li>💸 ثبت خودکار هزینه تا {money(c.autoExpenseCap)} و رأی‌گیری برای بیشتر از آن</li>
            <li>🔁 چرخش نوبت‌های اجرایی بین واحدها</li>
          </ul>
        </Card>

        <Card title="دفتر رویدادها (غیرقابل حذف)">
          {log.length === 0 ? <Empty text="هنوز رویدادی ثبت نشده است." /> : (
            <ul className="list">
              {log.slice(0, 6).map((e) => (
                <li key={e.id}>
                  <div className="row-between"><span>{e.text}</span><span className="muted small">{faDateStr(e.at)}</span></div>
                  <p className="muted small">{e.actor}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid-2">
        <Card title="آخرین اعلانات" extra={<button className="link" onClick={() => go('announcements')}>همه</button>}>
          {announcements.length === 0 ? <Empty text="اعلانی ثبت نشده است." /> : (
            <ul className="list">
              {[...announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned)).slice(0, 3).map((a) => (
                <li key={a.id}>
                  <div className="row-between">
                    <strong>{a.pinned ? '📌 ' : ''}{a.title}</strong>
                    <span className="muted small">{faDateStr(a.date)}</span>
                  </div>
                  <p className="muted clamp">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="درخواست‌های تعمیرات" extra={<button className="link" onClick={() => go('tickets')}>همه</button>}>
          {openTickets.length === 0 ? <Empty text="درخواست بازی وجود ندارد." /> : (
            <ul className="list">
              {openTickets.slice(0, 3).map((t) => {
                const u = units.find((x) => x.id === t.unitId)
                return (
                  <li key={t.id}>
                    <div className="row-between">
                      <strong>{t.title}</strong>
                      <Badge tone={t.priority === 'زیاد' ? 'red' : t.priority === 'متوسط' ? 'amber' : 'gray'}>{t.priority}</Badge>
                    </div>
                    <p className="muted small">واحد {u?.no ?? '—'} · {t.status} · {faDateStr(t.createdAt)}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

export function StatusBadge({ state }) {
  const tone =
    state === 'تسویه‌شده' ? 'green' : state === 'ناقص' ? 'amber' : state === 'معوق' ? 'red' : 'blue'
  return <Badge tone={tone}>{state}</Badge>
}
