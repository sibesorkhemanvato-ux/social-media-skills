import { uid, periodKey, shiftPeriod, todayISO } from './utils'

const cur = periodKey()
const prev = shiftPeriod(cur, -1)

const d = (daysAgo) =>
  new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10)

export const seedUnits = [
  { id: 'u1', no: '۱', floor: 1, owner: 'رضا کریمی', resident: 'رضا کریمی', phone: '۰۹۱۲۱۱۱۲۲۳۳', area: 95, people: 3, parking: 1, vacant: false },
  { id: 'u2', no: '۲', floor: 1, owner: 'مریم صادقی', resident: 'خانواده نوری', phone: '۰۹۱۲۲۲۲۳۳۴۴', area: 95, people: 4, parking: 1, vacant: false },
  { id: 'u3', no: '۳', floor: 2, owner: 'علی موسوی', resident: 'علی موسوی', phone: '۰۹۱۲۳۳۳۴۴۵۵', area: 110, people: 2, parking: 1, vacant: false },
  { id: 'u4', no: '۴', floor: 2, owner: 'سحر عباسی', resident: '—', phone: '۰۹۱۲۴۴۴۵۵۶۶', area: 110, people: 0, parking: 1, vacant: true },
  { id: 'u5', no: '۵', floor: 3, owner: 'حسین رستمی', resident: 'حسین رستمی', phone: '۰۹۱۲۵۵۵۶۶۷۷', area: 130, people: 5, parking: 2, vacant: false },
  { id: 'u6', no: '۶', floor: 3, owner: 'نگار احمدی', resident: 'نگار احمدی', phone: '۰۹۱۲۶۶۶۷۷۸۸', area: 130, people: 2, parking: 1, vacant: false },
  { id: 'u7', no: '۷', floor: 4, owner: 'محمد جعفری', resident: 'محمد جعفری', phone: '۰۹۱۲۷۷۷۸۸۹۹', area: 120, people: 3, parking: 1, vacant: false },
  { id: 'u8', no: '۸', floor: 4, owner: 'زهرا میرزایی', resident: 'خانواده شریفی', phone: '۰۹۱۲۸۸۸۹۹۰۰', area: 120, people: 2, parking: 1, vacant: false },
]

export const seedSettings = {
  buildingName: 'مجتمع مسکونی یاس',
  address: 'تهران، خیابان ولیعصر، کوچه بهار، پلاک ۱۲',
  manager: 'مدیر ساختمان',
  fixed: 350000,
  perPerson: 120000,
  perArea: 2500,
  perParking: 50000,
  vacantRatio: 40, // درصد شارژ برای واحد خالی
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
      const base =
        s.fixed + s.perPerson * u.people + s.perArea * u.area + s.perParking * u.parking
      const amount = Math.round(u.vacant ? (base * s.vacantRatio) / 100 : base)
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
