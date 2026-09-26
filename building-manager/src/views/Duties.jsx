import { Card, Badge, Empty } from '../components/ui'
import { dutiesFor } from '../lib/rules'
import { periodLabel, shiftPeriod, num } from '../lib/utils'

export default function Duties({ db, period, me }) {
  const { units } = db
  const months = Array.from({ length: 6 }, (_, i) => shiftPeriod(period, i))
  const now = dutiesFor(period, units)

  if (units.length === 0) return <Card title="نوبت‌ها"><Empty text="واحدی ثبت نشده است." /></Card>

  return (
    <div className="stack">
      <Card title={`نوبت‌های ${periodLabel(period)}`}>
        <p className="muted small">
          کارهایی که دست فیزیکی می‌خواهد، بدون تعارف و بدون انتخاب فردی، به‌صورت چرخشی بین {num(units.length)} واحد تقسیم می‌شود.
          ترتیب را تقویم تعیین می‌کند، نه هیچ‌کس دیگر.
        </p>
        <div className="duties">
          {now.map((d) => (
            <div className={`duty ${me && d.unit.id === me.id ? 'mine' : ''}`} key={d.key}>
              <span className="duty-icon">{d.icon}</span>
              <div>
                <strong>{d.label}</strong>
                <p className="muted small">واحد {d.unit.no} — {d.unit.resident || d.unit.owner}</p>
              </div>
              {me && d.unit.id === me.id && <Badge tone="green">نوبت شما</Badge>}
            </div>
          ))}
        </div>
      </Card>

      <Card title="تقویم شش ماه آینده">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>ماه</th>{dutiesFor(period, units).map((d) => <th key={d.key}>{d.icon} {d.label}</th>)}</tr>
            </thead>
            <tbody>
              {months.map((p) => (
                <tr key={p}>
                  <td><strong>{periodLabel(p)}</strong></td>
                  {dutiesFor(p, units).map((d) => (
                    <td key={d.key} className={me && d.unit.id === me.id ? 'good-text' : ''}>واحد {d.unit.no}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small mt">اگر نوبتی برایتان ممکن نیست، با همسایه تعویض کنید و موضوع را در بخش رأی‌گیری ثبت کنید تا در سوابق بماند.</p>
      </Card>
    </div>
  )
}
