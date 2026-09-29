import { useState } from 'react'
import { api } from '../lib/api'
import { Button } from './Button'

export function WebinarForm() {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !/^09\d{9}$/.test(mobile)) {
      setState('error'); setMessage('نام و شماره موبایل ۰۹xxxxxxxxx را وارد کنید.'); return
    }
    setState('loading')
    try {
      const response = await api.webinar(name.trim(), mobile)
      setState('success'); setMessage(response.message)
    } catch (error) {
      setState('error'); setMessage(error instanceof Error ? error.message : 'خطا در ثبت‌نام. دوباره تلاش کنید.')
    }
  }

  return <form className="lead-form" onSubmit={submit} noValidate>
    <div className="field">
      <label htmlFor="webinar-name">نام</label>
      <input id="webinar-name" type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="نام شما" />
    </div>
    <div className="field">
      <label htmlFor="webinar-mobile">شماره موبایل</label>
      <input id="webinar-mobile" inputMode="numeric" dir="ltr" value={mobile} onChange={(event) => setMobile(event.target.value.replace(/[^0-9]/g, ''))} autoComplete="tel" placeholder="09123456789" />
    </div>
    <Button type="submit" disabled={state === 'loading'} className="lead-form__submit">{state === 'loading' ? 'در حال ثبت‌نام' : 'ثبت‌نام وبینار رایگان'}</Button>
    {message && <p className={`form-message form-message--${state === 'error' ? 'error' : state === 'success' ? 'success' : 'info'}`} role="status">{message}</p>}
  </form>
}
