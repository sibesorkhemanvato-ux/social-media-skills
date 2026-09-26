import { Card, Button, Field } from '../components/ui'
import { money, num } from '../lib/utils'
import { chargeFor } from '../lib/calc'

export default function Settings({ db, set, resetAll }) {
  const { settings, units } = db
  const up = (patch) => set.settings({ ...settings, ...patch })
  const n = (v) => (v === '' ? 0 : Number(v))

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
        for (const k of ['units', 'invoices', 'payments', 'expenses', 'announcements', 'tickets', 'settings']) {
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

  return (
    <div className="stack">
      <Card title="مشخصات ساختمان">
        <div className="form-grid two">
          <Field label="نام ساختمان"><input className="input" value={settings.buildingName} onChange={(e) => up({ buildingName: e.target.value })} /></Field>
          <Field label="نام مدیر"><input className="input" value={settings.manager} onChange={(e) => up({ manager: e.target.value })} /></Field>
          <Field label="آدرس"><input className="input" value={settings.address} onChange={(e) => up({ address: e.target.value })} /></Field>
          <Field label="مهلت پرداخت شارژ (روز ماه)"><input className="input" type="number" value={settings.dueDay} onChange={(e) => up({ dueDay: n(e.target.value) })} /></Field>
          <Field label="مانده اولیه صندوق (تومان)"><input className="input" type="number" value={settings.openingBalance} onChange={(e) => up({ openingBalance: n(e.target.value) })} /></Field>
        </div>
      </Card>

      <Card title="فرمول محاسبه شارژ">
        <p className="muted">
          شارژ هر واحد = مبلغ ثابت + (نرخ هر نفر × تعداد نفرات) + (نرخ هر متر × متراژ) + (نرخ پارکینگ × تعداد پارکینگ)
        </p>
        <div className="form-grid two">
          <Field label="مبلغ ثابت هر واحد (تومان)"><input className="input" type="number" value={settings.fixed} onChange={(e) => up({ fixed: n(e.target.value) })} /></Field>
          <Field label="نرخ هر نفر (تومان)"><input className="input" type="number" value={settings.perPerson} onChange={(e) => up({ perPerson: n(e.target.value) })} /></Field>
          <Field label="نرخ هر متر مربع (تومان)"><input className="input" type="number" value={settings.perArea} onChange={(e) => up({ perArea: n(e.target.value) })} /></Field>
          <Field label="نرخ هر پارکینگ (تومان)"><input className="input" type="number" value={settings.perParking} onChange={(e) => up({ perParking: n(e.target.value) })} /></Field>
          <Field label="درصد شارژ واحد خالی" hint="طبق قانون تملک آپارتمان‌ها، واحد خالی از پرداخت هزینه‌های مصرفی معاف است."><input className="input" type="number" value={settings.vacantRatio} onChange={(e) => up({ vacantRatio: n(e.target.value) })} /></Field>
        </div>

        <h4 className="mt">پیش‌نمایش شارژ ماهانه</h4>
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
      </Card>

      <Card title="پشتیبان‌گیری و بازنشانی">
        <p className="muted">اطلاعات این برنامه فقط در مرورگر شما ذخیره می‌شود. برای انتقال یا نگهداری، فایل پشتیبان بگیرید.</p>
        <div className="row">
          <Button variant="primary" onClick={exportJSON}>دریافت فایل پشتیبان</Button>
          <label className="btn ghost file">
            بازیابی از فایل
            <input type="file" accept="application/json" onChange={importJSON} hidden />
          </label>
          <Button variant="danger" onClick={resetAll}>بازگرداندن به داده‌های نمونه</Button>
        </div>
      </Card>
    </div>
  )
}
