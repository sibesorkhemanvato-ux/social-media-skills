import { useEffect, useState } from 'react'
import { AuthDialog } from './components/AuthDialog'
import { Button } from './components/Button'
import { CheckIcon } from './components/Icons'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { HeroScene } from './components/HeroScene'
import { WebinarForm } from './components/WebinarForm'
import { api } from './lib/api'
import { books, coursePromise, faqs, modules, siteUrl } from './lib/content'
import { Seo } from './lib/seo'

type Route = '/' | '/course' | '/webinar' | '/about'

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'معمار ذهن',
  url: siteUrl,
  founder: { '@type': 'Person', name: 'مهدی رابطی' },
}

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'مهدی رابطی',
  jobTitle: 'نویسنده و سخنران',
  description: 'بنیان‌گذار متد I.U.X.A',
  url: `${siteUrl}/about`,
}

const courseSchema = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'دوره معمار ذهن',
  description: coursePromise,
  provider: { '@type': 'Organization', name: 'معمار ذهن', url: siteUrl },
  instructor: { '@type': 'Person', name: 'مهدی رابطی' },
  inLanguage: 'fa',
  offers: { '@type': 'Offer', price: '3000000', priceCurrency: 'IRR', availability: 'https://schema.org/LimitedAvailability' },
}

function breadcrumb(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: `${siteUrl}${item.path}` })),
  }
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })),
}

