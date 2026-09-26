import { Card, Stat, Badge, Empty } from '../components/ui'
import { money, periodLabel, shiftPeriod, faDateStr, num } from '../lib/utils'
import { sum, unitDebt, fundBalance, periodStatus } from '../lib/calc'

export default function Dashboard({ db, period, go }) {
  const { units, invoices, payments, expenses, announcements, tickets, settings } = db

  const balance = fundBalance(settings, payments, expenses)
  const monthBilled = sum(invoices.filter((i) => i.period === period), (i) => i.amount)
  const monthPaid = sum(payments.filter((p) => p.period === period), (p) => p.amount)
  const collectRate = monthBilled ? Math.round((monthPaid / monthBilled) * 100) : 0
  const totalDebt = units.reduce((a, u) => a + Math.max(0, unitDebt(u.id, invoices, payments)), 0)
  const openTickets = tickets.filter((t) => t.status !== 'انجام‌شده')

  const debtors = units
    .map((u) => ({ u, debt: unitDebt(u.id, invoices, payments) }))
    .filter((x) => x.debt > 0)
    .sort((a, b) => b.debt - a.debt)

  // نمودار ۶ ماه اخیر
  const months = Array.from({ length: 6 }, (_, i) => shiftPeriod(period, i - 5))
  const chart = months.map((p) => ({
    p,
    billed: sum(invoices.filter((i) => i.period === p), (i) => i.amount),
    paid: sum(payments.filter((x) => x.period === p), (x) => x.amount),
  }))
  const max = Math.max(1, ...chart.flatMap((c) => [c.billed, c.paid]))

  return (
    <div className="stack">
      <div className="stats">
        <Stat label="موجودی صندوق" value={money(balance)} hint={`شامل مانده اولیه ${num(settings.openingBalance)} تومان`} tone={balance < 0 ? 'bad' : 'good'} />
        <Stat label={`وصولی ${periodLabel(period)}`} value={`${num(collectRate)}٪`} hint={`${money(monthPaid)} از ${money(monthBilled)}`} tone={collectRate >= 80 ? 'good' : 'warn'} />
        <Stat label="مجموع بدهی ساکنین" value={money(totalDebt)} hint={`${num(debtors.length)} واحد بدهکار`} tone={totalDebt ? 'bad' : 'good'} />
        <Stat label="درخواست‌های باز" value={num(openTickets.length)} hint="تعمیرات و خرابی‌ها" tone={openTickets.length ? 'warn' : 'good'} />
      </div>

      <div className="grid-2">
        <Card title="شارژ در برابر وصولی (۶ ماه)">
          <div className="chart">
            {chart.map((c) => (
              <div className="chart-col" key={c.p}>
                <div className="bars">
                  <div className="bar billed" style={{ height: `${(c.billed / max) * 100}%` }} title={`صورتحساب: ${money(c.billed)}`} />
                  <div className="bar paid" style={{ height: `${(c.paid / max) * 100}%` }} title={`وصولی: ${money(c.paid)}`} />
                </div>
                <span>{periodLabel(c.p).split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <div className="legend">
            <i className="dot billed" /> صورتحساب <i className="dot paid" /> وصول‌شده
          </div>
        </Card>

        <Card title="بدهکاران" extra={<button className="link" onClick={() => go('charges')}>مدیریت شارژ</button>}>
          {debtors.length === 0 ? (
            <Empty text="هیچ واحدی بدهی ندارد 🎉" />
          ) : (
            <table className="table">
              <thead><tr><th>واحد</th><th>ساکن</th><th>وضعیت این ماه</th><th>بدهی</th></tr></thead>
              <tbody>
                {debtors.map(({ u, debt }) => (
                  <tr key={u.id}>
                    <td>واحد {u.no}</td>
                    <td>{u.resident || u.owner}</td>
                    <td><StatusBadge state={periodStatus(u.id, period, invoices, payments).state} /></td>
                    <td className="bad-text">{money(debt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="grid-2">
        <Card title="آخرین اعلانات" extra={<button className="link" onClick={() => go('announcements')}>همه</button>}>
          {announcements.length === 0 ? <Empty text="اعلانی ثبت نشده است." /> : (
            <ul className="list">
              {[...announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned)).slice(0, 4).map((a) => (
                <li key={a.id}>
                  <div className="row-between">
                    <strong>{a.pinned ? '📌 ' : ''}{a.title}</strong>
                    <span className="muted">{faDateStr(a.date)}</span>
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
              {openTickets.slice(0, 4).map((t) => {
                const u = units.find((x) => x.id === t.unitId)
                return (
                  <li key={t.id}>
                    <div className="row-between">
                      <strong>{t.title}</strong>
                      <Badge tone={t.priority === 'زیاد' ? 'red' : t.priority === 'متوسط' ? 'amber' : 'gray'}>{t.priority}</Badge>
                    </div>
                    <p className="muted">واحد {u?.no ?? '—'} · {t.status} · {faDateStr(t.createdAt)}</p>
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
    state === 'پرداخت‌شده' ? 'green' : state === 'ناقص' ? 'amber' : state === 'پرداخت‌نشده' ? 'red' : 'gray'
  return <Badge tone={tone}>{state}</Badge>
}
