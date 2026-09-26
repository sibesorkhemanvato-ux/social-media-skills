import { useState } from 'react'
import { Card, Button, Modal, Field, Stat, Empty, Badge } from '../components/ui'
import { money, num, uid, faDateStr, todayISO } from '../lib/utils'
import { sum, fundBalance } from '../lib/calc'

const CATS = ['قبوض', 'تعمیرات', 'نظافت', 'حقوق', 'آسانسور', 'فضای سبز', 'متفرقه']
const blank = { title: '', category: 'قبوض', amount: '', date: todayISO(), note: '' }

export default function Expenses({ db, set }) {
  const { expenses, payments, settings } = db
  const [form, setForm] = useState(null)

  const total = sum(expenses, (e) => e.amount)
  const balance = fundBalance(settings, payments, expenses)

  const byCat = CATS.map((c) => ({
    c,
    v: sum(expenses.filter((e) => e.category === c), (e) => e.amount),
  })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v)
  const maxCat = Math.max(1, ...byCat.map((x) => x.v))

  const save = (e) => {
    e.preventDefault()
    const data = { ...form, amount: Number(form.amount) }
    set.expenses(form.id ? expenses.map((x) => (x.id === form.id ? data : x)) : [...expenses, { ...data, id: uid() }])
    setForm(null)
  }

  const remove = (x) => {
    if (!confirm(`هزینه «${x.title}» حذف شود؟`)) return
    set.expenses(expenses.filter((e) => e.id !== x.id))
  }

  return (
    <div className="stack">
      <div className="stats">
        <Stat label="مجموع هزینه‌ها" value={money(total)} hint={`${num(expenses.length)} فقره`} tone="warn" />
        <Stat label="مجموع دریافتی از ساکنین" value={money(sum(payments, (p) => p.amount))} tone="good" />
        <Stat label="موجودی صندوق" value={money(balance)} tone={balance < 0 ? 'bad' : 'good'} />
      </div>

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

        <Card title="راهنمای صندوق">
          <p className="muted">
            موجودی صندوق برابر است با مانده اولیه، به‌علاوه تمام شارژهای دریافتی، منهای هزینه‌های ثبت‌شده.
            مانده اولیه را می‌توانید در بخش «تنظیمات» تغییر دهید.
          </p>
          <div className="formula">
            <span>{money(settings.openingBalance)}</span> + <span className="good-text">{money(sum(payments, (p) => p.amount))}</span> −{' '}
            <span className="bad-text">{money(total)}</span> = <strong>{money(balance)}</strong>
          </div>
        </Card>
      </div>

      <Card title="دفتر هزینه‌ها" extra={<Button variant="primary" onClick={() => setForm({ ...blank })}>+ ثبت هزینه</Button>}>
        {expenses.length === 0 ? <Empty text="هنوز هزینه‌ای ثبت نشده است." /> : (
          <table className="table">
            <thead><tr><th>عنوان</th><th>دسته</th><th>مبلغ</th><th>تاریخ</th><th>توضیح</th><th></th></tr></thead>
            <tbody>
              {[...expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).map((x) => (
                <tr key={x.id}>
                  <td><strong>{x.title}</strong></td>
                  <td><Badge tone="blue">{x.category}</Badge></td>
                  <td className="bad-text">{money(x.amount)}</td>
                  <td>{faDateStr(x.date)}</td>
                  <td className="muted">{x.note || '—'}</td>
                  <td className="actions">
                    <button className="icon-btn" onClick={() => setForm(x)} title="ویرایش">✏️</button>
                    <button className="icon-btn" onClick={() => remove(x)} title="حذف">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'ویرایش هزینه' : 'ثبت هزینه جدید'}>
        {form && (
          <form className="form-grid" onSubmit={save}>
            <Field label="عنوان هزینه"><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="دسته">
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="مبلغ (تومان)"><input className="input" type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field label="تاریخ" hint={faDateStr(form.date)}><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="توضیح"><textarea className="input" rows="2" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <div className="form-actions">
              <Button type="button" onClick={() => setForm(null)}>انصراف</Button>
              <Button type="submit" variant="primary">ذخیره</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
