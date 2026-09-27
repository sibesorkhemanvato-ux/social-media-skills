# پل امن بازوی بله

این Cloudflare Worker بین PWA عمومی و API بازوی بله قرار می‌گیرد. **توکن بازو نباید در Vite، HTML، JavaScript، `localStorage`، فایل پشتیبان یا GitHub قرار بگیرد.**

## معماری امنیتی

- `BALE_BOT_TOKEN` فقط Cloudflare Secret است.
- `BALE_WEBHOOK_SECRET` فقط Cloudflare Secret است و در مسیر تصادفی وب‌هوک استفاده می‌شود.
- مرورگر با کد ۸ رقمی، یک کلید محدود مخصوص همان گفت‌وگو می‌گیرد؛ این کلید توکن بازو نیست.
- کد اتصال ۱۰ دقیقه اعتبار دارد و بعد از استفاده حذف می‌شود.
- CORS فقط مبدأ GitHub Pages برنامه را قبول می‌کند.
- هر کلید فقط می‌تواند به همان گفت‌وگوی متصل پیام بفرستد و از داخل برنامه قابل لغو است.
- KV با نام `BALE_CONNECTIONS` هنگام نخستین deploy به‌صورت خودکار ساخته می‌شود.

## استقرار توسط مالک سرویس

این مرحله به ورود به حساب شخصی Cloudflare و ساخت بازو در `@botfather` بله نیاز دارد و قابل انجام با کد عمومی یا GitHub Pages نیست.

```bash
cd building-manager/bale-worker
npm ci
npx wrangler login
npm run deploy
npx wrangler secret put BALE_BOT_TOKEN
npx wrangler secret put BALE_WEBHOOK_SECRET

BALE_BOT_TOKEN='...' \
BALE_WEBHOOK_SECRET='...' \
BALE_WORKER_URL='https://building-manager-bale.<account>.workers.dev' \
npm run setup-webhook
```

بعد از استقرار، آدرس عمومی Worker و نام کاربری بازو (این دو **محرمانه نیستند**) هنگام build برنامه تنظیم می‌شوند:

```bash
VITE_BALE_BRIDGE_URL='https://building-manager-bale.<account>.workers.dev' \
VITE_BALE_BOT_USERNAME='building_manager_bot' \
npm run build
```

برای محیط محلی می‌توان این دو مقدار عمومی را در `building-manager/.env.local` قرار داد. این فایل توسط Git نادیده گرفته می‌شود.

## Secrets لازم

| نام | محل نگهداری | عمومی؟ |
|---|---|---|
| `BALE_BOT_TOKEN` | Cloudflare Secret | خیر |
| `BALE_WEBHOOK_SECRET` | Cloudflare Secret | خیر |
| `VITE_BALE_BRIDGE_URL` | تنظیم build برنامه | بله |
| `VITE_BALE_BOT_USERNAME` | تنظیم build برنامه | بله |

هرگز مقدار دو Secret اول را در issue، پیام، commit، متغیر `VITE_*` یا GitHub Actions log قرار ندهید.
