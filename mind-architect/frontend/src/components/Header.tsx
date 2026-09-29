import { useEffect, useState } from 'react'
import { Button } from './Button'
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from './Icons'

type HeaderProps = { onLogin: () => void; onNavigate: (path: string) => void }

const links = [
  { href: '/', label: 'خانه' },
  { href: '/course', label: 'دوره' },
  { href: '/about', label: 'درباره مهدی' },
]

export function Header({ onLogin, onNavigate }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('ma-theme') === 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('ma-theme', dark ? 'dark' : 'light')
  }, [dark])

  const go = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    event.preventDefault()
    setOpen(false)
    onNavigate(path)
  }

  return (
    <header className="site-header">
      <div className="container nav">
        <a href="/" className="brand" onClick={(event) => go(event, '/')} aria-label="معمار ذهن، صفحه اصلی">
          <span className="brand__mark">م</span>
          <span>معمار ذهن</span>
        </a>
        <nav className={`nav__links ${open ? 'nav__links--open' : ''}`} aria-label="ناوبری اصلی">
          {links.map((link) => <a href={link.href} key={link.href} onClick={(event) => go(event, link.href)}>{link.label}</a>)}
          <a href="/webinar" onClick={(event) => go(event, '/webinar')}>وبینار رایگان</a>
          <button className="nav__login" type="button" onClick={() => { setOpen(false); onLogin() }}>ورود</button>
        </nav>
        <div className="nav__actions">
          <button className="icon-button" type="button" onClick={() => setDark((value) => !value)} aria-label={dark ? 'فعال‌کردن حالت روشن' : 'فعال‌کردن حالت تیره'}>
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          <Button href="/webinar" onClick={(event) => go(event, '/webinar')} className="nav__cta">ثبت‌نام وبینار</Button>
          <button className="mobile-menu" type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? 'بستن منو' : 'بازکردن منو'} aria-expanded={open}>
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </header>
  )
}
