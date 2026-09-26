// ابزارهای مشترک: تاریخ شمسی، پول، شناسه و ذخیره‌سازی محلی
import { useState, useEffect } from 'react'

export const uid = () => Math.random().toString(36).slice(2, 10)

const faDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export const MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

/** اجزای تاریخ شمسی برای یک تاریخ میلادی */
export function jalaliParts(date = new Date()) {
  const [y, m, d] = faDate.format(date).split('/').map(Number)
  return { y, m, d }
}

/** کلید دوره مثل 1404-07 */
export function periodKey(date = new Date()) {
  const { y, m } = jalaliParts(date)
  return `${y}-${String(m).padStart(2, '0')}`
}

export function periodLabel(key) {
  if (!key) return '—'
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

export function shiftPeriod(key, delta) {
  let [y, m] = key.split('-').map(Number)
  m += delta
  while (m > 12) { m -= 12; y += 1 }
  while (m < 1) { m += 12; y -= 1 }
  return `${y}-${String(m).padStart(2, '0')}`
}

/** رشته تاریخ شمسی از ISO */
export function faDateStr(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return faDate.format(d)
}

export const todayISO = () => new Date().toISOString().slice(0, 10)

const nf = new Intl.NumberFormat('fa-IR')
export const money = (n) => `${nf.format(Math.round(Number(n) || 0))} تومان`
export const num = (n) => nf.format(Number(n) || 0)

export function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch { /* سهمیه ذخیره‌سازی پر است */ }
  }, [key, value])
  return [value, setValue]
}
