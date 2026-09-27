import { useState } from 'react'
import { Button, Field } from '../components/ui'
import { uid, todayISO, faDateStr } from '../lib/utils'
import { RESPONSIBILITY_EXAMPLES, RESPONSIBILITY_STATUSES } from '../lib/responsibilities'

export default function Onboarding({ units, onCreate, onRestore }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', unitId: units[0]?.id ?? '',
  })
  const [hasResponsibility, setHasResponsibility] = useState(false)
  const [responsibility, setResponsibility] = useState({
    title: '', description: '', startDate: todayISO(), dueDate: '', status: 'فعال',
  })

  const submit = (event) => {
    event.preventDefault()
    const profile = {
      id: uid(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      unitId: form.unitId,
      createdAt: new Date().toISOString(),
    }
    const item = hasResponsibility
      ? {
          ...responsibility,
          id: uid(),
          profileId: profile.id,
          unitId: form.unitId,
          assigneeName: `${profile.firstName} ${profile.lastName}`,
          createdAt: new Date().toISOString(),
        }
      : null
    onCreate(profile, item)
  }

  const restore = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        onRestore(JSON.parse(String(reader.result)))
      } catch {
        alert('فایل پشتیبان معتبر نیست.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <main className="onboarding-shell">
      <section className="onboarding-panel">
        <div className="onboarding-intro">
          <span className="onboarding-logo" aria-hidden="true">🏢</span>
          <p className="eyebrow">خوش آمدید</p>
          <h1>حساب ساکن خود را بسازید</h1>
          <p>
            برای اتصال امن این دستگاه به واحد شما، فقط مشخصات فردی و شماره واحد لازم است.
            پس از ثبت، هویت واحد از سربرگ قابل تغییر نخواهد بود.
          </p>
          <ul className="onboarding-points">
            <li>اطلاعات روی همین دستگاه ذخیره می‌شود.</li>
            <li>همه کاربران ساکن هستند و سطح دسترسی جداگانه‌ای ندارند.</li>
            <li>می‌توانید اطلاعات را بعداً از «حساب من» ویرایش کنید.</li>
          </ul>
          <label className="btn soft file restore-file">
            بازیابی فایل پشتیبان JSON
            <input type="file" accept="application/json" onChange={restore} hidden />
          </label>
        </div>

        <form className="onboarding-form" onSubmit={submit}>
          <div className="onboarding-section">
            <div className="section-title">
              <span>۱</span>
              <div><h2>مشخصات شما</h2><p>این اطلاعات در حساب شخصی شما نمایش داده می‌شود.</p></div>
            </div>
            <div className="form-grid">
              <Field label="نام"><input className="input" autoComplete="given-name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
              <Field label="نام خانوادگی"><input className="input" autoComplete="family-name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
              <Field label="شماره تلفن" hint="برای نمونه: ۰۹۱۲۱۲۳۴۵۶۷">
                <input className="input ltr-input" type="tel" inputMode="tel" autoComplete="tel" minLength="10" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="واحد محل سکونت">
                <select className="input" required value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>واحد {unit.no} · طبقه {unit.floor} · مالک: {unit.owner}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="onboarding-section responsibility-optional">
            <div className="section-title">
              <span>۲</span>
              <div><h2>مسئولیت در ساختمان <small>اختیاری</small></h2><p>اگر اکنون کاری به شما سپرده شده، جزئیات آن را ثبت کنید.</p></div>
            </div>
            <label className="toggle-row">
              <input type="checkbox" checked={hasResponsibility} onChange={(e) => setHasResponsibility(e.target.checked)} />
              <span>در حال حاضر مسئولیتی در ساختمان دارم</span>
            </label>
            {hasResponsibility && (
              <div className="form-grid responsibility-fields">
                <Field label="عنوان مسئولیت">
                  <input className="input" list="responsibility-examples" required value={responsibility.title} onChange={(e) => setResponsibility({ ...responsibility, title: e.target.value })} />
                  <datalist id="responsibility-examples">
                    {RESPONSIBILITY_EXAMPLES.map((item) => <option key={item} value={item} />)}
                  </datalist>
                </Field>
                <Field label="وضعیت">
                  <select className="input" value={responsibility.status} onChange={(e) => setResponsibility({ ...responsibility, status: e.target.value })}>
                    {RESPONSIBILITY_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </Field>
                <Field label="توضیحات مسئولیت"><textarea className="input" rows="3" value={responsibility.description} onChange={(e) => setResponsibility({ ...responsibility, description: e.target.value })} /></Field>
                <Field label="تاریخ شروع" hint={faDateStr(responsibility.startDate)}><input className="input" type="date" required value={responsibility.startDate} onChange={(e) => setResponsibility({ ...responsibility, startDate: e.target.value })} /></Field>
                <Field label="تاریخ پایان یا سررسید" hint={responsibility.dueDate ? faDateStr(responsibility.dueDate) : 'بدون سررسید'}><input className="input" type="date" value={responsibility.dueDate} onChange={(e) => setResponsibility({ ...responsibility, dueDate: e.target.value })} /></Field>
              </div>
            )}
          </div>

          <Button className="onboarding-submit" type="submit" variant="primary" disabled={!units.length}>ثبت و ورود به ساختمان</Button>
          {!units.length && <p className="bad-text small">واحدی برای انتخاب وجود ندارد؛ ابتدا یک فایل پشتیبان معتبر بازیابی کنید.</p>}
        </form>
      </section>
    </main>
  )
}
