import { useState } from 'react'
import { Card, Button, Field, Modal, Badge } from '../components/ui'
import { money, num } from '../lib/utils'
import { chargeFor } from '../lib/calc'

const FORMULA = {
  fixed: 'مبلغ ثابت هر واحد (تومان)',
  perPerson: 'نرخ هر نفر (تومان)',
  perArea: 'نرخ هر متر مربع (تومان)',
  perParking: 'نرخ هر پارکینگ (تومان)',
  vacantRatio: 'درصد شارژ واحد خالی',
}

export default function Settings({ db, set, resetAll, proposeVote, go }) {
  const { settings, units, constitution: c, votes } = db
  const [form, setForm] = useState(null)
  const open = votes.filter((v) => v.status === 'باز' && v.payload?.settings)

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `پشتیبان-ساختمان-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  const importJSON = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        for (const k of ['units', 'invoices', 'payments', 'expenses', 'announcements', 'tickets', 'settings', 'constitution', 'votes', 'log']) {
          if (data[k]) set[k](data[k])
        }
        alert('اطلاعات با موفقیت بازیابی شد.')
      } catch {
        alert('فایل پشتیبان معتبر نیست.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const submit = (e) => {
    e.preventDefault()
    proposeVote({
      type: 'rule',
      title: `تغییر فرمول شارژ: ${FORMULA[form.key]}`,
      desc: `از ${num(settings[form.key])} به ${num(Number(form.value))}`,
      payload: { settings: { [form.key]: Number(form.value) } },
    })
    setForm(null)
    go('votes')
  }

  return (
    <div className="stack">
      <Card title="فرمول شارژ (فقط با رأی ساکنین تغییر می‌کند)">
        <p className="muted small">
          شارژ = مبلغ ثابت + (نرخ نفر × نفرات) + (نرخ متر × متراژ) + (نرخ پارکینگ × پارکینگ)؛ واحد خالی با ضریب {num(settings.vacantRatio)}٪.
          چون مدیر انسانی وجود ندارد، تغییر هر عدد نیازمند {num(c.quorum)} رأی از {num(units.length)} است.
        </p>
        <div className="rules">
          {Object.keys(FORMULA).map((k) => {
            const pending = open.find((v) => k in v.payload.settings)
            return (
              <div className="rule" key={k}>
                <div>
                  <span className="muted small">{FORMULA[k]}</span>
                  <strong>{num(settings[k])}</strong>
                </div>
                {pending ? <Badge tone="amber">در حال رأی‌گیری</Badge>
                  : <Button variant="soft" onClick={() => setForm({ key: k, value: settings[k] })}>پیشنهاد تغییر</Button>}
              </div>
            )
          })}
        </div>

        <h4 className="mt">پیش‌نمایش شارژ ماهانه {num(units.length)} واحد</h4>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>واحد</th><th>متراژ</th><th>نفرات</th><th>پارکینگ</th><th>شارژ محاسبه‌شده</th></tr></thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id}>
                  <td>واحد {u.no}{u.vacant ? ' (خالی)' : ''}</td>
                  <td>{num(u.area)} م²</td>
                  <td>{num(u.people)}</td>
                  <td>{num(u.parking)}</td>
                  <td><strong>{money(chargeFor(u, settings))}</strong></td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan="4">جمع شارژ ماهانه ساختمان</td>
                <td><strong>{money(units.reduce((a, u) => a + chargeFor(u, settings), 0))}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="اطلاعات ساختمان">
        <div className="form-grid">
          <Field label="نام ساختمان"><input className="input" value={settings.buildingName} onChange={(e) => set.settings({ ...settings, buildingName: e.target.value })} /></Field>
          <Field label="آدرس"><input className="input" value={settings.address} onChange={(e) => set.settings({ ...settings, address: e.target.value })} /></Field>
          <Field label="مانده اولیه صندوق (تومان)"><input className="input" type="number" value={settings.openingBalance} onChange={(e) => set.settings({ ...settings, openingBalance: Number(e.target.value || 0) })} /></Field>
        </div>
      </Card>

      <Card title="پشتیبان‌گیری">
        <p className="muted">
          داده‌ها فعلاً در مرورگر همین دستگاه ذخیره می‌شوند. در نسخهٔ سرور، همهٔ ۸ واحد به یک پایگاه داده مشترک وصل می‌شوند و
          ربات بله یادآوری‌ها و رأی‌گیری‌ها را انجام می‌دهد.
        </p>
        <div className="row">
          <Button variant="primary" onClick={exportJSON}>دریافت فایل پشتیبان</Button>
          <label className="btn ghost file">بازیابی از فایل<input type="file" accept="application/json" onChange={importJSON} hidden /></label>
          <Button variant="danger" onClick={resetAll}>بازگرداندن به داده‌های نمونه</Button>
        </div>
      </Card>

      <Modal open={!!form} onClose={() => setForm(null)} title="پیشنهاد تغییر فرمول شارژ">
        {form && (
          <form className="form-grid" onSubmit={submit}>
            <Field label="بند" hint={`مقدار فعلی: ${num(settings[form.key])}`}>
              <select className="input" value={form.key} onChange={(e) => setForm({ key: e.target.value, value: settings[e.target.value] })}>
                {Object.keys(FORMULA).map((k) => <option key={k} value={k}>{FORMULA[k]}</option>)}
              </select>
            </Field>
            <Field label="مقدار جدید"><input className="input" type="number" required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field>
            <div className="form-actions">
              <Button type="button" onClick={() => setForm(null)}>انصراف</Button>
              <Button type="submit" variant="primary">شروع رأی‌گیری</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
