import { useState } from 'react'
import { Card, Button, Modal, Field, Badge, Empty } from '../components/ui'
import { uid, faDateStr, todayISO, num } from '../lib/utils'

const STATUSES = ['باز', 'در حال بررسی', 'انجام‌شده']
const PRIORITIES = ['کم', 'متوسط', 'زیاد']

export default function Tickets({ db, set, me, addLog }) {
  const { tickets, units } = db
  const [form, setForm] = useState(null)
  const blank = { unitId: me?.id ?? units[0]?.id ?? '', title: '', desc: '', priority: 'متوسط', status: 'باز', createdAt: todayISO(), assignee: '' }

  const save = (e) => {
    e.preventDefault()
    if (form.id) {
      set.tickets(tickets.map((t) => (t.id === form.id ? form : t)))
      addLog(`درخواست «${form.title}» ویرایش شد.`, `واحد ${me?.no}`, me?.id)
    } else {
      set.tickets([{ ...form, id: uid(), createdByUnitId: me?.id }, ...tickets])
      addLog(`درخواست «${form.title}» ثبت شد.`, `واحد ${me?.no}`, me?.id)
    }
    setForm(null)
  }

  const move = (t, status) => set.tickets(tickets.map((x) => (x.id === t.id ? { ...x, status } : x)))
  const remove = (t) => {
    if (!confirm(`درخواست «${t.title}» حذف شود؟`)) return
    set.tickets(tickets.filter((x) => x.id !== t.id))
  }

  return (
    <Card title="درخواست‌های تعمیرات" extra={<Button variant="primary" onClick={() => setForm({ ...blank })}>+ درخواست جدید</Button>}>
      <div className="board">
        {STATUSES.map((s) => {
          const items = tickets.filter((t) => t.status === s)
          return (
            <div className="column" key={s}>
              <h4>{s} <span className="count">{num(items.length)}</span></h4>
              {items.length === 0 ? <Empty text="موردی نیست." /> : items.map((t) => {
                const u = units.find((x) => x.id === t.unitId)
                return (
                  <article className="ticket" key={t.id}>
                    <div className="row-between">
                      <strong>{t.title}</strong>
                      <Badge tone={t.priority === 'زیاد' ? 'red' : t.priority === 'متوسط' ? 'amber' : 'gray'}>{t.priority}</Badge>
                    </div>
                    {t.desc && <p className="muted">{t.desc}</p>}
                    <p className="muted small">
                      واحد {u?.no ?? '—'} · {faDateStr(t.createdAt)}{t.assignee ? ` · مسئول: ${t.assignee}` : ''}
                    </p>
                    <div className="ticket-actions">
                      <select className="input tiny" value={t.status} onChange={(e) => move(t, e.target.value)}>
                        {STATUSES.map((x) => <option key={x}>{x}</option>)}
                      </select>
                      <button className="icon-btn" onClick={() => setForm(t)} title="ویرایش">✏️</button>
                      <button className="icon-btn" onClick={() => remove(t)} title="حذف">🗑️</button>
                    </div>
                  </article>
                )
              })}
            </div>
          )
        })}
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'ویرایش درخواست' : 'ثبت درخواست تعمیرات'}>
        {form && (
          <form className="form-grid" onSubmit={save}>
            <Field label="واحد">
              <select className="input" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
                {units.map((u) => <option key={u.id} value={u.id}>واحد {u.no} — {u.resident || u.owner}</option>)}
              </select>
            </Field>
            <Field label="عنوان مشکل"><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="توضیحات"><textarea className="input" rows="3" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} /></Field>
            <Field label="اولویت">
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="وضعیت">
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="مسئول پیگیری"><input className="input" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} /></Field>
            <div className="form-actions">
              <Button type="button" onClick={() => setForm(null)}>انصراف</Button>
              <Button type="submit" variant="primary">ذخیره</Button>
            </div>
          </form>
        )}
      </Modal>
    </Card>
  )
}
