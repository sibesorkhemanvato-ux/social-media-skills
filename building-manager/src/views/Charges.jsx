import { useState } from 'react'
import { Card, Button, Modal, Field, Empty, Badge } from '../components/ui'
import { StatusBadge } from './Dashboard'
import { money, num, uid, periodLabel, shiftPeriod, faDateStr, todayISO } from '../lib/utils'
import { chargeFor, sum } from '../lib/calc'
import { invoiceState } from '../lib/rules'

export default function Charges({ db, set, period, setPeriod, me, addLog }) {
  const { units, settings, constitution: c, invoices, payments } = db
  const [pay, setPay] = useState(null)

  const monthInvoices = invoices.filter((i) => i.period === period)
  const billed = sum(monthInvoices, (i) => i.amount)
  const paid = sum(payments.filter((p) => p.period === period), (p) => p.amount)

  const generate = () => {
    const existing = new Set(monthInvoices.map((i) => i.unitId))
    const fresh = units
      .filter((u) => !existing.has(u.id))
      .map((u) => ({ id: uid(), unitId: u.id, period, amount: chargeFor(u, settings), createdAt: todayISO() }))
    if (fresh.length === 0) return alert(`صورتحساب ${periodLabel(period)} برای همه واحدها از قبل صادر شده است.`)
    set.invoices([...invoices, ...fresh])
    addLog(`صدور خودکار شارژ ${periodLabel(period)} برای ${num(fresh.length)} واحد.`)
  }

  const savePayment = (e) => {
    e.preventDefault()
    set.payments([...payments, { ...pay, id: uid(), amount: Number(pay.amount) }])
    addLog(`پرداخت ${money(pay.amount)} برای واحد ${units.find((u) => u.id === pay.unitId)?.no} ثبت شد.`, `واحد ${me?.no}`)
    setPay(null)
  }

  const monthPayments = payments.filter((p) => p.period === period).sort((a, b) => (a.date < b.date ? 1 : -1))

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
          </div>
        }
      >
        <div className="mini-stats">
          <span>جمع صورتحساب: <strong>{money(billed)}</strong></span>
          <span>وصول‌شده: <strong className="good-text">{money(paid)}</strong></span>
          <span>مانده: <strong className="bad-text">{money(Math.max(0, billed - paid))}</strong></span>
          <span className="small">مهلت پرداخت طبق قانون‌نامه: {num(c.dueDays)} روز پس از صدور</span>
        </div>

        {monthInvoices.length === 0 ? (
          <Empty text={`برای ${periodLabel(period)} صورتحسابی صادر نشده است.`} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>واحد</th><th>ساکن</th><th>مبلغ</th><th>پرداختی</th><th>سررسید</th><th>تأخیر</th><th>جریمه</th><th>مانده کل</th><th>وضعیت</th><th></th></tr>
              </thead>
              <tbody>
                {units.map((u) => {
                  const inv = monthInvoices.find((i) => i.unitId === u.id)
                  if (!inv) return null
                  const st = invoiceState(inv, payments, c)
                  return (
                    <tr key={u.id} className={st.isPublic ? 'row-danger' : ''}>
                      <td><strong>{u.no}</strong> {u.id === me?.id && <Badge tone="blue">شما</Badge>}</td>
                      <td>{u.resident || u.owner}</td>
                      <td>{money(inv.amount)}</td>
                      <td>{money(st.paid)}</td>
                      <td>{faDateStr(st.due)}</td>
                      <td>{st.overdueDays ? `${num(st.overdueDays)} روز` : '—'}</td>
                      <td className={st.lateFee ? 'bad-text' : 'muted'}>{st.lateFee ? money(st.lateFee) : '—'}</td>
                      <td className={st.total > 0 ? 'bad-text' : 'good-text'}>{money(st.total)}</td>
                      <td className="row">
                        <StatusBadge state={st.state} />
                        {st.isPublic && <Badge tone="red">عمومی‌شده</Badge>}
                      </td>
                      <td className="actions">
                        {st.total > 0 && (
                          <Button variant="soft" onClick={() => setPay({ unitId: u.id, invoiceId: inv.id, period, amount: st.total, date: todayISO(), method: 'کارت به کارت', note: '' })}>
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
        <p className="muted small mt">
          جریمه {num(c.lateFeeDailyPercent)}٪ روزانه از روز {num(c.lateGraceDays)} پس از سررسید، و عمومی‌شدن بدهی پس از
          {' '}{num(c.publicAfterDays)} روز و {num(c.publicAfterWarnings)} هشدار — همه خودکار و یکسان برای هر ۸ واحد.
        </p>
      </Card>

      <Card title={`پرداخت‌های ${periodLabel(period)} (${num(monthPayments.length)})`}>
        {monthPayments.length === 0 ? <Empty text="پرداختی ثبت نشده است." /> : (
          <table className="table">
            <thead><tr><th>واحد</th><th>مبلغ</th><th>تاریخ</th><th>روش</th><th>توضیح</th></tr></thead>
            <tbody>
              {monthPayments.map((p) => (
                <tr key={p.id}>
                  <td>واحد {units.find((u) => u.id === p.unitId)?.no ?? '—'}</td>
                  <td className="good-text">{money(p.amount)}</td>
                  <td>{faDateStr(p.date)}</td>
                  <td>{p.method}</td>
                  <td className="muted">{p.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted small mt">پرداخت‌ها حذف‌شدنی نیستند؛ سابقه مالی برای همهٔ ساکنین قابل استناد است.</p>
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
            <Field label="تاریخ پرداخت" hint={faDateStr(pay.date)}><input className="input" type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></Field>
            <Field label="روش پرداخت">
              <select className="input" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>
                {['کارت به کارت', 'نقدی', 'دستگاه POS', 'انتقال بانکی'].map((m) => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="توضیح / شماره پیگیری"><input className="input" value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} /></Field>
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
