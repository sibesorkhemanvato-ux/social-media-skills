import { Card } from '../components/ui'

export default function About({ go }) {
  return (
    <div className="stack">
      <Card className="about-hero">
        <div className="about-mark">🏢</div>
        <h2>مدیر ساختمان</h2>
        <p className="muted">سامانه‌ای ساده و شفاف برای مدیریت امور مشترک ساختمان</p>
        <p className="credit">طراحی و توسعه: <strong>مهدی رابطی</strong></p>
      </Card>
      <div className="grid-2">
        <Card title="راهنمای شروع سریع">
          <ol className="guide-list">
            <li>مشخصات، مسئولیت‌ها و گزارش مالی خود را در <button className="link" onClick={() => go('account')}>حساب من</button> ببینید.</li>
            <li><button className="link" onClick={() => go('units')}>واحدها و ساکنین</button> را بررسی و اطلاعات آن‌ها را تکمیل کنید.</li>
            <li>از بخش <button className="link" onClick={() => go('settings')}>پشتیبان و اطلاعات</button> مبالغ هزینه‌های ماهانه را وارد کنید.</li>
            <li>در <button className="link" onClick={() => go('charges')}>شارژ و پرداخت‌ها</button> صورتحساب ماه را برای همه واحدها صادر کنید.</li>
            <li>سرویس‌های انجام‌شده و موعد بعدی را در <button className="link" onClick={() => go('elevator')}>نگهداری آسانسور</button> پیگیری کنید.</li>
          </ol>
        </Card>
        <Card title="نحوه محاسبه شارژ">
          <p>هزینه‌های <strong>نظافت، آب، آسانسور، برق مشاعات و متفرقه</strong> با هم جمع و به تعداد واحدها تقسیم می‌شوند؛ بنابراین سهم همه واحدها، از جمله واحد خالی، برابر است.</p>
          <div className="formula">شارژ هر واحد = مجموع هزینه‌های مشترک ماهانه ÷ تعداد واحدها</div>
        </Card>
        <Card title="ذخیره و امنیت اطلاعات">
          <p>اطلاعات روی مرورگر همین دستگاه نگهداری می‌شود. برای جلوگیری از حذف ناخواسته، مرتباً از بخش تنظیمات فایل پشتیبان بگیرید.</p>
        </Card>
        <Card title="تصمیم‌گیری جمعی">
          <p>تغییر مبالغ شارژ و تصمیم‌های اصلی با رأی ساکنین انجام می‌شود. وضعیت رأی‌گیری‌های باز از منوی «رأی‌گیری‌ها» قابل مشاهده است.</p>
        </Card>
      </div>
    </div>
  )
}
