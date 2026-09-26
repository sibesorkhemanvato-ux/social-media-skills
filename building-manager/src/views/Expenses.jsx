import { useState } from 'react'
import { Card, Button, Modal, Field, Stat, Empty, Badge } from '../components/ui'
import { money, num, uid, faDateStr, todayISO } from '../lib/utils'
import { sum, fundBalance } from '../lib/calc'
import { expenseRoute } from '../lib/rules'

const CATS = ['قبوض', 'تعمیرات', 'نظافت', 'حقوق', 'آسانسور', 'فضای سبز', 'متفرقه']

export default function Expenses({ db, set, me, proposeVote, addLog, go }) {
  const { expenses, payments, settings, constitution: c, votes } = db
  const blank = { title: '', category: 'قبوض', amount: '', date: todayISO(), note: '', emergency: false, paidBy: me?.id }
  const [form, setForm] = useState(null)

  const total = sum(expenses, (e) => e.amount)
  const balance = fundBalance(settings, payments, expenses)
  const pendingVotes = votes.filter((v) => v.type === 'expense' && v.status === 'باز')

  const byCat = CATS.map((cat) => ({ c: cat, v: sum(expenses.filter((e) => e.category === cat), (e) => e.amount) }))
    .filter((x) => x.v > 0).sort((a, b) => b.v - a.v)
  const maxCat = Math.max(1, ...byCat.map((x) => x.v))

  const route = form ? expenseRoute(Number(form.amount || 0), form.emergency, c) : null

  const submit = (e) => {
    e.preventDefault()
    const data = { ...form, amount: Number(form.amount), id: uid(), by: `واحد ${me?.no}` }
    if (route.mode === 'auto') {
      set.expenses([...expenses, data])
      addLog(`هزینه «${data.title}» به مبلغ ${money(data.amount)} — ${route.reason}`, `واحد ${me?.no}`)
      setForm(null)
      return
    }
    proposeVote({
      type: 'expense',
      title: data.title,
      desc: `${route.reason} — پیشنهاد واحد ${me?.no}${data.note ? ` · ${data.note}` : ''}`,
      payload: { expense: { title: data.title, category: data.category, amount: data.amount, date: data.date, note: `مصوب رأی‌گیری · واحد ${me?.no}` } },
    })
    setForm(null)
    go('votes')
  }

  return (
    <div className="stack">
      <div className="stats">
        <Stat label="مجموع هزینه‌ها" value={money(total)} hint={`${num(expenses.length)} فقره`} tone="warn" />
        <Stat label="دریافتی از ساکنین" value={money(sum(payments, (p) => p.amount))} tone="good" />
        <Stat label="موجودی صندوق" value={money(balance)} tone={balance < 0 ? 'bad' : 'good'} />
        <Stat label="سقف هزینه بدون رأی" value={money(c.autoExpenseCap)} hint={`اضطراری تا ${money(c.emergencyCap)}`} />
      </div>

      {pendingVotes.length > 0 && (
        <Card title="هزینه‌های در انتظار رأی ساکنین">
          <ul className="list">
            {pendingVotes.map((v) => (
              <li key={v.id}>
                <div className="row-between">
                  <strong>{v.title}</strong>
                  <span className="row"><Badge tone="amber">در حال رأی‌گیری</Badge><button className="link" onClick={() => go('votes')}>رأی بدهید</button></span>
                </div>
                <p className="muted small">{money(v.payload?.expense?.amount ?? 0)} · {v.desc}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid-2">
        <Card title="هزینه‌ها به تفکیک دسته">
          {byCat.length === 0 ? <Empty text="هزینه‌ای ثبت نشده است." /> : (
            <ul className="hbars">
              {byCat.map((x) => (
                <li key={x.c}>
                  <span>{x.c}</span>
                  <div className="hbar"><div style={{ width: `${(x.v / maxCat) * 100}%` }} /></div>
                  <strong>{money(x.v)}</strong>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="قاعده خرج‌کردن از صندوق">
          <ul className="rule-list">
            <li>✅ تا <strong>{money(c.autoExpenseCap)}</strong>: هر ساکن با فاکتور ثبت می‌کند، بدون رأی و بدون اجازهٔ کسی.</li>
            <li>🗳️ بیشتر از آن: رأی‌گیری {num(c.voteHours)} ساعته؛ با {num(c.quorum)} موافق خودکار پرداخت می‌شود.</li>
            <li>🚨 اضطراری (آب، برق، آسانسور، گاز) تا <strong>{money(c.emergencyCap)}</strong> بدون رأی، با اعلان فوری.</li>
          </ul>
          <div className="formula">
            <span>{money(settings.openingBalance)}</span> + <span className="good-text">{money(sum(payments, (p) => p.amount))}</span> −{' '}
            <span className="bad-text">{money(total)}</span> = <strong>{money(balance)}</strong>
          </div>
        </Card>
      </div>

      <Card title="دفتر هزینه‌ها" extra={<Button variant="primary" onClick={() => setForm({ ...blank })}>+ ثبت هزینه</Button>}>
        {expenses.length === 0 ? <Empty text="هنوز هزینه‌ای ثبت نشده است." /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>عنوان</th><th>دسته</th><th>مبلغ</th><th>تاریخ</th><th>ثبت‌کننده</th><th>توضیح</th></tr></thead>
              <tbody>
                {[...expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).map((x) => (
                  <tr key={x.id}>
                    <td><strong>{x.title}</strong></td>
                    <td><Badge tone="blue">{x.category}</Badge></td>
                    <td className="bad-text">{money(x.amount)}</td>
                    <td>{faDateStr(x.date)}</td>
                    <td className="muted">{x.by || 'سیستم'}</td>
                    <td className="muted">{x.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small mt">هزینه‌های ثبت‌شده پاک نمی‌شوند؛ اصلاح فقط با ثبت سند جدید انجام می‌شود.</p>
      </Card>

      <Modal open={!!form} onClose={() => setForm(null)} title="ثبت هزینه از صندوق">
        {form && (
          <form className="form-grid" onSubmit={submit}>
            <Field label="عنوان هزینه"><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="دسته">
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATS.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="مبلغ (تومان)"><input className="input" type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field label="تاریخ" hint={faDateStr(form.date)}><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="توضیح / شماره فاکتور"><textarea className="input" rows="2" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <label className="check">
              <input type="checkbox" checked={form.emergency} onChange={(e) => setForm({ ...form, emergency: e.target.checked })} />
              <span>هزینه اضطراری است (آب، برق، گاز، آسانسور)</span>
            </label>
            <div className={`route ${route.mode}`}>
              {route.mode === 'auto' ? '✅ ' : '🗳️ '}{route.reason}
            </div>
            <div className="form-actions">
              <Button type="button" onClick={() => setForm(null)}>انصراف</Button>
              <Button type="submit" variant="primary">{route.mode === 'auto' ? 'ثبت هزینه' : 'شروع رأی‌گیری'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
