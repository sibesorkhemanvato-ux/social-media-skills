import { useState } from 'react'
import { Card, Button, Modal, Field, Badge, Empty } from '../components/ui'
import { money, num, uid } from '../lib/utils'
import { chargeFor } from '../lib/calc'
import { unitLedger } from '../lib/rules'

const OCCUPANCY_STATUSES = ['مالک ساکن', 'مستأجر', 'خالی']
const blank = { no: '', floor: 1, owner: '', resident: '', phone: '', area: 100, people: 2, parking: 1, vacant: false, occupancyStatus: 'مالک ساکن' }

export default function Units({ db, set, me }) {
  const { units, settings, constitution, invoices, payments, responsibilities } = db
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blank)
  const [q, setQ] = useState('')

  const edit = (u) => { setForm(u); setOpen(true) }
  const add = () => { setForm({ ...blank, id: undefined }); setOpen(true) }

  const save = (e) => {
    e.preventDefault()
    const data = {
      ...form,
      floor: Number(form.floor), area: Number(form.area),
      people: Number(form.people), parking: Number(form.parking),
      vacant: form.occupancyStatus === 'خالی',
      resident: form.occupancyStatus === 'خالی' ? '' : form.resident,
    }
    set.units(form.id ? units.map((u) => (u.id === form.id ? data : u)) : [...units, { ...data, id: uid() }])
    setOpen(false)
  }

  const remove = (u) => {
    if (u.id === me?.id) {
      alert('واحد متصل به حساب شما قابل حذف نیست.')
      return
    }
    if (!confirm(`واحد ${u.no} حذف شود؟ صورتحساب‌ها، پرداخت‌ها و مسئولیت‌های آن هم حذف می‌شوند.`)) return
    set.units(units.filter((x) => x.id !== u.id))
    set.invoices(invoices.filter((i) => i.unitId !== u.id))
    set.payments(payments.filter((p) => p.unitId !== u.id))
    set.responsibilities(responsibilities.filter((item) => item.unitId !== u.id))
  }

  const filtered = units.filter((u) =>
    [u.no, u.owner, u.resident, u.phone].join(' ').toLowerCase().includes(q.trim().toLowerCase()),
  )

  return (
    <Card
      title={`واحدها (${num(units.length)})`}
      extra={
        <div className="row">
          <input className="input" placeholder="جستجوی واحد یا نام…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button variant="primary" onClick={add}>+ واحد جدید</Button>
        </div>
      }
    >
      {filtered.length === 0 ? <Empty text="واحدی یافت نشد." /> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>واحد</th><th>طبقه</th><th>مالک</th><th>ساکن</th><th>تماس</th><th>وضعیت سکونت</th>
                <th>متراژ</th><th>نفرات</th><th>پارکینگ</th><th>شارژ ماهانه</th><th>بدهی</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const debt = unitLedger(u.id, invoices, payments, constitution).total
                return (
                  <tr key={u.id}>
                    <td><strong>{u.no}</strong> {u.id === me?.id && <Badge tone="blue">شما</Badge>}</td>
                    <td>{num(u.floor)}</td>
                    <td>{u.owner}</td>
                    <td>{u.resident || '—'}</td>
                    <td className="ltr-num">{u.phone || '—'}</td>
                    <td><Badge tone={u.vacant ? 'gray' : 'green'}>{u.occupancyStatus || (u.vacant ? 'خالی' : 'مسکونی')}</Badge></td>
                    <td>{num(u.area)} م²</td>
                    <td>{num(u.people)}</td>
                    <td>{num(u.parking)}</td>
                    <td>{money(chargeFor(u, settings, units.length))}</td>
                    <td className={debt > 0 ? 'bad-text' : 'good-text'}>{debt > 0 ? money(debt) : 'تسویه'}</td>
                    <td className="actions">
                      <button className="icon-btn" title="ویرایش" onClick={() => edit(u)}>✏️</button>
                      <button className="icon-btn" title="حذف" onClick={() => remove(u)}>🗑️</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? `ویرایش واحد ${form.no}` : 'افزودن واحد'}>
        <form className="form-grid" onSubmit={save}>
          <Field label="شماره واحد"><input className="input" required value={form.no} onChange={(e) => setForm({ ...form, no: e.target.value })} /></Field>
          <Field label="طبقه"><input className="input" type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} /></Field>
          <Field label="نام مالک"><input className="input" required value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></Field>
          <Field label="نام ساکن"><input className="input" disabled={form.occupancyStatus === 'خالی'} required={form.occupancyStatus !== 'خالی'} value={form.resident} onChange={(e) => setForm({ ...form, resident: e.target.value })} /></Field>
          <Field label="شماره تماس"><input className="input ltr-input" type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="وضعیت سکونت">
            <select className="input" value={form.occupancyStatus || (form.vacant ? 'خالی' : 'مستأجر')} onChange={(e) => setForm({ ...form, occupancyStatus: e.target.value })}>
              {OCCUPANCY_STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
          </Field>
          <Field label="متراژ (متر مربع)"><input className="input" type="number" min="0" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></Field>
          <Field label="تعداد نفرات"><input className="input" type="number" min="0" value={form.people} onChange={(e) => setForm({ ...form, people: e.target.value })} /></Field>
          <Field label="تعداد پارکینگ"><input className="input" type="number" min="0" value={form.parking} onChange={(e) => setForm({ ...form, parking: e.target.value })} /></Field>
          <div className="form-actions">
            <Button type="button" onClick={() => setOpen(false)}>انصراف</Button>
            <Button type="submit" variant="primary">ذخیره</Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}
