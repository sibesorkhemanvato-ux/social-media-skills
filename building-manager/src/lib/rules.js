// موتور قوانین: هیچ نقش مدیری وجود ندارد؛ همه‌چیز طبق قانون‌نامه و رأی ساکنین اجرا می‌شود.
import { sum } from './calc'

export const DAY = 86400000

/** قانون‌نامه پیش‌فرض (نسخه ۱ مصوب ساکنین) */
export const CONSTITUTION = {
  quorum: 5,                 // نصاب تصویب: ۵ رأی از ۸ واحد
  autoExpenseCap: 300000,    // سقف هزینه بدون رأی‌گیری (تومان)
  emergencyCap: 1500000,     // سقف هزینه اضطراری (آب/برق/آسانسور) بدون رأی
  dueDays: 10,               // مهلت پرداخت شارژ از تاریخ صدور (روز)
  lateGraceDays: 10,         // جریمه دیرکرد پس از این تعداد روز از پایان مهلت
  lateFeeDailyPercent: 0.1,  // درصد جریمه روزانه روی مانده بدهی
  warningEveryHours: 12,     // فاصله هشدارهای خودکار پس از مهلت
  publicAfterDays: 3,        // پس از این تعداد روز تأخیر …
  publicAfterWarnings: 6,    // … و این تعداد هشدار، بدهی عمومی می‌شود
  voteHours: 48,             // مهلت هر رأی‌گیری
  silenceIsYes: false,       // سکوت به معنی موافقت نیست
}

export const RULE_LABELS = {
  quorum: 'نصاب تصویب (از ۸ واحد)',
  autoExpenseCap: 'سقف هزینه بدون رأی‌گیری (تومان)',
  emergencyCap: 'سقف هزینه اضطراری بدون رأی (تومان)',
  dueDays: 'مهلت پرداخت شارژ (روز پس از صدور)',
  lateGraceDays: 'شروع جریمه دیرکرد (روز پس از مهلت)',
  lateFeeDailyPercent: 'نرخ جریمه دیرکرد (درصد روزانه)',
  warningEveryHours: 'فاصله هشدارهای خودکار (ساعت)',
  publicAfterDays: 'عمومی‌شدن بدهی پس از (روز تأخیر)',
  publicAfterWarnings: 'عمومی‌شدن بدهی پس از (تعداد هشدار)',
  voteHours: 'مهلت هر رأی‌گیری (ساعت)',
}

export const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / DAY)

/** تاریخ سررسید یک صورتحساب */
export function dueDate(inv, c) {
  return new Date(new Date(inv.createdAt).getTime() + (c.dueDays ?? 10) * DAY)
    .toISOString()
    .slice(0, 10)
}

/**
 * وضعیت کامل یک صورتحساب: مانده، جریمه، هشدارها و عمومی‌بودن بدهی.
 * همه چیز محاسبه‌شده است — هیچ‌کس نمی‌تواند دستی تغییرش دهد.
 */
export function invoiceState(inv, payments, c, now = new Date()) {
  const due = dueDate(inv, c)
  const paid = sum(payments.filter((p) => p.invoiceId === inv.id || (p.unitId === inv.unitId && p.period === inv.period)), (p) => p.amount)
  const principal = Math.max(0, inv.amount - paid)
  const overdueDays = Math.max(0, daysBetween(due, now))
  const settled = principal <= 0

  const feeDays = Math.max(0, overdueDays - (c.lateGraceDays ?? 10))
  const lateFee = settled ? 0 : Math.round((principal * (c.lateFeeDailyPercent ?? 0) * feeDays) / 100)

  const hours = settled ? 0 : Math.max(0, (now - new Date(due)) / 3600000)
  const warnings = settled ? 0 : Math.floor(hours / (c.warningEveryHours ?? 12))
  const isPublic =
    !settled && overdueDays >= (c.publicAfterDays ?? 3) && warnings >= (c.publicAfterWarnings ?? 6)

  return {
    due, paid, principal, total: principal + lateFee, lateFee,
    overdueDays, feeDays, warnings, isPublic, settled,
    state: settled ? 'تسویه‌شده' : paid > 0 ? 'ناقص' : overdueDays > 0 ? 'معوق' : 'در مهلت',
  }
}

/** جمع بدهی و جریمه یک واحد روی همه صورتحساب‌ها */
export function unitLedger(unitId, invoices, payments, c, now = new Date()) {
  const rows = invoices.filter((i) => i.unitId === unitId).map((i) => ({ inv: i, st: invoiceState(i, payments, c, now) }))
  return {
    rows,
    debt: sum(rows, (r) => r.st.principal),
    fees: sum(rows, (r) => r.st.lateFee),
    total: sum(rows, (r) => r.st.total),
    isPublic: rows.some((r) => r.st.isPublic),
    warnings: Math.max(0, ...rows.map((r) => r.st.warnings)),
  }
}

/** تصمیم‌گیری درباره یک هزینه: خودکار، اضطراری یا نیازمند رأی */
export function expenseRoute(amount, emergency, c) {
  if (emergency) {
    return amount <= c.emergencyCap
      ? { mode: 'auto', reason: `هزینه اضطراری زیر سقف ${c.emergencyCap.toLocaleString('fa-IR')} تومان — بدون رأی ثبت شد` }
      : { mode: 'vote', reason: 'هزینه اضطراری بالاتر از سقف — نیازمند رأی‌گیری' }
  }
  return amount <= c.autoExpenseCap
    ? { mode: 'auto', reason: `زیر سقف ${c.autoExpenseCap.toLocaleString('fa-IR')} تومان — بدون رأی ثبت شد` }
    : { mode: 'vote', reason: 'بالاتر از سقف مصوب — نیازمند رأی ۵ از ۸' }
}

/** شمارش آرا و تعیین سرنوشت یک رأی‌گیری */
export function tally(vote, unitsCount, c, now = new Date()) {
  const ballots = Object.values(vote.ballots || {})
  const yes = ballots.filter((b) => b === 'yes').length
  const no = ballots.filter((b) => b === 'no').length
  const quorum = vote.quorum ?? c.quorum
  const expired = new Date(vote.deadline) <= now
  const maxYes = yes + (unitsCount - yes - no) // بیشترین رأی مثبت ممکن
  let status = 'باز'
  if (yes >= quorum) status = 'تصویب شد'
  else if (maxYes < quorum || (expired && yes < quorum)) status = 'رد شد'
  return { yes, no, quorum, expired, status, voted: ballots.length, remaining: unitsCount - ballots.length }
}

export const DUTIES = [
  { key: 'clean', label: 'نظارت بر نظافت و سرایدار', icon: '🧹' },
  { key: 'supply', label: 'خرید اقلام مشاعات', icon: '🛒' },
  { key: 'service', label: 'هماهنگی سرویس‌کار و تعمیرات', icon: '🔧' },
]

/** نوبت چرخشی عادلانه: بدون انتخاب، بدون تعارف — بر اساس شماره ماه */
export function dutiesFor(period, units) {
  if (units.length === 0) return []
  const [y, m] = period.split('-').map(Number)
  const idx = y * 12 + m
  return DUTIES.map((d, i) => ({
    ...d,
    unit: units[(idx + i * Math.ceil(units.length / DUTIES.length)) % units.length],
  }))
}
