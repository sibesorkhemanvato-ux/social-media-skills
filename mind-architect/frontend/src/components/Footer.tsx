type FooterProps = { onNavigate: (path: string) => void }

export function Footer({ onNavigate }: FooterProps) {
  const navigate = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    event.preventDefault()
    onNavigate(path)
  }
  return (
    <footer className="site-footer">
      <div className="container footer__top">
        <div>
          <a href="/" className="brand brand--footer" onClick={(event) => navigate(event, '/')}><span className="brand__mark">م</span><span>معمار ذهن</span></a>
          <p className="footer__note">دوره معمار ذهن با مهدی رابطی</p>
        </div>
        <div className="footer__links">
          <a href="/course" onClick={(event) => navigate(event, '/course')}>دوره</a>
          <a href="/webinar" onClick={(event) => navigate(event, '/webinar')}>وبینار رایگان</a>
          <a href="/about" onClick={(event) => navigate(event, '/about')}>درباره مهدی</a>
        </div>
        <div className="footer__contact">
          <span>تماس: [شماره تماس]</span>
          <span>شبکه‌ها: [آدرس شبکه‌های اجتماعی]</span>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>همکار محتوایی: محتوای نو</span>
        <span>© [سال] مهدی رابطی</span>
      </div>
    </footer>
  )
}
