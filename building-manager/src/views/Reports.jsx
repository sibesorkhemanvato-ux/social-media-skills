import { useState } from 'react'
import { Card, Button, Empty, Stat } from '../components/ui'
import { money, num, periodLabel, shiftPeriod, faDateStr } from '../lib/utils'
import { sum, unitDebt, fundBalance } from '../lib/calc'

export default function Reports({ db, period }) {
  const { units, invoices, payments, expenses, settings } = db
  const [unitId, setUnitId] = useState(units[0]?.id ?? '')
  const unit = units.find((u) => u.id === unitId)

  const months = Array.from({ length: 6 }, (_, i) => shiftPeriod(period, i - 5)).reverse()

  const rows = months.map((p) => {
    const billed = sum(invoices.filter((i) => i.period === p), (i) => i.amount)
    const paid = sum(payments.filter((x) => x.period === p), (x) => x.amount)
    return { p, billed, paid, rate: billed ? Math.round((paid / billed) * 100) : 0 }
  })

  const statement = [
    ...invoices.filter((i) => i.unitId === unitId).map((i) => ({ k: i.id, date: i.createdAt, t: `شارژ ${periodLabel(i.period)}`, debit: i.amount, credit: 0 })),
    ...payments.filter((p) => p.unitId === unitId).map((p) => ({ k: p.id, date: p.date, t: `پرداخت (${p.method})`, debit: 0, credit: p.amount })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1))

  const exportCSV = () => {
    const head = ['واحد', 'مالک', 'ساکن', 'متراژ', 'نفرات', 'جمع صورتحساب', 'جمع پرداخت', 'بدهی']
    const lines = units.map((u) => {
      const billed = sum(invoices.filter((i) => i.unitId === u.id), (i) => i.amount)
      const paid = sum(payments.filter((p) => p.unitId === u.id), (p) => p.amount)
      return [u.no, u.owner, u.resident, u.area, u.people, billed, paid, billed - paid].join(',')
    })
    const blob = new Blob(['\uFEFF' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `گزارش-واحدها-${period}.csv`
    a.click()
  }

  return (
    <div className="stack">
      <div className="stats">
        <Stat label="جمع کل صورتحساب‌ها" value={money(sum(invoices, (i) => i.amount))} />
        <Stat label="جمع کل وصولی" value={money(sum(payments, (p) => p.amount))} tone="good" />
        <Stat label="جمع کل هزینه‌ها" value={money(sum(expenses, (e) => e.amount))} tone="warn" />
        <Stat label="موجودی صندوق" value={money(fundBalance(settings, payments, expenses))} tone="good" />
      </div>

      <Card title="عملکرد ماهانه" extra={<Button onClick={exportCSV}>خروجی CSV واحدها</Button>}>
        <table className="table">
          <thead><tr><th>ماه</th><th>صورتحساب</th><th>وصولی</th><th>مانده</th><th>درصد وصول</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.p}>
                <td>{periodLabel(r.p)}</td>
                <td>{money(r.billed)}</td>
                <td className="good-text">{money(r.paid)}</td>
                <td className={r.billed - r.paid > 0 ? 'bad-text' : ''}>{money(Math.max(0, r.billed - r.paid))}</td>
                <td>
                  <div className="progress"><div style={{ width: `${Math.min(100, r.rate)}%` }} /></div>
                  <span className="small">{num(r.rate)}٪</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card
        title="صورت‌حساب واحد"
        extra={
          <select className="input" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            {units.map((u) => <option key={u.id} value={u.id}>واحد {u.no} — {u.resident || u.owner}</option>)}
          </select>
        }
      >
        {!unit ? <Empty text="واحدی وجود ندارد." /> : (
          <>
            <div className="mini-stats">
              <span>مالک: <strong>{unit.owner}</strong></span>
              <span>ساکن: <strong>{unit.resident || '—'}</strong></span>
              <span>تماس: <strong className="ltr-num">{unit.phone || '—'}</strong></span>
              <span>مانده حساب: <strong className={unitDebt(unit.id, invoices, payments) > 0 ? 'bad-text' : 'good-text'}>{money(unitDebt(unit.id, invoices, payments))}</strong></span>
            </div>
            {statement.length === 0 ? <Empty text="تراکنشی ثبت نشده است." /> : (
              <table className="table">
                <thead><tr><th>تاریخ</th><th>شرح</th><th>بدهکار</th><th>بستانکار</th></tr></thead>
                <tbody>
                  {statement.map((r) => (
                    <tr key={r.k}>
                      <td>{faDateStr(r.date)}</td>
                      <td>{r.t}</td>
                      <td className={r.debit ? 'bad-text' : 'muted'}>{r.debit ? money(r.debit) : '—'}</td>
                      <td className={r.credit ? 'good-text' : 'muted'}>{r.credit ? money(r.credit) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
