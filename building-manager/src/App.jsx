import { useState, useEffect, useCallback } from 'react'
import './styles.css'
import { useLocalState, periodKey, periodLabel, num, uid } from './lib/utils'
import {
  seedUnits, seedSettings, seedExpenses, seedAnnouncements, seedTickets,
  seedInvoices, seedPayments, seedVotes,
} from './lib/seed'
import { CONSTITUTION, unitLedger, tally } from './lib/rules'

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

const NAV = [
  { key: 'dashboard', label: 'داشبورد ساختمان', icon: '🏠' },
  { key: 'charges', label: 'شارژ و پرداخت‌ها', icon: '💳' },
  { key: 'expenses', label: 'هزینه‌ها و صندوق', icon: '🧾' },
  { key: 'votes', label: 'رأی‌گیری‌ها', icon: '🗳️' },
  { key: 'rules', label: 'قانون‌نامه', icon: '⚖️' },
  { key: 'duties', label: 'نوبت‌ها', icon: '🔁' },
  { key: 'tickets', label: 'درخواست تعمیرات', icon: '🛠️' },
  { key: 'announcements', label: 'تابلوی اعلانات', icon: '📢' },
  { key: 'units', label: 'واحدها و ساکنین', icon: '🚪' },
  { key: 'reports', label: 'گزارش‌ها', icon: '📊' },
  { key: 'settings', label: 'پشتیبان و اطلاعات', icon: '⚙️' },
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
  const [meId, setMeId] = useLocalState('bm3.me', seedUnits[0].id)

  const [tab, setTab] = useState('dashboard')
  const [period, setPeriod] = useState(periodKey())
  const [menuOpen, setMenuOpen] = useState(false)

  const me = units.find((u) => u.id === meId) ?? units[0]

  const db = { units, settings, constitution, invoices, payments, expenses, announcements, tickets, votes, log }
  const set = {
    units: setUnits, settings: setSettings, constitution: setConstitution, invoices: setInvoices,
    payments: setPayments, expenses: setExpenses, announcements: setAnnouncements,
    tickets: setTickets, votes: setVotes, log: setLog,
  }

  const addLog = useCallback(
    (text, actor = 'سیستم') => setLog((l) => [{ id: uid(), at: new Date().toISOString(), actor, text }, ...l].slice(0, 200)),
    [setLog],
  )

  /** ثبت یک موضوع برای رأی‌گیری — هیچ تصمیمی بدون رأی اجرا نمی‌شود */
  const proposeVote = useCallback(
    ({ type, title, desc, payload }) => {
      const v = {
        id: uid(), type, title, desc, payload,
        proposedBy: meId,
        createdAt: new Date().toISOString(),
        deadline: new Date(Date.now() + constitution.voteHours * 3600000).toISOString(),
        ballots: {}, status: 'باز',
      }
      setVotes((prev) => [v, ...prev])
      addLog(`رأی‌گیری «${title}» توسط واحد ${me?.no} آغاز شد.`, `واحد ${me?.no}`)
      return v
    },
    [constitution.voteHours, meId, me, setVotes, addLog],
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
    if (!confirm('همه اطلاعات پاک و داده‌های نمونه جایگزین می‌شود. مطمئن هستید؟')) return
    const inv = seedInvoices(seedUnits, seedSettings)
    setUnits(seedUnits); setSettings(seedSettings); setConstitution(CONSTITUTION)
    setInvoices(inv); setPayments(seedPayments(inv)); setExpenses(seedExpenses)
    setAnnouncements(seedAnnouncements); setTickets(seedTickets)
    setVotes(seedVotes(seedUnits)); setLog([])
  }

  const go = (k) => { setTab(k); setMenuOpen(false) }

  const ledgers = units.map((u) => ({ u, l: unitLedger(u.id, invoices, payments, constitution) }))
  const debtors = ledgers.filter((x) => x.l.debt > 0)
  const publicDebtors = ledgers.filter((x) => x.l.isPublic)
  const openVotes = votes.filter((v) => v.status === 'باز')
  const openTickets = tickets.filter((t) => t.status !== 'انجام‌شده')
  const badges = {
    votes: openVotes.length || null,
    charges: debtors.length || null,
    tickets: openTickets.length || null,
  }

  const props = { db, set, period, setPeriod, go, me, proposeVote, addLog, ledgers, publicDebtors }
  const views = {
    dashboard: <Dashboard {...props} />,
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
  }
  const current = NAV.find((n) => n.key === tab)

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
            <label className="who">
              <span className="small muted">من:</span>
              <select className="input tiny" value={meId} onChange={(e) => setMeId(e.target.value)}>
                {units.map((u) => <option key={u.id} value={u.id}>واحد {u.no} — {u.resident || u.owner}</option>)}
              </select>
            </label>
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