function useRoute() {
  const initial = (window.location.pathname.replace(/\/$/, '') || '/') as Route
  const [route, setRoute] = useState<Route>(['/', '/course', '/webinar', '/about'].includes(initial) ? initial : '/')
  useEffect(() => {
    const listen = () => {
      const path = (window.location.pathname.replace(/\/$/, '') || '/') as Route
      setRoute(['/', '/course', '/webinar', '/about'].includes(path) ? path : '/')
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    window.addEventListener('popstate', listen)
    return () => window.removeEventListener('popstate', listen)
  }, [])
  const navigate = (path: string) => {
    const next = path as Route
    window.history.pushState({}, '', next)
    setRoute(next)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  return { route, navigate }
}

function PageShell({ children, onLogin, onNavigate }: { children: React.ReactNode; onLogin: () => void; onNavigate: (path: string) => void }) {
  return <>
    <a className="skip-link" href="#main">رفتن به محتوای اصلی</a>
    <Header onLogin={onLogin} onNavigate={onNavigate} />
    <main id="main">{children}</main>
    <Footer onNavigate={onNavigate} />
  </>
}

function HomePage({ navigate }: { navigate: (path: string) => void }) {
  return <>
    <Seo title="دوره معمار ذهن | مهدی رابطی | تعیین مسیر زندگی" description="دوره معمار ذهن مهدی رابطی برای تعیین مسیر زندگی؛ ثبت‌نام وبینار رایگان و آشنایی با متد I.U.X.A." path="/" jsonLd={[organizationSchema, personSchema, courseSchema, faqSchema, breadcrumb([{ name: 'خانه', path: '/' }])]} />
    <section className="hero section">
      <div className="container hero__grid">
        <div className="hero__content">
          <p className="eyebrow">دوره ۸ هفته‌ای با مهدی رابطی</p>
          <h1>«{coursePromise}»</h1>
          <p className="hero__subtitle">هر هفته یک ویدیوی کوتاه ۱۵ تا ۲۰ دقیقه‌ای و یک کارگاه زنده ۹۰ دقیقه‌ای</p>
          <Button href="/webinar" onClick={(event) => { event.preventDefault(); navigate('/webinar') }}>ثبت‌نام وبینار رایگان</Button>
        </div>
        <HeroScene />
      </div>
    </section>

    <section className="section issue-section" aria-labelledby="issue-title">
      <div className="container narrow">
        <p className="eyebrow">مسئله</p>
        <h2 id="issue-title">نردبانی تکیه‌داده به دیوار اشتباه</h2>
        <div className="issue-copy">
          <p>ممکن است از نردبانی بالا بروی که به دیوار اشتباهی تکیه داده شده است.</p>
          <p>مسیر را ادامه می‌دهی، اما درونت هنوز از انتخاب آن مطمئن نیست.</p>
          <p>مسئله، سرعت بالا رفتن نیست؛ انتخاب دیوار و آزادیِ ایستادن پای آن است.</p>
        </div>
      </div>
    </section>

    <section className="section method-section" aria-labelledby="method-title">
      <div className="container">
        <div className="section-heading">
          <div><p className="eyebrow">روش I.U.X.A</p><h2 id="method-title">چهار نقطه برای دیدن مسیر</h2></div>
          <p className="section-heading__aside">بنیان‌گذار متد I.U.X.A: مهدی رابطی</p>
        </div>
        <div className="method-grid">
          <article className="method-card"><span className="method-card__letter">I</span><h3>جهت و معنا</h3></article>
          <article className="method-card"><span className="method-card__letter">U</span><h3>جهان در دسترس</h3></article>
          <article className="method-card"><span className="method-card__letter">X</span><h3>ناشناخته‌ها</h3></article>
          <article className="method-card"><span className="method-card__letter">A</span><h3>نگرش</h3></article>
        </div>
      </div>
    </section>

    <section className="section book-course-section" aria-labelledby="book-course-title">
      <div className="container book-course">
        <div className="metaphor-graphic" aria-hidden="true"><span className="metaphor-graphic__disc" /><span className="metaphor-graphic__handle" /><span className="metaphor-graphic__spade" /></div>
        <div>
          <p className="eyebrow">فلزیاب و بیل</p>
          <h2 id="book-course-title">کتاب، نشان‌دادن است؛ دوره، اجرا.</h2>
          <p>کتاب مکمل دوره است، نه پیش‌نیاز آن. کتاب مسیر را نشان می‌دهد و دوره برای اجرا کردن است.</p>
          <Button href="/course" variant="secondary" onClick={(event) => { event.preventDefault(); navigate('/course') }}>دیدن جزئیات دوره</Button>
        </div>
      </div>
    </section>

    <ProgramSection />
    <AboutExcerpt navigate={navigate} />
    <CertificateSection />
    <PricingSection navigate={navigate} />
    <FaqSection />
  </>
}

function ProgramSection() {
  return <section className="section program-section" aria-labelledby="program-title">
    <div className="container">
      <p className="eyebrow">برنامه ۸ هفته‌ای</p>
      <h2 id="program-title">از انتخاب تا ماندگاری</h2>
      <ol className="timeline">
        {modules.map((module, index) => <li key={module.week} className="timeline__item">
          <span className="timeline__index">۰{index + 1}</span>
          <div><p className="timeline__week">{module.week}</p><h3>{module.title}</h3><p>{module.detail}</p></div>
        </li>)}
      </ol>
    </div>
  </section>
}

function AboutExcerpt({ navigate }: { navigate: (path: string) => void }) {
  return <section className="section about-excerpt" aria-labelledby="about-title">
    <div className="container about-excerpt__grid">
      <div className="about-excerpt__bio">
        <p className="eyebrow">درباره مهدی</p>
        <h2 id="about-title">مهدی رابطی، نویسنده و سخنران</h2>
        <p>مدرس: مهدی رابطی، نویسنده و سخنران. بنیان‌گذار متد I.U.X.A</p>
        <p>سابقه سخنرانی: برج میلاد، دانشگاه شریف، امیرکبیر، تهران</p>
        <p>امتیاز ۴.۵ کتابراه — [تصویر امتیاز کتابراه]</p>
        <Button href="/about" variant="secondary" onClick={(event) => { event.preventDefault(); navigate('/about') }}>درباره مهدی</Button>
      </div>
      <div className="book-row" aria-label="شش کتاب مهدی رابطی">
        {books.map((book, index) => <BookCover key={book} title={book} index={index} />)}
      </div>
    </div>
  </section>
}

function BookCover({ title, index }: { title: string; index: number }) {
  return <figure className={`book-cover book-cover--${index + 1}`}>
    <div className="book-cover__spine" aria-hidden="true" />
    <div className="book-cover__art" aria-hidden="true"><span /></div>
    <figcaption>{title}<span>[جلد کتاب]</span></figcaption>
  </figure>
}

function CertificateSection() {
  return <section className="section certificate-section" aria-labelledby="certificate-title">
    <div className="container certificate-card">
      <div className="certificate-mark" aria-hidden="true">FIC</div>
      <div><p className="eyebrow">گواهی</p><h2 id="certificate-title">مدرک FIC آلمان</h2><p>صدور گواهی FIC آلمان اختیاری است و هزینه آن جداگانه تعیین می‌شود.</p></div>
    </div>
  </section>
}

function PricingSection({ navigate }: { navigate: (path: string) => void }) {
  return <section className="section pricing-section" aria-labelledby="pricing-title">
    <div className="container pricing-card">
      <p className="eyebrow">اولین دوره</p>
      <h2 id="pricing-title">معمار ذهن</h2>
      <p className="pricing-card__price">۳ میلیون <span>تومان</span></p>
      <p>ظرفیت اولین دوره: ۳۰ نفر</p>
      <Button href="/course" onClick={(event) => { event.preventDefault(); navigate('/course') }}>خرید دوره</Button>
    </div>
  </section>
}

function FaqSection() {
  return <section className="section faq-section" aria-labelledby="faq-title">
    <div className="container narrow">
      <p className="eyebrow">سوالات متداول</p>
      <h2 id="faq-title">شفاف، پیش از تصمیم</h2>
      <div className="faq-list">{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>)}</div>
    </div>
  </section>
}

function CoursePage({ navigate }: { navigate: (path: string) => void }) {
  return <>
    <Seo title="دوره معمار ذهن | مهدی رابطی | تعیین مسیر زندگی" description="دوره معمار ذهن مهدی رابطی برای تعیین مسیر زندگی؛ ۸ هفته و کارگاه زنده با متد I.U.X.A." path="/course" jsonLd={[courseSchema, faqSchema, breadcrumb([{ name: 'خانه', path: '/' }, { name: 'دوره معمار ذهن', path: '/course' }])]} />
    <section className="page-hero section">
      <div className="container narrow"><p className="eyebrow">دوره معمار ذهن</p><h1>«{coursePromise}»</h1><p>۸ هفته. هر هفته یک ویدیوی کوتاه ۱۵ تا ۲۰ دقیقه‌ای و یک کارگاه زنده ۹۰ دقیقه‌ای</p></div>
    </section>
    <section className="section course-layout">
      <div className="container course-layout__grid">
        <div><ProgramSection /><CertificateSection /></div>
        <CheckoutCard />
      </div>
    </section>
    <section className="section"><div className="container narrow"><FaqSection /></div></section>
    <section className="section quiet-cta"><div className="container narrow"><h2>پیش از خرید، می‌توانی در وبینار رایگان ثبت‌نام کنی.</h2><Button href="/webinar" onClick={(event) => { event.preventDefault(); navigate('/webinar') }}>ثبت‌نام وبینار رایگان</Button></div></section>
  </>
}

function CheckoutCard() {
  const [mobile, setMobile] = useState('')
  const [coupon, setCoupon] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const purchase = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!/^09\d{9}$/.test(mobile)) { setState('error'); setMessage('شماره موبایل را به‌صورت ۰۹xxxxxxxxx وارد کنید.'); return }
    setState('loading')
    try {
      const response = await api.checkout(mobile, coupon || undefined)
      setState('success'); setMessage(response.message)
      if (response.payment_url) window.location.assign(response.payment_url)
    } catch (error) {
      setState('error'); setMessage(error instanceof Error ? error.message : 'خطا در شروع پرداخت')
    }
  }
  return <aside className="checkout-card" aria-label="خرید دوره">
    <p className="eyebrow">ثبت‌نام</p><h2>معمار ذهن</h2><p className="checkout-card__price">۳ میلیون تومان</p>
    <ul><li><CheckIcon />۸ هفته</li><li><CheckIcon />ویدیو کوتاه هفتگی</li><li><CheckIcon />کارگاه زنده هفتگی</li><li><CheckIcon />ظرفیت اولین دوره: ۳۰ نفر</li></ul>
    <form onSubmit={purchase} noValidate>
      <label htmlFor="purchase-mobile">شماره موبایل</label>
      <input id="purchase-mobile" inputMode="numeric" dir="ltr" placeholder="09123456789" value={mobile} onChange={(event) => setMobile(event.target.value.replace(/[^0-9]/g, ''))} autoComplete="tel" />
      <label htmlFor="coupon">کد تخفیف ۷۲ ساعته</label>
      <input id="coupon" type="text" placeholder="[کد تخفیف]" value={coupon} onChange={(event) => setCoupon(event.target.value)} />
      <Button type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'در حال اتصال' : 'ادامه به پرداخت'}</Button>
    </form>
    <p className="checkout-card__gateway">[نشانی و کلید درگاه پرداخت]</p>
    {message && <p className={`form-message form-message--${state === 'error' ? 'error' : state === 'success' ? 'success' : 'info'}`} role="status">{message}</p>}
  </aside>
}

