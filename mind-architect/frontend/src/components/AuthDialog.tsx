import { useState } from 'react'
import { api } from '../lib/api'
import { Button } from './Button'
import { CloseIcon } from './Icons'

type AuthDialogProps = { onClose: () => void }

export function AuthDialog({ onClose }: AuthDialogProps) {
  const [mobile, setMobile] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'mobile' | 'code'>('mobile')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const startOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!/^09\d{9}$/.test(mobile)) {
      setState('error'); setMessage('شماره موبایل را به‌صورت ۰۹xxxxxxxxx وارد کنید.'); return
    }
    setState('loading')
    try {
      const response = await api.otpStart(mobile)
      setStep('code'); setState('idle'); setMessage(response.message)
    } catch (error) {
      setState('error'); setMessage(error instanceof Error ? error.message : 'خطا در ارسال کد')
    }
  }

  const verifyOtp = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!/^\d{4,6}$/.test(code)) {
      setState('error'); setMessage('کد یک‌بارمصرف را وارد کنید.'); return
    }
    setState('loading')
    try {
      const response = await api.otpVerify(mobile, code)
      setState('success'); setMessage(response.message)
    } catch (error) {
      setState('error'); setMessage(error instanceof Error ? error.message : 'خطا در تأیید کد')
    }
  }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
      <button className="dialog__close" type="button" onClick={onClose} aria-label="بستن"><CloseIcon /></button>
      <p className="eyebrow">ورود به حساب</p>
      <h2 id="auth-title">ورود با شماره موبایل</h2>
      <p className="dialog__intro">کد یک‌بارمصرف برای ورود ارسال می‌شود.</p>
      {step === 'mobile' ? <form onSubmit={startOtp} noValidate>
        <label htmlFor="login-mobile">شماره موبایل</label>
        <input id="login-mobile" inputMode="numeric" dir="ltr" placeholder="09123456789" value={mobile} onChange={(event) => setMobile(event.target.value.replace(/[^0-9]/g, ''))} autoComplete="tel" />
        <Button type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'در حال ارسال' : 'ارسال کد'}</Button>
      </form> : <form onSubmit={verifyOtp} noValidate>
        <label htmlFor="otp-code">کد یک‌بارمصرف</label>
        <input id="otp-code" inputMode="numeric" dir="ltr" placeholder="123456" value={code} onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ''))} autoComplete="one-time-code" autoFocus />
        <Button type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'در حال بررسی' : 'تأیید و ورود'}</Button>
      </form>}
      {message && <p className={`form-message form-message--${state === 'error' ? 'error' : state === 'success' ? 'success' : 'info'}`} role="status">{message}</p>}
    </section>
  </div>
}
