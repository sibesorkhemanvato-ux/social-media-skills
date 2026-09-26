import { useState } from 'react'
import { Card, Button, Modal, Field, Empty } from '../components/ui'
import { StatusBadge } from './Dashboard'
import { money, num, uid, periodLabel, shiftPeriod, faDateStr, todayISO } from '../lib/utils'
import { chargeFor, periodStatus, sum } from '../lib/calc'

export default function Charges({ db, set, period, setPeriod }) {
  const { units, settings, invoices, payments } = db
  const [pay, setPay] = useState(null)

  const monthInvoices = invoices.filter((i) => i.period === period)
  const billed = sum(monthInvoices, (i) => i.amount)
  const paid = sum(payments.filter((p) => p.period === period), (p) => p.amount)

  const generate = () => {
    const existing = new Set(monthInvoices.map((i) => i.unitId))
    const fresh = units
      .filter((u) => !existing.has(u.id))
      .map((u) => ({ id: uid(), unitId: u.id, period, amount: chargeFor(u, settings), createdAt: todayISO() }))
    if (fresh.length === 0) {
      alert(`صورتحساب ${periodLabel(period)} برای همه واحدها از قبل صادر شده است.`)
      return
    }
    set.invoices([...invoices, ...fresh])
  }

  const clearMonth = () => {
    if (!confirm(`صورتحساب‌های ${periodLabel(period)} حذف شود؟`)) return
    set.invoices(invoices.filter((i) => i.period !== period))
  }

  const savePayment = (e) => {
    e.preventDefault()
    set.payments([...payments, { ...pay, id: uid(), amount: Number(pay.amount) }])
    setPay(null)
  }

  const removePayment = (p) => {
    if (!confirm('این پرداخت حذف شود؟')) return
    set.payments(payments.filter((x) => x.id !== p.id))
  }

  const monthPayments = payments
    .filter((p) => p.period === period)
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <div className="stack">
      <Card
        title={`شارژ ${periodLabel(period)}`}
        extra={
          <div className="row">
            <button className="icon-btn" onClick={() => setPeriod(shiftPeriod(period, -1))} title="ماه قبل">›</button>
            <span className="period">{periodLabel(period)}</span>
            <button className="icon-btn" onClick={() => setPeriod(shiftPeriod(period, 1))} title="ماه بعد">‹</button>
            <Button variant="primary" onClick={generate}>صدور شارژ ماه</Button>
            <Button onClick={clearMonth}>حذف صورتحساب‌ها</Button>
          </div>
        }
      >
        <div className="mini-stats">
          <span>جمع صورتحساب: <strong>{money(billed)}</strong></span>
          <span>وصول‌شده: <strong className="good-text">{money(paid)}</strong></span>
          <span>مانده: <strong className="bad-text">{money(Math.max(0, billed - paid))}</strong></span>
        </div>

        {monthInvoices.length === 0 ? (
          <Empty text={`برای ${periodLabel(period)} صورتحسابی صادر نشده است. روی «صدور شارژ ماه» بزنید.`} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>واحد</th><th>ساکن</th><th>مبلغ شارژ</th><th>پرداختی</th><th>مانده</th><th>وضعیت</th><th></th></tr></thead>
              <tbody>
                {units.map((u) => {
                  const inv = monthInvoices.find((i) => i.unitId === u.id)
                  if (!inv) return null
                  const st = periodStatus(u.id, period, invoices, payments)
                  const rest = st.billed - st.paid
                  return (
                    <tr key={u.id}>
                      <td><strong>{u.no}</strong></td>
                      <td>{u.resident || u.owner}</td>
                      <td>{money(inv.amount)}</td>
                      <td>{money(st.paid)}</td>
                      <td className={rest > 0 ? 'bad-text' : 'good-text'}>{money(Math.max(0, rest))}</td>
                      <td><StatusBadge state={st.state} /></td>
                      <td className="actions">
                        {rest > 0 && (
                          <Button variant="soft" onClick={() => setPay({ unitId: u.id, period, amount: rest, date: todayISO(), method: 'کارت به کارت', note: '' })}>
                            ثبت پرداخت
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={`پرداخت‌های ${periodLabel(period)} (${num(monthPayments.length)})`}>
        {monthPayments.length === 0 ? <Empty text="پرداختی ثبت نشده است." /> : (
          <table className="table">
            <thead><tr><th>واحد</th><th>مبلغ</th><th>تاریخ</th><th>روش</th><th>توضیح</th><th></th></tr></thead>
            <tbody>
              {monthPayments.map((p) => (
                <tr key={p.id}>
                  <td>واحد {units.find((u) => u.id === p.unitId)?.no ?? '—'}</td>
                  <td className="good-text">{money(p.amount)}</td>
                  <td>{faDateStr(p.date)}</td>
                  <td>{p.method}</td>
                  <td className="muted">{p.note || '—'}</td>
                  <td className="actions"><button className="icon-btn" onClick={() => removePayment(p)} title="حذف">🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!pay} onClose={() => setPay(null)} title="ثبت پرداخت شارژ">
        {pay && (
          <form className="form-grid" onSubmit={savePayment}>
            <Field label="واحد">
              <select className="input" value={pay.unitId} onChange={(e) => setPay({ ...pay, unitId: e.target.value })}>
                {units.map((u) => <option key={u.id} value={u.id}>واحد {u.no} — {u.resident || u.owner}</option>)}
              </select>
            </Field>
            <Field label="مبلغ (تومان)"><input className="input" type="number" required value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
            <Field label="تاریخ پرداخت" hint={faDateStr(pay.date)}>
              <input className="input" type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} />
            </Field>
            <Field label="روش پرداخت">
              <select className="input" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                {['کارت به کارت', 'نقدی', 'دستگاه POS', 'انتقال بانکی'].map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="توضیح"><input className="input" value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} /></Field>
            <div className="form-actions">
              <Button type="button" onClick={() => setPay(null)}>انصراف</Button>
              <Button type="submit" variant="primary">ثبت</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
