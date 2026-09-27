import { useEffect } from 'react'

export function Card({ title, extra, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || extra) && (
        <header className="card-head">
          <h3>{title}</h3>
          <div>{extra}</div>
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  )
}

export function Stat({ label, value, hint, tone = '' }) {
  return (
    <div className={`stat ${tone}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  )
}

export function Badge({ children, tone = 'gray' }) {
  return <span className={`badge ${tone}`}>{children}</span>
}

export function Button({ children, variant = 'ghost', className = '', ...rest }) {
  return (
    <button className={`btn ${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <em>{hint}</em>}
    </label>
  )
}

export function Modal({ title, open, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="بستن">✕</button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  )
}

export function Empty({ text }) {
  return <p className="empty">{text}</p>
}
