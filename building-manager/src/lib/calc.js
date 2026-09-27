/** محاسبه شارژ ماهانه یک واحد بر اساس فرمول تنظیمات */
export function chargeFor(unit, s) {
  const base =
    Number(s.fixed || 0) +
    Number(s.perPerson || 0) * Number(unit.people || 0) +
    Number(s.perArea || 0) * Number(unit.area || 0) +
    Number(s.perParking || 0) * Number(unit.parking || 0)
  return Math.round(unit.vacant ? (base * Number(s.vacantRatio || 0)) / 100 : base)
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
