/** هزینه‌های مشترک ماهانه که به‌طور مساوی میان همه واحدها تقسیم می‌شوند */
export const SHARED_CHARGE_KEYS = ['cleaning', 'water', 'elevator', 'commonElectricity', 'miscellaneous']

export function sharedChargeTotal(s) {
  return SHARED_CHARGE_KEYS.reduce((total, key) => total + Number(s[key] || 0), 0)
}

/** سهم برابر یک واحد از کل هزینه‌های مشترک ماهانه */
export function chargeFor(_unit, s, unitCount = 1) {
  return Math.round(sharedChargeTotal(s) / Math.max(1, Number(unitCount) || 1))
}

export const sum = (arr, f = (x) => x) => arr.reduce((a, b) => a + Number(f(b) || 0), 0)

/** بدهی هر واحد = مجموع صورتحساب‌ها منهای مجموع پرداخت‌ها */
export function unitDebt(unitId, invoices, payments) {
  const billed = sum(invoices.filter((i) => i.unitId === unitId), (i) => i.amount)
  const paid = sum(payments.filter((p) => p.unitId === unitId), (p) => p.amount)
  return billed - paid
}

export function periodStatus(unitId, period, invoices, payments) {
  const billed = sum(
    invoices.filter((i) => i.unitId === unitId && i.period === period),
    (i) => i.amount,
  )
  const paid = sum(
    payments.filter((p) => p.unitId === unitId && p.period === period),
    (p) => p.amount,
  )
  if (billed === 0) return { billed, paid, state: 'بدون صورتحساب' }
  if (paid >= billed) return { billed, paid, state: 'پرداخت‌شده' }
  if (paid > 0) return { billed, paid, state: 'ناقص' }
  return { billed, paid, state: 'پرداخت‌نشده' }
}

export function fundBalance(settings, payments, expenses) {
  return (
    Number(settings.openingBalance || 0) +
    sum(payments, (p) => p.amount) -
    sum(expenses, (e) => e.amount)
  )
}
