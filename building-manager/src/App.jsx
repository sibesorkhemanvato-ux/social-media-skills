import { useState, useEffect, useCallback } from 'react'
import './styles.css'
import { useLocalState, periodKey, periodLabel, num, uid } from './lib/utils'
import {
  seedUnits, seedSettings, seedExpenses, seedAnnouncements, seedTickets,
  seedInvoices, seedPayments, seedVotes, seedElevatorServices, seedResponsibilities,
} from './lib/seed'
import { CONSTITUTION, unitLedger, tally } from './lib/rules'
import { belongsToProfile, responsibilityTiming } from './lib/responsibilities'

import Dashboard from './views/Dashboard'
import Units from './views/Units'
import Charges from './views/Charges'
import Expenses from './views/Expenses'
import Announcements from './views/Announcements'
import Tickets from './views/Tickets'
import Reports from './views/Reports'
import Rules from './views/Rules'
import Votes from './views/Votes'
import Duties from './views/Duties'
import Settings from './views/Settings'
import Elevator from './views/Elevator'
import About from './views/About'
import MyAccount from './views/MyAccount'
import Onboarding from './views/Onboarding'

const NAV = [
  { key: 'dashboard', label: 'داشبورد ساختمان', icon: '🏠' },
  { key: 'account', label: 'حساب من', icon: '👤' },
  { key: 'charges', label: 'شارژ و پرداخت‌ها', icon: '💳' },
  { key: 'expenses', label: 'هزینه‌ها و صندوق', icon: '🧾' },
  { key: 'votes', label: 'رأی‌گیری‌ها', icon: '🗳️' },
  { key: 'rules', label: 'قانون‌نامه', icon: '⚖️' },
  { key: 'duties', label: 'نوبت‌ها', icon: '🔁' },
  { key: 'tickets', label: 'درخواست تعمیرات', icon: '🛠️' },
  { key: 'elevator', label: 'نگهداری آسانسور', icon: '🛗' },
  { key: 'announcements', label: 'تابلوی اعلانات', icon: '📢' },
  { key: 'units', label: 'واحدها و ساکنین', icon: '🚪' },
  { key: 'reports', label: 'گزارش‌ها', icon: '📊' },
  { key: 'settings', label: 'پشتیبان و اطلاعات', icon: '⚙️' },
  { key: 'about', label: 'درباره و راهنما', icon: 'ℹ️' },
]

const baseInvoices = seedInvoices(seedUnits, seedSettings)

