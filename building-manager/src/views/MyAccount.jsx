import { useMemo, useState } from 'react'
import { Badge, Button, Card, Empty, Field, Modal, Stat } from '../components/ui'
import { faDateStr, money, num, periodLabel, todayISO, uid } from '../lib/utils'
import { invoiceState, unitLedger } from '../lib/rules'
import {
  RESPONSIBILITY_EXAMPLES,
  RESPONSIBILITY_STATUSES,
  belongsToProfile,
  responsibilityTiming,
  responsibilityTone,
} from '../lib/responsibilities'

const blankResponsibility = {
  title: '', description: '', startDate: todayISO(), dueDate: '', status: 'فعال',
}

const fullName = (profile) =>
  profile?.fullName || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')

export default function MyAccount({ db, set, me, addLog }) {
  const { profile, responsibilities, invoices, payments, constitution, tickets, votes, expenses, announcements, log } = db
  const [profileForm, setProfileForm] = useState(null)
  const [responsibilityForm, setResponsibilityForm] = useState(null)

  const mine = responsibilities
    .filter((item) => belongsToProfile(item, profile, me))
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
  const active = mine.filter((item) => item.status === 'فعال')
  const previous = mine.filter((item) => item.status !== 'فعال')
  const reminders = active.filter((item) => responsibilityTiming(item).level !== 'normal')
  const ledger = unitLedger(me.id, invoices, payments, constitution)

  const chargeRows = invoices
    .filter((invoice) => invoice.unitId === me.id)
    .map((invoice) => {
      const state = invoiceState(invoice, payments, constitution)
      const relatedPayments = payments
        .filter((payment) => payment.invoiceId === invoice.id || (payment.unitId === me.id && payment.period === invoice.period))
        .sort((a, b) => (a.date < b.date ? 1 : -1))
      return { invoice, state, paymentDate: relatedPayments[0]?.date }
    })
    .sort((a, b) => b.invoice.period.localeCompare(a.invoice.period))

  const myTickets = tickets
    .filter((ticket) => ticket.createdByUnitId ? ticket.createdByUnitId === me.id : ticket.unitId === me.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

  const activities = useMemo(() => {
    const unitActor = `واحد ${me.no}`
    return [
      ...log
        .filter((item) => item.actorUnitId === me.id || (!item.actorUnitId && item.actor === unitActor))
        .map((item) => ({ id: `log-${item.id}`, date: item.at, icon: '📝', title: item.text, detail: 'دفتر رویدادها' })),
      ...votes
        .filter((item) => item.proposedBy === me.id)
        .map((item) => ({ id: `vote-${item.id}`, date: item.createdAt, icon: '🗳️', title: `طرح رأی‌گیری «${item.title}»`, detail: item.status })),
      ...expenses
        .filter((item) => item.paidBy === me.id)
        .map((item) => ({ id: `expense-${item.id}`, date: item.date, icon: '🧾', title: `ثبت هزینه «${item.title}»`, detail: money(item.amount) })),
      ...announcements
        .filter((item) => item.createdByUnitId === me.id)
        .map((item) => ({ id: `announcement-${item.id}`, date: item.date, icon: '📢', title: `انتشار «${item.title}»`, detail: item.category })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 20)
  }, [announcements, expenses, log, me.id, me.no, votes])

  const openProfile = () => setProfileForm({
    firstName: profile.firstName || fullName(profile).split(' ')[0] || '',
    lastName: profile.lastName || fullName(profile).split(' ').slice(1).join(' '),
    phone: profile.phone || '',
  })

  const saveProfile = (event) => {
    event.preventDefault()
    const oldName = fullName(profile)
    const nextProfile = {
      ...profile,
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      phone: profileForm.phone.trim(),
      updatedAt: new Date().toISOString(),
    }
    const nextName = fullName(nextProfile)
    set.profile(nextProfile)
    set.units(db.units.map((unit) => unit.id === me.id
      ? { ...unit, resident: nextName, phone: nextProfile.phone, vacant: false, occupancyStatus: unit.occupancyStatus === 'خالی' ? 'مستأجر' : unit.occupancyStatus }
      : unit))
    set.responsibilities(responsibilities.map((item) =>
      (item.profileId === profile.id || (item.unitId === me.id && item.assigneeName === oldName))
        ? { ...item, assigneeName: nextName }
        : item,
    ))
    addLog('مشخصات حساب شخصی به‌روز شد.', `واحد ${me.no}`, me.id)
    setProfileForm(null)
  }

  const saveResponsibility = (event) => {
    event.preventDefault()
    const data = {
      ...responsibilityForm,
      profileId: profile.id,
      unitId: me.id,
      assigneeName: fullName(profile),
      updatedAt: new Date().toISOString(),
    }
    if (data.id) {
      set.responsibilities(responsibilities.map((item) => item.id === data.id ? data : item))
      addLog(`مسئولیت «${data.title}» ویرایش شد.`, `واحد ${me.no}`, me.id)
    } else {
      set.responsibilities([{ ...data, id: uid(), createdAt: new Date().toISOString() }, ...responsibilities])
      addLog(`مسئولیت «${data.title}» ثبت شد.`, `واحد ${me.no}`, me.id)
    }
    setResponsibilityForm(null)
  }

  const markDone = (item) => {
    set.responsibilities(responsibilities.map((row) => row.id === item.id
      ? { ...row, status: 'انجام‌شده', updatedAt: new Date().toISOString() }
      : row))
    addLog(`مسئولیت «${item.title}» انجام شد.`, `واحد ${me.no}`, me.id)
  }

  return (
    <div className="stack account-page">
      {reminders.map((item) => {
        const timing = responsibilityTiming(item)
        return (
          <button className={`responsibility-alert ${timing.level}`} key={item.id} onClick={() => setResponsibilityForm({ ...item })}>
            <span className="alert-icon">{timing.level === 'overdue' ? '🚨' : '⏰'}</span>
            <span><strong>{item.title}</strong><small>{timing.label} · سررسید {faDateStr(item.dueDate)}</small></span>
            <span className="alert-action">مشاهده و ویرایش</span>
          </button>
        )
      })}

      <Card
        title="مشخصات من و واحد"
        extra={<Button variant="soft" onClick={openProfile}>ویرایش نام و تلفن</Button>}
        className="profile-card"
      >
        <div className="profile-summary">
          <div className="avatar" aria-hidden="true">{profile.firstName?.slice(0, 1) || 'س'}</div>
          <div className="profile-primary">
            <h2>{fullName(profile)}</h2>
            <p className="muted">ساکن واحد {me.no} · طبقه {num(me.floor)}</p>
            <a className="phone-link ltr-num" href={`tel:${profile.phone}`}>{profile.phone}</a>
          </div>
          <dl className="profile-details">
            <div><dt>مالک واحد</dt><dd>{me.owner || '—'}</dd></div>
            <div><dt>وضعیت سکونت</dt><dd><Badge tone={me.vacant ? 'gray' : 'green'}>{me.occupancyStatus || (me.vacant ? 'خالی' : 'مسکونی')}</Badge></dd></div>
            <div><dt>متراژ</dt><dd>{num(me.area)} متر مربع</dd></div>
            <div><dt>تعداد ساکن</dt><dd>{num(me.people)} نفر</dd></div>
          </dl>
        </div>
        <p className="identity-note">🔒 این حساب به واحد {me.no} متصل است و هویت واحد از سربرگ قابل تعویض نیست.</p>
      </Card>

      <div className="stats account-stats">
        <Stat label="مسئولیت فعال" value={num(active.length)} hint={reminders.length ? `${num(reminders.length)} مورد نزدیک یا گذشته از سررسید` : 'بدون یادآوری فوری'} tone={reminders.length ? 'warn' : 'good'} />
        <Stat label="مانده شارژ" value={ledger.total ? money(ledger.total) : 'تسویه'} hint={ledger.fees ? `شامل ${money(ledger.fees)} جریمه` : 'جمع همه ماه‌ها'} tone={ledger.total ? 'bad' : 'good'} />
        <Stat label="درخواست‌های من" value={num(myTickets.length)} hint={`${num(myTickets.filter((item) => item.status !== 'انجام‌شده').length)} درخواست باز`} />
      </div>

      <Card
        title="مسئولیت‌های من"
        extra={<Button variant="primary" onClick={() => setResponsibilityForm({ ...blankResponsibility })}>+ ثبت مسئولیت</Button>}
      >
        <h4 className="account-subtitle">فعال</h4>
        {active.length === 0 ? <Empty text="مسئولیت فعالی برای شما ثبت نشده است." /> : (
          <div className="responsibility-grid">
            {active.map((item) => <ResponsibilityItem key={item.id} item={item} onEdit={() => setResponsibilityForm({ ...item })} onDone={() => markDone(item)} />)}
          </div>
        )}
        <h4 className="account-subtitle with-line">قبلی</h4>
        {previous.length === 0 ? <Empty text="سابقه‌ای وجود ندارد." /> : (
          <div className="responsibility-grid compact">
            {previous.map((item) => <ResponsibilityItem key={item.id} item={item} onEdit={() => setResponsibilityForm({ ...item })} />)}
          </div>
        )}
      </Card>

      <Card title="گزارش شارژ و پرداخت ماهانه">
        {chargeRows.length === 0 ? <Empty text="هنوز صورتحسابی برای واحد شما صادر نشده است." /> : (
          <div className="table-wrap">
            <table className="table account-table">
              <thead><tr><th>ماه</th><th>مبلغ صورتحساب</th><th>پرداخت‌شده</th><th>مانده</th><th>تاریخ پرداخت</th><th>وضعیت</th></tr></thead>
              <tbody>
                {chargeRows.map(({ invoice, state, paymentDate }) => (
                  <tr key={invoice.id}>
                    <td><strong>{periodLabel(invoice.period)}</strong></td>
                    <td>{money(invoice.amount)}</td>
                    <td className="good-text">{money(state.paid)}</td>
                    <td className={state.total ? 'bad-text' : 'good-text'}>
                      {money(state.total)}
                      {state.lateFee > 0 && <small className="table-note">شامل {money(state.lateFee)} جریمه</small>}
                    </td>
                    <td>{paymentDate ? faDateStr(paymentDate) : '—'}</td>
                    <td><Badge tone={state.settled ? 'green' : state.overdueDays ? 'red' : 'amber'}>{state.state}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid-2 account-activity-grid">
        <Card title="درخواست‌های ثبت‌شده توسط من">
          {myTickets.length === 0 ? <Empty text="درخواستی ثبت نکرده‌اید." /> : (
            <ul className="activity-list">
              {myTickets.map((ticket) => (
                <li key={ticket.id}>
                  <span className="activity-icon">🛠️</span>
                  <div><strong>{ticket.title}</strong><p>{ticket.desc || 'بدون توضیح'}</p><small>{faDateStr(ticket.createdAt)} · {ticket.status}</small></div>
                  <Badge tone={ticket.status === 'انجام‌شده' ? 'green' : ticket.priority === 'زیاد' ? 'red' : 'amber'}>{ticket.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="فعالیت‌های ثبت‌شده توسط من">
          {activities.length === 0 ? <Empty text="هنوز فعالیتی با حساب شما ثبت نشده است." /> : (
            <ul className="activity-list">
              {activities.map((item) => (
                <li key={item.id}>
                  <span className="activity-icon">{item.icon}</span>
                  <div><strong>{item.title}</strong><small>{faDateStr(item.date)} · {item.detail}</small></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={!!profileForm} onClose={() => setProfileForm(null)} title="ویرایش مشخصات حساب">
        {profileForm && (
          <form className="form-grid" onSubmit={saveProfile}>
            <Field label="نام"><input className="input" autoComplete="given-name" required value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} /></Field>
            <Field label="نام خانوادگی"><input className="input" autoComplete="family-name" required value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} /></Field>
            <Field label="شماره تلفن"><input className="input ltr-input" type="tel" inputMode="tel" minLength="10" required value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></Field>
            <Field label="واحد متصل"><input className="input" value={`واحد ${me.no} · طبقه ${me.floor}`} disabled /></Field>
            <div className="form-actions">
              <Button type="button" onClick={() => setProfileForm(null)}>انصراف</Button>
              <Button type="submit" variant="primary">ذخیره تغییرات</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!responsibilityForm} onClose={() => setResponsibilityForm(null)} title={responsibilityForm?.id ? 'ویرایش مسئولیت' : 'ثبت مسئولیت جدید'}>
        {responsibilityForm && (
          <form className="form-grid" onSubmit={saveResponsibility}>
            <Field label="عنوان مسئولیت">
              <input className="input" list="account-responsibility-examples" required value={responsibilityForm.title} onChange={(e) => setResponsibilityForm({ ...responsibilityForm, title: e.target.value })} />
              <datalist id="account-responsibility-examples">{RESPONSIBILITY_EXAMPLES.map((item) => <option key={item} value={item} />)}</datalist>
            </Field>
            <Field label="وضعیت">
              <select className="input" value={responsibilityForm.status} onChange={(e) => setResponsibilityForm({ ...responsibilityForm, status: e.target.value })}>
                {RESPONSIBILITY_STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
            </Field>
            <Field label="توضیحات مسئولیت"><textarea className="input" rows="4" value={responsibilityForm.description} onChange={(e) => setResponsibilityForm({ ...responsibilityForm, description: e.target.value })} /></Field>
            <Field label="تاریخ شروع" hint={faDateStr(responsibilityForm.startDate)}><input className="input" type="date" required value={responsibilityForm.startDate} onChange={(e) => setResponsibilityForm({ ...responsibilityForm, startDate: e.target.value })} /></Field>
            <Field label="تاریخ پایان یا سررسید" hint={responsibilityForm.dueDate ? faDateStr(responsibilityForm.dueDate) : 'بدون سررسید'}><input className="input" type="date" value={responsibilityForm.dueDate} onChange={(e) => setResponsibilityForm({ ...responsibilityForm, dueDate: e.target.value })} /></Field>
            <div className="form-actions">
              <Button type="button" onClick={() => setResponsibilityForm(null)}>انصراف</Button>
              <Button type="submit" variant="primary">ذخیره مسئولیت</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

function ResponsibilityItem({ item, onEdit, onDone }) {
  const timing = responsibilityTiming(item)
  return (
    <article className={`responsibility-card ${timing.level}`}>
      <header>
        <Badge tone={responsibilityTone(item)}>{item.status}</Badge>
        {timing.label && <span className={`deadline ${timing.level}`}>{timing.label}</span>}
      </header>
      <h3>{item.title}</h3>
      <span className="responsibility-assignee">مسئول: {item.assigneeName || 'ساکن این واحد'}</span>
      <p>{item.description || 'توضیحی ثبت نشده است.'}</p>
      <dl>
        <div><dt>شروع</dt><dd>{faDateStr(item.startDate)}</dd></div>
        <div><dt>پایان یا سررسید</dt><dd>{faDateStr(item.dueDate)}</dd></div>
      </dl>
      <footer>
        <Button variant="soft" onClick={onEdit}>ویرایش</Button>
        {onDone && <Button onClick={onDone}>✓ انجام شد</Button>}
      </footer>
    </article>
  )
}
