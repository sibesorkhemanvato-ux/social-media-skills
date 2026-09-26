import { useState } from 'react'
import { Card, Button, Modal, Field, Badge, Empty } from '../components/ui'
import { RULE_LABELS } from '../lib/rules'
import { num } from '../lib/utils'

export default function Rules({ db, proposeVote, me, go }) {
  const { constitution: c, votes, units } = db
  const [form, setForm] = useState(null)

  const openVotes = votes.filter((v) => v.type === 'rule' && v.status === 'باز')

  const submit = (e) => {
    e.preventDefault()
    const value = Number(form.value)
    if (value === Number(c[form.key])) return alert('مقدار جدید با مقدار فعلی یکسان است.')
    proposeVote({
      type: 'rule',
      title: `تغییر قانون: ${RULE_LABELS[form.key]}`,
      desc: `از ${num(c[form.key])} به ${num(value)} — دلیل: ${form.reason || 'ذکر نشده'}`,
      payload: { changes: { [form.key]: value } },
    })
    setForm(null)
    go('votes')
  }

  return (
    <div className="stack">
      <Card title="قانون‌نامهٔ ساختمان — نسخه ۱">
        <p className="muted">
          این ساختمان <strong>مدیر انسانی ندارد</strong>. همهٔ {num(units.length)} واحد برابرند و اپ فقط مجری این قوانین است.
          هیچ‌کس نمی‌تواند این اعداد را مستقیم تغییر دهد؛ هر تغییر باید با رأی <strong>{num(c.quorum)} از {num(units.length)}</strong> تصویب شود.
        </p>
        <div className="rules">
          {Object.keys(RULE_LABELS).map((k) => {
            const pending = openVotes.find((v) => k in (v.payload?.changes || {}))
            return (
              <div className="rule" key={k}>
                <div>
                  <span className="muted small">{RULE_LABELS[k]}</span>
                  <strong>{num(c[k])}</strong>
                </div>
                {pending ? (
                  <Badge tone="amber">در حال رأی‌گیری</Badge>
                ) : (
                  <Button variant="soft" onClick={() => setForm({ key: k, value: c[k], reason: '' })}>پیشنهاد تغییر</Button>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid-2">
        <Card title="قواعدی که خودکار اجرا می‌شوند">
          <ul className="rule-list">
            <li>📅 اول هر ماه شارژ همهٔ واحدها صادر و در بله ارسال می‌شود.</li>
            <li>⏰ مهلت پرداخت {num(c.dueDays)} روز است؛ یادآوری خودکار هر {num(c.warningEveryHours)} ساعت پس از مهلت.</li>
            <li>📣 پس از {num(c.publicAfterDays)} روز تأخیر و {num(c.publicAfterWarnings)} هشدار، بدهی برای همهٔ ساکنین <strong>عمومی</strong> می‌شود.</li>
            <li>➕ جریمهٔ دیرکرد {num(c.lateFeeDailyPercent)}٪ روزانه، از روز {num(c.lateGraceDays)} پس از پایان مهلت، روی مانده محاسبه می‌شود.</li>
            <li>💸 هزینهٔ تا {num(c.autoExpenseCap)} تومان با فاکتور، بدون رأی ثبت می‌شود؛ بالاتر از آن رأی‌گیری {num(c.voteHours)} ساعته.</li>
            <li>🚨 هزینهٔ اضطراری (آب، برق، آسانسور، گاز) تا {num(c.emergencyCap)} تومان بدون رأی، ولی با اعلان فوری به همه.</li>
            <li>🔁 نوبت‌های اجرایی ماهانه به‌صورت چرخشی و خودکار بین واحدها تقسیم می‌شود.</li>
            <li>🧾 هر تغییر مالی در دفتر رویدادها ثبت می‌شود و قابل حذف نیست.</li>
          </ul>
        </Card>

        <Card title="چرا مدیر انسانی نداریم؟">
          <p className="muted">
            پیگیری بدهی، تصمیم دربارهٔ هزینه و تقسیم کارها منبع اصلی تنش بین همسایه‌هاست.
            در این مدل، یادآوری را ربات می‌فرستد، تصمیم را رأی می‌گیرد و نوبت را تقویم تعیین می‌کند.
            هیچ‌کس مجبور نیست نقش «آدم بد» را بازی کند.
          </p>
          <p className="muted">هویت فعلی شما در این دستگاه: <strong>واحد {me?.no ?? '—'} — {me?.resident || me?.owner || ''}</strong></p>
        </Card>
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title="پیشنهاد تغییر قانون">
        {form && (
          <form className="form-grid" onSubmit={submit}>
            <Field label="بند قانون">
              <select className="input" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value, value: c[e.target.value] })}>
                {Object.keys(RULE_LABELS).map((k) => <option key={k} value={k}>{RULE_LABELS[k]}</option>)}
              </select>
            </Field>
            <Field label="مقدار جدید" hint={`مقدار فعلی: ${num(c[form.key])}`}>
              <input className="input" type="number" step="any" required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </Field>
            <Field label="دلیل پیشنهاد"><textarea className="input" rows="2" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
            <p className="muted small" style={{ gridColumn: '1 / -1' }}>
              با ثبت این پیشنهاد، رأی‌گیری {num(c.voteHours)} ساعته آغاز می‌شود و با {num(c.quorum)} رأی موافق، قانون‌نامه خودکار به‌روز می‌شود.
            </p>
            <div className="form-actions">
              <Button type="button" onClick={() => setForm(null)}>انصراف</Button>
              <Button type="submit" variant="primary">شروع رأی‌گیری</Button>
            </div>
          </form>
        )}
        {!form && <Empty text="—" />}
      </Modal>
    </div>
  )
}
