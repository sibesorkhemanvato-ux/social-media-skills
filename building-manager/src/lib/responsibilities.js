import { DAY } from './rules'

export const RESPONSIBILITY_STATUSES = ['فعال', 'انجام‌شده', 'لغوشده']

export const RESPONSIBILITY_EXAMPLES = [
  'مسئول خرید اقلام نظافت',
  'مسئول هماهنگی سرویس آسانسور',
  'مسئول پرداخت قبض آب',
  'مسئول پیگیری تعمیرات',
]

/** وضعیت زمانی یک مسئولیت فعال برای نمایش یادآوری سررسید */
export function responsibilityTiming(item, now = new Date()) {
  if (item.status !== 'فعال' || !item.dueDate) {
    return { level: 'normal', days: null, label: '' }
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const due = new Date(`${item.dueDate}T00:00:00`)
  if (Number.isNaN(due.getTime())) return { level: 'normal', days: null, label: '' }
  const days = Math.ceil((due - today) / DAY)

  if (days < 0) return { level: 'overdue', days, label: `${Math.abs(days)} روز از سررسید گذشته است` }
  if (days === 0) return { level: 'today', days, label: 'سررسید امروز است' }
  if (days <= 3) return { level: 'urgent', days, label: `فقط ${days} روز تا سررسید مانده است` }
  if (days <= 7) return { level: 'soon', days, label: `${days} روز تا سررسید مانده است` }
  return { level: 'normal', days, label: `${days} روز تا سررسید مانده است` }
}

export function belongsToProfile(item, profile, unit) {
  if (!profile || !unit) return false
  if (item.profileId) return item.profileId === profile.id
  const name = profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' ')
  return item.unitId === unit.id && (!item.assigneeName || item.assigneeName === name)
}

export function responsibilityTone(item) {
  if (item.status === 'انجام‌شده') return 'green'
  if (item.status === 'لغوشده') return 'gray'
  const { level } = responsibilityTiming(item)
  if (level === 'overdue' || level === 'today') return 'red'
  if (level === 'urgent' || level === 'soon') return 'amber'
  return 'blue'
}