function WebinarPage() {
  return <>
    <Seo title="وبینار معمار ذهن | مهدی رابطی | تعیین مسیر زندگی" description="ثبت‌نام وبینار رایگان دوره معمار ذهن مهدی رابطی؛ آشنایی با تعیین مسیر زندگی و متد I.U.X.A." path="/webinar" jsonLd={[organizationSchema, breadcrumb([{ name: 'خانه', path: '/' }, { name: 'وبینار رایگان', path: '/webinar' }])]} />
    <section className="webinar-page section"><div className="container webinar-page__grid">
      <div><p className="eyebrow">وبینار پنج‌بخشی رایگان</p><h1>از نردبان تا انتخاب آزادی</h1><p>آشنایی با دوره معمار ذهن و متد I.U.X.A با مهدی رابطی.</p><div className="webinar-page__lines"><span>۵ بخش</span><span>ثبت‌نام با نام و شماره موبایل</span></div></div>
      <div className="webinar-page__form"><h2>ثبت‌نام وبینار رایگان</h2><WebinarForm /></div>
    </div></section>
  </>
}

function AboutPage() {
  return <>
    <Seo title="مهدی رابطی | دوره معمار ذهن و تعیین مسیر زندگی" description="معرفی مهدی رابطی، نویسنده و سخنران، و کتاب‌های مکمل دوره معمار ذهن برای تعیین مسیر زندگی." path="/about" jsonLd={[organizationSchema, personSchema, breadcrumb([{ name: 'خانه', path: '/' }, { name: 'درباره مهدی', path: '/about' }])]} />
    <section className="page-hero section"><div className="container narrow"><p className="eyebrow">درباره مهدی</p><h1>مهدی رابطی، نویسنده و سخنران</h1><p>بنیان‌گذار متد I.U.X.A</p></div></section>
    <section className="section about-page"><div className="container">
      <div className="about-page__facts"><div><span>کتاب‌ها</span><strong>۶ کتاب مکمل</strong></div><div><span>امتیاز</span><strong>۴.۵ کتابراه</strong></div><div><span>سخنرانی</span><strong>برج میلاد، دانشگاه شریف، امیرکبیر، تهران</strong></div></div>
      <h2>کتاب‌های مکمل</h2>
      <div className="book-grid">{books.map((book, index) => <BookCover title={book} index={index} key={book} />)}</div>
    </div></section>
  </>
}

export default function App() {
  const { route, navigate } = useRoute()
  const [authOpen, setAuthOpen] = useState(false)
  let page: React.ReactNode
  if (route === '/course') page = <CoursePage navigate={navigate} />
  else if (route === '/webinar') page = <WebinarPage />
  else if (route === '/about') page = <AboutPage />
  else page = <HomePage navigate={navigate} />
  return <PageShell onLogin={() => setAuthOpen(true)} onNavigate={navigate}>{page}{authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}</PageShell>
}