export default function App() {
  const [units, setUnits] = useLocalState('bm3.units', seedUnits)
  const [settings, setSettings] = useLocalState('bm3.settings', seedSettings)
  const [constitution, setConstitution] = useLocalState('bm3.constitution', CONSTITUTION)
  const [invoices, setInvoices] = useLocalState('bm3.invoices', baseInvoices)
  const [payments, setPayments] = useLocalState('bm3.payments', seedPayments(baseInvoices))
  const [expenses, setExpenses] = useLocalState('bm3.expenses', seedExpenses)
  const [announcements, setAnnouncements] = useLocalState('bm3.announcements', seedAnnouncements)
  const [tickets, setTickets] = useLocalState('bm3.tickets', seedTickets)
  const [votes, setVotes] = useLocalState('bm3.votes', seedVotes(seedUnits))
  const [log, setLog] = useLocalState('bm3.log', [])
  const [elevatorServices, setElevatorServices] = useLocalState('bm3.elevatorServices', seedElevatorServices)
  const [responsibilities, setResponsibilities] = useLocalState('bm3.responsibilities', seedResponsibilities)
  const [profile, setProfile] = useLocalState('bm3.profile', null)

  const [tab, setTab] = useState('dashboard')
  const [period, setPeriod] = useState(periodKey())
  const [menuOpen, setMenuOpen] = useState(false)
  const [installer, setInstaller] = useState(null)

  // مهاجرت بی‌خطر تنظیمات نسخه‌های قبلی به فرمول تقسیم مساوی
  useEffect(() => {
    if (settings.cleaning !== undefined) return
    setSettings((old) => ({
      ...old,
      cleaning: seedSettings.cleaning,
      water: seedSettings.water,
      elevator: seedSettings.elevator,
      commonElectricity: seedSettings.commonElectricity,
      miscellaneous: seedSettings.miscellaneous,
      elevatorIntervalDays: seedSettings.elevatorIntervalDays,
    }))
  }, [settings.cleaning, setSettings])

  // تکمیل بی‌خطر داده واحدهای ذخیره‌شده در نسخه‌های قبلی
  useEffect(() => {
    if (units.every((unit) => unit.occupancyStatus)) return
    setUnits((old) => old.map((unit) => ({
      ...unit,
      occupancyStatus: unit.occupancyStatus || (unit.vacant ? 'خالی' : unit.resident === unit.owner ? 'مالک ساکن' : 'مستأجر'),
    })))
  }, [units, setUnits])

  // هویت قدیمی قابل انتخاب دیگر استفاده نمی‌شود.
  useEffect(() => { localStorage.removeItem('bm3.me') }, [])

  // امکان نصب اپ روی گوشی (PWA)
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setInstaller(e) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  const me = profile ? units.find((unit) => unit.id === profile.unitId) : null

  const db = {
    units, settings, constitution, invoices, payments, expenses, announcements,
    tickets, votes, log, elevatorServices, responsibilities, profile,
  }
  const set = {
    units: setUnits, settings: setSettings, constitution: setConstitution, invoices: setInvoices,
    payments: setPayments, expenses: setExpenses, announcements: setAnnouncements,
    tickets: setTickets, votes: setVotes, log: setLog, elevatorServices: setElevatorServices,
    responsibilities: setResponsibilities, profile: setProfile,
  }

  const addLog = useCallback(
    (text, actor = 'سیستم', actorUnitId = null) => setLog((items) => [
      { id: uid(), at: new Date().toISOString(), actor, actorUnitId, text }, ...items,
    ].slice(0, 200)),
    [setLog],
  )

  /** ثبت یک موضوع برای رأی‌گیری — هیچ تصمیمی بدون رأی اجرا نمی‌شود */
  const proposeVote = useCallback(
    ({ type, title, desc, payload }) => {
      const v = {
        id: uid(), type, title, desc, payload,
        proposedBy: profile?.unitId,
        createdAt: new Date().toISOString(),
        deadline: new Date(Date.now() + constitution.voteHours * 3600000).toISOString(),
        ballots: {}, status: 'باز',
      }
      setVotes((prev) => [v, ...prev])
      addLog(`رأی‌گیری «${title}» توسط واحد ${me?.no} آغاز شد.`, `واحد ${me?.no}`)
      return v
    },
    [constitution.voteHours, profile?.unitId, me, setVotes, addLog],
  )

  /** موتور خودکار: نتیجه رأی‌ها را قطعی و اجرا می‌کند (بدون دخالت انسان) */
  useEffect(() => {
    const pending = votes.filter((v) => v.status === 'باز')
    if (pending.length === 0) return
    let changed = false
    const next = votes.map((v) => {
      if (v.status !== 'باز') return v
      const t = tally(v, units.length, constitution)
      if (t.status === 'باز') return v
      changed = true
      if (t.status === 'تصویب شد') {
        if (v.type === 'rule' && v.payload?.changes) {
          setConstitution((c) => ({ ...c, ...v.payload.changes }))
          addLog(`قانون‌نامه طبق رأی ${t.yes} از ${units.length} به‌روز شد: ${v.title}`)
        }
        if (v.payload?.settings) {
          setSettings((s) => ({ ...s, ...v.payload.settings }))
          addLog(`فرمول شارژ طبق رأی ساکنین تغییر کرد: ${v.title}`)
        }
        if (v.type === 'expense' && v.payload?.expense) {
          setExpenses((e) => [...e, { ...v.payload.expense, id: uid() }])
          addLog(`هزینه «${v.payload.expense.title}» پس از تصویب ساکنین از صندوق پرداخت شد.`)
        }
      } else {
        addLog(`پیشنهاد «${v.title}» با ${t.yes} رأی موافق به نصاب ${t.quorum} نرسید و رد شد.`)
      }
      return { ...v, status: t.status, applied: true }
    })
    if (changed) setVotes(next)
  }, [votes, units.length, constitution, setVotes, setConstitution, setExpenses, setSettings, addLog])

  const resetAll = () => {
    if (!confirm('همه اطلاعات و حساب این دستگاه پاک و داده‌های نمونه جایگزین می‌شود. مطمئن هستید؟')) return
    const inv = seedInvoices(seedUnits, seedSettings)
    setUnits(seedUnits); setSettings(seedSettings); setConstitution(CONSTITUTION)
    setInvoices(inv); setPayments(seedPayments(inv)); setExpenses(seedExpenses)
    setAnnouncements(seedAnnouncements); setTickets(seedTickets)
    setVotes(seedVotes(seedUnits)); setLog([]); setElevatorServices(seedElevatorServices)
    setResponsibilities(seedResponsibilities); setProfile(null)
  }

  const restoreBackup = (data) => {
    if (!data || typeof data !== 'object') throw new Error('invalid backup')
    const restoredUnits = Array.isArray(data.units) ? data.units : units
    if (!data.profile || !restoredUnits.some((unit) => unit.id === data.profile.unitId)) {
      alert('این پشتیبان حساب متصل به یک واحد ندارد. ابتدا ثبت اولیه را انجام دهید و سپس داده‌های قدیمی را از بخش پشتیبان بازیابی کنید.')
      return false
    }
    const stateSetters = {
      units: setUnits, settings: setSettings, constitution: setConstitution,
      invoices: setInvoices, payments: setPayments, expenses: setExpenses,
      announcements: setAnnouncements, tickets: setTickets, votes: setVotes,
      log: setLog, elevatorServices: setElevatorServices,
      responsibilities: setResponsibilities, profile: setProfile,
    }
    Object.entries(stateSetters).forEach(([key, setter]) => {
      if (data[key] !== undefined) setter(data[key])
    })
    alert('اطلاعات و حساب شما با موفقیت بازیابی شد.')
    return true
  }

  const createProfile = (newProfile, responsibility) => {
    const name = `${newProfile.firstName} ${newProfile.lastName}`.trim()
    setProfile(newProfile)
    setUnits((items) => items.map((unit) => unit.id === newProfile.unitId
      ? {
          ...unit,
          resident: name,
          phone: newProfile.phone,
          vacant: false,
          occupancyStatus: (unit.owner || '').trim() === name ? 'مالک ساکن' : 'مستأجر',
        }
      : unit))
    if (responsibility) setResponsibilities((items) => [responsibility, ...items])
    setLog((items) => [{
      id: uid(), at: new Date().toISOString(), actor: `واحد ${units.find((unit) => unit.id === newProfile.unitId)?.no ?? '—'}`,
      actorUnitId: newProfile.unitId, text: 'حساب ساکن روی این دستگاه ثبت شد.',
    }, ...items].slice(0, 200))
  }

  const go = (k) => { setTab(k); setMenuOpen(false) }

  const ledgers = units.map((u) => ({ u, l: unitLedger(u.id, invoices, payments, constitution) }))
  const debtors = ledgers.filter((x) => x.l.debt > 0)
  const publicDebtors = ledgers.filter((x) => x.l.isPublic)
  const openVotes = votes.filter((v) => v.status === 'باز')
  const openTickets = tickets.filter((t) => t.status !== 'انجام‌شده')
  const responsibilityReminders = me ? responsibilities.filter((item) => {
    const level = responsibilityTiming(item).level
    return belongsToProfile(item, profile, me) && item.status === 'فعال' && level !== 'normal'
  }) : []
  const badges = {
    account: responsibilityReminders.length || null,
    votes: openVotes.length || null,
    charges: debtors.length || null,
    tickets: openTickets.length || null,
  }

  const props = { db, set, period, setPeriod, go, me, proposeVote, addLog, ledgers, publicDebtors }
  const views = {
    dashboard: <Dashboard {...props} />,
    account: me ? <MyAccount {...props} /> : null,
    units: <Units {...props} />,
    charges: <Charges {...props} />,
    expenses: <Expenses {...props} />,
    announcements: <Announcements {...props} />,
    tickets: <Tickets {...props} />,
    reports: <Reports {...props} />,
    rules: <Rules {...props} />,
    votes: <Votes {...props} />,
    duties: <Duties {...props} />,
    settings: <Settings {...props} resetAll={resetAll} />,
    elevator: <Elevator {...props} />,
    about: <About {...props} />,
  }
  const current = NAV.find((n) => n.key === tab)

  if (!profile || !me) {
    return <Onboarding units={units} onCreate={createProfile} onRestore={restoreBackup} />
  }

  const profileName = profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' ')

  return (
    <div className="app">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="logo">🏢</span>
          <div>
            <strong>{settings.buildingName}</strong>
            <small>مدیریت خودگردان · بدون مدیر انسانی</small>
          </div>
        </div>
        <nav>
          {NAV.map((n) => (
            <button key={n.key} className={`nav-item ${tab === n.key ? 'active' : ''}`} onClick={() => go(n.key)}>
              <span className="icon">{n.icon}</span>
              <span>{n.label}</span>
              {badges[n.key] ? <span className="nav-badge">{num(badges[n.key])}</span> : null}
            </button>
          ))}
        </nav>
        <footer className="side-foot">
          <p>{settings.address}</p>
          <p className="muted">تصمیم‌گیری: {num(constitution.quorum)} رأی از {num(units.length)} واحد</p>
        </footer>
      </aside>

      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

      <main className="main">
        <header className="topbar">
          <button className="icon-btn menu" onClick={() => setMenuOpen((v) => !v)} aria-label="منو">☰</button>
          <div>
            <h2>{current?.label}</h2>
            <p className="muted">دوره جاری: {periodLabel(period)}</p>
          </div>
          <div className="topbar-side">
            <button className="account-chip" onClick={() => go('account')} title="رفتن به حساب من">
              <span className="account-chip-avatar">{profile.firstName?.slice(0, 1) || 'س'}</span>
              <span><strong>{profileName}</strong><small>واحد {me.no}</small></span>
              {responsibilityReminders.length > 0 && <span className="account-chip-alert">{num(responsibilityReminders.length)}</span>}
            </button>
            {installer && (
              <button className="chip install" onClick={() => { installer.prompt(); setInstaller(null) }}>
                ⬇️ نصب روی گوشی
              </button>
            )}
            <span className={`chip ${openVotes.length ? 'warn' : 'ok'}`}>
              {openVotes.length ? `${num(openVotes.length)} رأی‌گیری باز` : 'رأی‌گیری باز نیست'}
            </span>
            <span className={`chip ${publicDebtors.length ? 'warn' : 'ok'}`}>
              {publicDebtors.length ? `${num(publicDebtors.length)} بدهی عمومی‌شده` : 'بدون بدهی عمومی'}
            </span>
          </div>
        </header>
        <div className="content">{views[tab]}</div>
      </main>
    </div>
  )
}
