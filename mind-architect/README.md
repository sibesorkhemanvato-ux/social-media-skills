# وب‌سایت «معمار ذهن»

MVP فارسی و RTL برای فروش دوره و ثبت‌نام وبینار رایگان مهدی رابطی.

## ساختار

- `frontend/` — React + TypeScript + Vite، صفحات `/`، `/course`، `/webinar` و `/about`
- `backend/` — FastAPI، مرزهای API برای لید وبینار، OTP کاوه‌نگار و پرداخت شخصی

## اجرای محلی

### فرانت‌اند

```bash
cd mind-architect/frontend
npm install
npm run dev
```

### بک‌اند

```bash
cd mind-architect/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Vite درخواست‌های `/api` را به FastAPI پورت ۸۰۰۰ پروکسی می‌کند؛ در نتیجه مرورگر هرگز به `localhost` متصل نمی‌شود.

## پیش از انتشار

1. مقادیر اصلی `KAVENEGAR_API_KEY` و `KAVENEGAR_TEMPLATE` را فقط در محیط استقرار قرار دهید.
2. آدرس، کلید، قرارداد درخواست و callback درگاه شخصی را بدهید؛ آداپتر پرداخت عمداً تا آن زمان عمومی/حدسی پیاده نشده است.
3. `MONGODB_URI` را روی دیتابیس MongoDB عملیاتی تنظیم کنید. در نبود آن، API فقط برای پیش‌نمایش از حافظه استفاده می‌کند.
4. متغیر `APP_ENV=production` و `ALLOWED_ORIGINS` را روی دامنه نهایی تنظیم کنید.
5. جای‌نگهدارهای محتوایی، تصویرهای واقعی کتاب‌ها و تصاویر معرفی را با دارایی‌های تأییدشده جایگزین کنید.
