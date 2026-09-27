import { uid, periodKey, shiftPeriod, todayISO } from './utils'

const cur = periodKey()
const prev = shiftPeriod(cur, -1)

const d = (daysAgo) =>
  new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10)

export const seedUnits = [
  { id: 'u1', no: '۱', floor: 1, owner: 'رضا کریمی', resident: 'رضا کریمی', phone: '۰۹۱۲۱۱۱۲۲۳۳', area: 95, people: 3, parking: 1, vacant: false, occupancyStatus: 'مالک ساکن' },
  { id: 'u2', no: '۲', floor: 1, owner: 'مریم صادقی', resident: 'خانواده نوری', phone: '۰۹۱۲۲۲۲۳۳۴۴', area: 95, people: 4, parking: 1, vacant: false, occupancyStatus: 'مستأجر' },
  { id: 'u3', no: '۳', floor: 2, owner: 'علی موسوی', resident: 'علی موسوی', phone: '۰۹۱۲۳۳۳۴۴۵۵', area: 110, people: 2, parking: 1, vacant: false, occupancyStatus: 'مالک ساکن' },
  { id: 'u4', no: '۴', floor: 2, owner: 'سحر عباسی', resident: '', phone: '۰۹۱۲۴۴۴۵۵۶۶', area: 110, people: 0, parking: 1, vacant: true, occupancyStatus: 'خالی' },
  { id: 'u5', no: '۵', floor: 3, owner: 'حسین رستمی', resident: 'حسین رستمی', phone: '۰۹۱۲۵۵۵۶۶۷۷', area: 130, people: 5, parking: 2, vacant: false, occupancyStatus: 'مالک ساکن' },
  { id: 'u6', no: '۶', floor: 3, owner: 'نگار احمدی', resident: 'نگار احمدی', phone: '۰۹۱۲۶۶۶۷۷۸۸', area: 130, people: 2, parking: 1, vacant: false, occupancyStatus: 'مالک ساکن' },
  { id: 'u7', no: '۷', floor: 4, owner: 'محمد جعفری', resident: 'محمد جعفری', phone: '۰۹۱۲۷۷۷۸۸۹۹', area: 120, people: 3, parking: 1, vacant: false, occupancyStatus: 'مالک ساکن' },
  { id: 'u8', no: '۸', floor: 4, owner: 'زهرا میرزایی', resident: 'خانواده شریفی', phone: '۰۹۱۲۸۸۸۹۹۰۰', area: 120, people: 2, parking: 1, vacant: false, occupancyStatus: 'مستأجر' },
]

export const seedSettings = {
  buildingName: 'مجتمع مسکونی یاس',
  address: 'تهران، خیابان ولیعصر، کوچه بهار، پلاک ۱۲',
  manager: 'مدیر ساختمان',
  cleaning: 4000000,
  water: 2400000,
  elevator: 1600000,
  commonElectricity: 1200000,
  miscellaneous: 800000,
  elevatorIntervalDays: 30,
  dueDay: 10,
  openingBalance: 4500000,
}

export const seedExpenses = [
  { id: uid(), title: 'قبض برق مشاعات', category: 'قبوض', amount: 1850000, date: d(12), note: 'دوره تابستان' },
  { id: uid(), title: 'حقوق سرایدار', category: 'حقوق', amount: 6000000, date: d(9), note: '' },
  { id: uid(), title: 'سرویس آسانسور', category: 'تعمیرات', amount: 2400000, date: d(21), note: 'سرویس دوره‌ای' },
  { id: uid(), title: 'مواد شوینده و نظافت', category: 'نظافت', amount: 620000, date: d(4), note: '' },
]

export const seedAnnouncements = [
  { id: uid(), title: 'قطعی آب روز پنجشنبه', body: 'به اطلاع ساکنین محترم می‌رساند آب ساختمان روز پنجشنبه از ساعت ۹ تا ۱۳ جهت شست‌وشوی مخزن قطع خواهد بود.', date: d(2), pinned: true, category: 'اطلاعیه' },
  { id: uid(), title: 'جلسه هیئت‌مدیره', body: 'جلسه ماهانه هیئت‌مدیره جمعه ساعت ۱۸ در لابی برگزار می‌شود. حضور نماینده هر واحد الزامی است.', date: d(5), pinned: false, category: 'جلسه' },
  { id: uid(), title: 'یادآوری پرداخت شارژ', body: 'لطفاً شارژ ماه جاری را تا دهم ماه پرداخت کنید تا در پرداخت هزینه‌های مشترک وقفه ایجاد نشود.', date: d(7), pinned: false, category: 'مالی' },
]

export const seedTickets = [
  { id: uid(), unitId: 'u5', title: 'چکه کردن شیر آب پارکینگ', desc: 'شیر آب کنار پارکینگ ۲ مدام چکه می‌کند.', priority: 'متوسط', status: 'در حال بررسی', createdAt: d(3), assignee: 'سرایدار' },
  { id: uid(), unitId: 'u2', title: 'خرابی لامپ راه‌پله طبقه اول', desc: 'لامپ سنسوردار کار نمی‌کند.', priority: 'کم', status: 'باز', createdAt: d(1), assignee: '' },
  { id: uid(), unitId: 'u3', title: 'صدای غیرعادی آسانسور', desc: 'هنگام توقف در طبقه دوم صدای تقه می‌دهد.', priority: 'زیاد', status: 'باز', createdAt: todayISO(), assignee: '' },
]

