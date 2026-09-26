import { useState } from 'react'
import './styles.css'
import { useLocalState, periodKey, periodLabel, num } from './lib/utils'
import {
  seedUnits, seedSettings, seedExpenses, seedAnnouncements, seedTickets,
  seedInvoices, seedPayments,
} from './lib/seed'
import { unitDebt } from './lib/calc'

import Dashboard from './views/Dashboard'
import Units from './views/Units'
import Charges from './views/Charges'
import Expenses from './views/Expenses'
import Announcements from './views/Announcements'
import Tickets from './views/Tickets'
import Reports from './views/Reports'
import Settings from './views/Settings'

const NAV = [
  { key: 'dashboard', label: 'داشبورد', icon: '🏠' },
  { key: 'units', label: 'واحدها و ساکنین', icon: '🚪' },
  { key: 'charges', label: 'شارژ و پرداخت‌ها', icon: '💳' },
  { key: 'expenses', label: 'هزینه‌ها و صندوق', icon: '🧾' },
  { key: 'announcements', label: 'تابلوی اعلانات', icon: '📢' },
  { key: 'tickets', label: 'درخواست تعمیرات', icon: '🛠️' },
  { key: 'reports', label: 'گزارش‌ها', icon: '📊' },
  { key: 'settings', label: 'تنظیمات', icon: '⚙️' },
]

const baseInvoices = seedInvoices(seedUnits, seedSettings)

export default function App() {
  const [units, setUnits] = useLocalState('bm.units', seedUnits)
  const [settings, setSettings] = useLocalState('bm.settings', seedSettings)
  const [invoices, setInvoices] = useLocalState('bm.invoices', baseInvoices)
  const [payments, setPayments] = useLocalState('bm.payments', seedPayments(baseInvoices))
  const [expenses, setExpenses] = useLocalState('bm.expenses', seedExpenses)
  const [announcements, setAnnouncements] = useLocalState('bm.announcements', seedAnnouncements)
  const [tickets, setTickets] = useLocalState('bm.tickets', seedTickets)

  const [tab, setTab] = useState('dashboard')
  const [period, setPeriod] = useState(periodKey())
  const [menuOpen, setMenuOpen] = useState(false)

  const db = { units, settings, invoices, payments, expenses, announcements, tickets }
  const set = {
    units: setUnits, settings: setSettings, invoices: setInvoices, payments: setPayments,
    expenses: setExpenses, announcements: setAnnouncements, tickets: setTickets,
  }

  const resetAll = () => {
    if (!confirm('همه اطلاعات پاک و داده‌های نمونه جایگزین می‌شود. مطمئن هستید؟')) return
    const inv = seedInvoices(seedUnits, seedSettings)
    setUnits(seedUnits); setSettings(seedSettings); setInvoices(inv)
    setPayments(seedPayments(inv)); setExpenses(seedExpenses)
    setAnnouncements(seedAnnouncements); setTickets(seedTickets)
  }

  const go = (k) => { setTab(k); setMenuOpen(false) }

  const debtors = units.filter((u) => unitDebt(u.id, invoices, payments) > 0).length
  const openTickets = tickets.filter((t) => t.status !== 'انجام‌شده').length
  const badges = { units: units.length, charges: debtors || null, tickets: openTickets || null }

  const props = { db, set, period, setPeriod, go }
  const views = {
    dashboard: <Dashboard {...props} />,
    units: <Units {...props} />,
    charges: <Charges {...props} />,
    expenses: <Expenses {...props} />,
    announcements: <Announcements {...props} />,
    tickets: <Tickets {...props} />,
    reports: <Reports {...props} />,
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
            <small>سامانه مدیریت ساختمان</small>
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
          <p className="muted">مدیر: {settings.manager}</p>
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
            <span className="chip">{num(units.length)} واحد</span>
            <span className={`chip ${debtors ? 'warn' : 'ok'}`}>{debtors ? `${num(debtors)} بدهکار` : 'بدون بدهی'}</span>
          </div>
        </header>
        <div className="content">{views[tab]}</div>
      </main>
    </div>
  )
}
