import { useState } from 'react'
import { Card, Button, Modal, Field, Badge, Empty } from '../components/ui'
import { uid, faDateStr, todayISO } from '../lib/utils'

const CATS = ['اطلاعیه', 'جلسه', 'مالی', 'تعمیرات', 'هشدار']
const blank = { title: '', body: '', category: 'اطلاعیه', date: todayISO(), pinned: false }

export default function Announcements({ db, set }) {
  const { announcements } = db
  const [form, setForm] = useState(null)

  const save = (e) => {
    e.preventDefault()
    set.announcements(
      form.id ? announcements.map((a) => (a.id === form.id ? form : a)) : [{ ...form, id: uid() }, ...announcements],
    )
    setForm(null)
  }

  const remove = (a) => {
    if (!confirm(`اعلان «${a.title}» حذف شود؟`)) return
    set.announcements(announcements.filter((x) => x.id !== a.id))
  }

  const togglePin = (a) =>
    set.announcements(announcements.map((x) => (x.id === a.id ? { ...x, pinned: !x.pinned } : x)))

  const sorted = [...announcements].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || (a.date < b.date ? 1 : -1),
  )

  return (
    <Card title="تابلوی اعلانات" extra={<Button variant="primary" onClick={() => setForm({ ...blank })}>+ اعلان جدید</Button>}>
      {sorted.length === 0 ? <Empty text="هنوز اعلانی منتشر نشده است." /> : (
        <div className="notes">
          {sorted.map((a) => (
            <article className={`note ${a.pinned ? 'pinned' : ''}`} key={a.id}>
              <header>
                <div className="row">
                  <Badge tone={a.category === 'هشدار' ? 'red' : a.category === 'مالی' ? 'amber' : 'blue'}>{a.category}</Badge>
                  <h4>{a.title}</h4>
                </div>
                <div className="actions">
                  <button className="icon-btn" title={a.pinned ? 'برداشتن سنجاق' : 'سنجاق کردن'} onClick={() => togglePin(a)}>📌</button>
                  <button className="icon-btn" title="ویرایش" onClick={() => setForm(a)}>✏️</button>
                  <button className="icon-btn" title="حذف" onClick={() => remove(a)}>🗑️</button>
                </div>
              </header>
              <p>{a.body}</p>
              <footer className="muted">{faDateStr(a.date)}</footer>
            </article>
          ))}
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'ویرایش اعلان' : 'انتشار اعلان جدید'}>
        {form && (
          <form className="form-grid" onSubmit={save}>
            <Field label="عنوان"><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="دسته">
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="متن اعلان"><textarea className="input" rows="5" required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
            <Field label="تاریخ" hint={faDateStr(form.date)}><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <label className="check">
              <input type="checkbox" checked={!!form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
              <span>سنجاق شود (بالای تابلو نمایش داده می‌شود)</span>
            </label>
            <div className="form-actions">
              <Button type="button" onClick={() => setForm(null)}>انصراف</Button>
              <Button type="submit" variant="primary">انتشار</Button>
            </div>
          </form>
        )}
      </Modal>
    </Card>
  )
}
