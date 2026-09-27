import { useState } from 'react'
import { Card, Button, Modal, Field, Badge, Empty } from '../components/ui'
import { tally } from '../lib/rules'
import { num, faDateStr, money } from '../lib/utils'

export default function Votes({ db, set, me, proposeVote }) {
  const { votes, units, constitution: c } = db
  const [form, setForm] = useState(null)

  const cast = (vote, choice) => {
    if (!me) return
    set.votes(
      votes.map((v) =>
        v.id === vote.id ? { ...v, ballots: { ...v.ballots, [me.id]: choice } } : v,
      ),
    )
  }

  const submit = (e) => {
    e.preventDefault()
    proposeVote({ type: 'general', title: form.title, desc: form.desc, payload: {} })
    setForm(null)
  }

  const open = votes.filter((v) => v.status === 'باز')
  const closed = votes.filter((v) => v.status !== 'باز')

  const VoteCard = ({ v }) => {
    const t = tally(v, units.length, c)
    const mine = me ? v.ballots?.[me.id] : null
    return (
      <article className="vote">
        <header className="row-between">
          <div className="row">
            <Badge tone={v.type === 'rule' ? 'blue' : v.type === 'expense' ? 'amber' : 'gray'}>
              {v.type === 'rule' ? 'تغییر قانون' : v.type === 'expense' ? 'هزینه' : 'عمومی'}
            </Badge>
            <strong>{v.title}</strong>
          </div>
          <Badge tone={v.status === 'تصویب شد' ? 'green' : v.status === 'رد شد' ? 'red' : 'amber'}>{v.status}</Badge>
        </header>
        {v.desc && <p className="muted">{v.desc}</p>}
        {v.payload?.expense && <p className="muted">مبلغ: <strong>{money(v.payload.expense.amount)}</strong></p>}

        <div className="tally">
          <div className="tally-bar">
            {Array.from({ length: units.length }, (_, i) => {
              const cls = i < t.yes ? 'yes' : i < t.yes + t.no ? 'no' : 'none'
              return <span key={i} className={`pip ${cls}`} />
            })}
          </div>
          <span className="small muted">
            {num(t.yes)} موافق · {num(t.no)} مخالف · نصاب {num(t.quorum)} از {num(units.length)} · مهلت تا {faDateStr(v.deadline)}
          </span>
        </div>

        {v.status === 'باز' ? (
          <div className="row">
            <Button variant={mine === 'yes' ? 'primary' : 'ghost'} onClick={() => cast(v, 'yes')}>👍 موافقم</Button>
            <Button variant={mine === 'no' ? 'danger' : 'ghost'} onClick={() => cast(v, 'no')}>👎 مخالفم</Button>
            {mine && <span className="small muted">رأی شما (واحد {me.no}) ثبت شد — تا پایان مهلت قابل تغییر است.</span>}
          </div>
        ) : (
          <p className="small muted">نتیجه قطعی و ثبت‌شده است؛ اجرای آن خودکار انجام شد.</p>
        )}
      </article>
    )
  }

  return (
    <div className="stack">
      <Card
        title={`رأی‌گیری‌های باز (${num(open.length)})`}
        extra={<Button variant="primary" onClick={() => setForm({ title: '', desc: '' })}>+ طرح موضوع جدید</Button>}
      >
        <p className="muted small">
          هر واحد یک رأی دارد. تصمیم با <strong>{num(c.quorum)} رأی موافق از {num(units.length)}</strong> قطعی می‌شود و اپ آن را
          بدون دخالت هیچ فردی اجرا می‌کند.
        </p>
        {open.length === 0 ? <Empty text="در حال حاضر رأی‌گیری بازی وجود ندارد." /> : open.map((v) => <VoteCard key={v.id} v={v} />)}
      </Card>

      <Card title={`آرشیو تصمیم‌ها (${num(closed.length)})`}>
        {closed.length === 0 ? <Empty text="هنوز تصمیمی نهایی نشده است." /> : closed.map((v) => <VoteCard key={v.id} v={v} />)}
      </Card>

      <Modal open={!!form} onClose={() => setForm(null)} title="طرح موضوع برای رأی‌گیری">
        {form && (
          <form className="form-grid" onSubmit={submit}>
            <Field label="موضوع"><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="توضیح"><textarea className="input" rows="3" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} /></Field>
            <div className="form-actions">
              <Button type="button" onClick={() => setForm(null)}>انصراف</Button>
              <Button type="submit" variant="primary">شروع رأی‌گیری</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
