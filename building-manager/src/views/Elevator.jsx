import { useMemo, useState } from 'react'
import { Badge, Button, Card, Empty, Field, Modal, Stat } from '../components/ui'
import { faDateStr, money, num, todayISO, uid } from '../lib/utils'

const dayMs = 86400000
const addDays = (iso, days) => {
  const date = new Date(`${iso}T12:00:00`)
  date.setDate(date.getDate() + Number(days || 0))
  return date.toISOString().slice(0, 10)
}

export default function Elevator({ db, set, addLog }) {
  const { elevatorServices = [], settings } = db
  const interval = Number(settings.elevatorIntervalDays || 30)
  const [form, setForm] = useState(null)
  const sorted = [...elevatorServices].sort((a, b) => b.date.localeCompare(a.date))
  const last = sorted[0]
  const nextDate = last ? addDays(last.date, interval) : todayISO()
  const daysLeft = Math.ceil((new Date(`${nextDate}T23:59:59`) - new Date()) / dayMs)
  const state = !last || daysLeft < 0 ? 'سررسید گذشته' : daysLeft <= 7 ? 'نزدیک به سررسید' : 'برنامه‌ریزی‌شده'
  const tone = state === 'سررسید گذشته' ? 'red' : state === 'نزدیک به سررسید' ? 'amber' : 'green'
  const total = useMemo(() => elevatorServices.reduce((n, x) => n + Number(x.cost || 0), 0), [elevatorServices])

  const save = (e) => {
    e.preventDefault()
    const record = { ...form, id: uid(), cost: Number(form.cost || 0) }
    set.elevatorServices([record, ...elevatorServices])
    addLog(`سرویس دوره‌ای آسانسور در ${faDateStr(record.date)} ثبت شد.`)
    setForm(null)
  }

  return (
    <div className="stack">
      <div className="stats">
        <Stat label="آخرین سرویس" value={last ? faDateStr(last.date) : 'ثبت نشده'} hint={last?.company || 'سوابق سرویس را ثبت کنید'} />
        <Stat label="موعد سرویس بعدی" value={faDateStr(nextDate)} hint={daysLeft >= 0 ? `${num(daysLeft)} روز باقی مانده` : `${num(Math.abs(daysLeft))} روز تأخیر`} tone={tone === 'red' ? 'bad' : tone === 'amber' ? 'warn' : 'good'} />
        <Stat label="مجموع هزینه نگهداری" value={money(total)} hint={`${num(elevatorServices.length)} سرویس ثبت‌شده`} />
      </div>

      <Card title="یادآوری دوره‌ای آسانسور" extra={<Badge tone={tone}>{state}</Badge>}>
        <div className="row-between">
          <p className="muted">موعد بعدی به‌صورت خودکار، {num(interval)} روز پس از آخرین سرویس محاسبه می‌شود.</p>
          <div className="row">
            <label className="row small">تکرار هر
              <input className="input tiny" type="number" min="1" value={interval} onChange={(e) => set.settings({ ...settings, elevatorIntervalDays: Number(e.target.value || 30) })} /> روز
            </label>
            <Button variant="primary" onClick={() => setForm({ date: todayISO(), company: '', technician: '', cost: '', note: '' })}>ثبت سرویس جدید</Button>
          </div>
        </div>
      </Card>

      <Card title="سوابق سرویس و نگهداری">
        {!sorted.length ? <Empty text="هنوز سابقه‌ای برای آسانسور ثبت نشده است." /> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>تاریخ</th><th>شرکت سرویس‌کار</th><th>تکنسین</th><th>هزینه</th><th>شرح اقدامات</th></tr></thead>
            <tbody>{sorted.map((item) => <tr key={item.id}>
              <td>{faDateStr(item.date)}</td><td>{item.company || '—'}</td><td>{item.technician || '—'}</td><td>{money(item.cost)}</td><td>{item.note || '—'}</td>
            </tr>)}</tbody>
          </table></div>
        )}
      </Card>

      <Modal open={!!form} onClose={() => setForm(null)} title="ثبت سرویس آسانسور">
        {form && <form className="form-grid" onSubmit={save}>
          <Field label="تاریخ سرویس" hint={faDateStr(form.date)}><input className="input" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="هزینه (تومان)"><input className="input" type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></Field>
          <Field label="شرکت سرویس‌کار"><input className="input" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
          <Field label="نام تکنسین"><input className="input" value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} /></Field>
          <Field label="شرح اقدامات"><textarea className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          <div className="form-actions"><Button type="button" onClick={() => setForm(null)}>انصراف</Button><Button type="submit" variant="primary">ثبت سرویس</Button></div>
        </form>}
      </Modal>
    </div>
  )
}
