export type ApiResponse = { message: string; payment_url?: string }

const apiBase = import.meta.env.VITE_API_BASE ?? '/api'

async function request(path: string, options: RequestInit): Promise<ApiResponse> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({ detail: 'خطا در ارتباط با سرویس' }))) as { detail?: string }
    throw new Error(body.detail ?? 'خطا در ارتباط با سرویس')
  }
  return response.json() as Promise<ApiResponse>
}

export const api = {
  webinar: (name: string, mobile: string) => request('/webinar/register', { method: 'POST', body: JSON.stringify({ name, mobile }) }),
  otpStart: (mobile: string) => request('/auth/otp/start', { method: 'POST', body: JSON.stringify({ mobile }) }),
  otpVerify: (mobile: string, code: string) => request('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ mobile, code }) }),
  checkout: (mobile: string, coupon?: string) => request('/payments/course', { method: 'POST', body: JSON.stringify({ mobile, coupon }) }),
}