/** صورتحساب‌های نمونه برای ماه جاری و ماه قبل */
export function seedInvoices(units, s) {
  const out = []
  for (const p of [prev, cur]) {
    for (const u of units) {
      const total = ['cleaning', 'water', 'elevator', 'commonElectricity', 'miscellaneous']
        .reduce((sum, key) => sum + Number(s[key] || 0), 0)
      const amount = Math.round(total / Math.max(1, units.length))
      out.push({ id: uid(), unitId: u.id, period: p, amount, createdAt: d(p === cur ? 6 : 36) })
    }
  }
  return out
}

export function seedPayments(invoices) {
  // ماه قبل: همه پرداخت کرده‌اند به‌جز واحد ۴ / ماه جاری: سه واحد پرداخت کرده‌اند
  const out = []
  invoices.forEach((inv) => {
    const isPrev = inv.period === prev
    const paidNow = ['u1', 'u3', 'u6', 'u7'].includes(inv.unitId)
    if ((isPrev && !['u4', 'u8'].includes(inv.unitId)) || (!isPrev && paidNow)) {
      out.push({
        id: uid(),
        unitId: inv.unitId,
        amount: inv.amount,
        date: d(isPrev ? 30 : 5),
        period: inv.period,
        method: 'کارت به کارت',
        note: '',
      })
    }
  })
  return out
}

export function seedVotes(units) {
  const now = Date.now()
  return [
    {
      id: uid(),
      type: 'expense',
      title: 'تعویض موتور درب پارکینگ',
      desc: 'موتور فعلی دو بار در ماه گذشته قفل کرده است. پیشنهاد واحد ۳ بر اساس فاکتور پیوست.',
      payload: { expense: { title: 'تعویض موتور درب پارکینگ', category: 'تعمیرات', amount: 4200000, date: todayISO(), note: 'مصوب رأی‌گیری' } },
      proposedBy: units[2]?.id,
      createdAt: new Date(now - 20 * 3600000).toISOString(),
      deadline: new Date(now + 28 * 3600000).toISOString(),
      ballots: { [units[0]?.id]: 'yes', [units[2]?.id]: 'yes', [units[5]?.id]: 'no' },
      status: 'باز',
    },
    {
      id: uid(),
      type: 'general',
      title: 'ساعت خاموشی سروصدا از ۲۳ تا ۸',
      desc: 'پیشنهاد واحد ۶ برای رعایت سکوت در ساعات شب.',
      payload: {},
      proposedBy: units[5]?.id,
      createdAt: new Date(now - 6 * 86400000).toISOString(),
      deadline: new Date(now - 4 * 86400000).toISOString(),
      ballots: Object.fromEntries(units.slice(0, 6).map((u) => [u.id, 'yes'])),
      status: 'تصویب شد',
      applied: true,
    },
  ]
}

export const seedElevatorServices = [
  { id: uid(), date: d(18), company: 'آسان‌بر ایمن', technician: 'آقای محمدی', cost: 2400000, note: 'بازبینی موتور، روغن‌کاری ریل‌ها و آزمون ترمز اضطراری' },
]

const future = (days) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)

/** داده‌های نمونه مسئولیت‌ها؛ هر مورد به حساب واحد مربوط متصل است. */
export const seedResponsibilities = [
  {
    id: uid(), unitId: 'u1', assigneeName: 'رضا کریمی',
    title: 'مسئول خرید اقلام نظافت',
    description: 'بررسی موجودی انبار و تهیه شوینده و کیسه زباله برای ماه آینده.',
    startDate: d(8), dueDate: future(3), status: 'فعال', createdAt: d(8),
  },
  {
    id: uid(), unitId: 'u3', assigneeName: 'علی موسوی',
    title: 'مسئول هماهنگی سرویس آسانسور',
    description: 'هماهنگی بازدید دوره‌ای و دریافت گزارش کتبی سرویس‌کار.',
    startDate: d(20), dueDate: d(2), status: 'فعال', createdAt: d(20),
  },
  {
    id: uid(), unitId: 'u6', assigneeName: 'نگار احمدی',
    title: 'مسئول پرداخت قبض آب',
    description: 'ثبت شناسه پرداخت در دفتر رویدادها پس از تسویه قبض.',
    startDate: d(40), dueDate: d(15), status: 'انجام‌شده', createdAt: d(40),
  },
  {
    id: uid(), unitId: 'u7', assigneeName: 'محمد جعفری',
    title: 'مسئول پیگیری تعمیرات',
    description: 'دریافت برآورد تعمیر در پارکینگ.',
    startDate: d(30), dueDate: d(12), status: 'لغوشده', createdAt: d(30),
  },
]
