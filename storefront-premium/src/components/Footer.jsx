import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer({ settings }) {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const showNewsletter = settings?.newsletter_enabled !== '0'
  const badges = Array.isArray(settings?.trust_badges) ? settings.trust_badges : []

  const handleNewsletter = (e) => {
    e.preventDefault()
    if (email.trim()) setSubscribed(true)
  }

  return (
    <footer className="rybella-footer">
      {showNewsletter && (
        <div className="rybella-footer-newsletter">
          <h3>اشتركي في نشرتنا!</h3>
          <p className="rybella-newsletter-intro">كوني أول من يعرف عن العروض والمنتجات الجديدة. ما ينتظرك:</p>
          <ul className="rybella-newsletter-benefits">
            <li><strong>خصومات حصرية:</strong> كود خصم 10% لكِ</li>
            <li><strong>هدية مفاجأة:</strong> مع أول طلبك</li>
            <li><strong>أخبار أولاً:</strong> أحدث المنتجات والعروض</li>
          </ul>
          {subscribed ? (
            <p className="rybella-newsletter-done">شكراً لاشتراكك!</p>
          ) : (
            <form onSubmit={handleNewsletter}>
              <input
                type="email"
                placeholder="بريدك الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit">اشتراك</button>
            </form>
          )}
        </div>
      )}
      {badges.length > 0 && (
        <div className="rybella-footer-badges">
          {badges.map((b, i) => (
            <span key={i} className="rybella-badge">
              <span className="rybella-badge-icon">{b.icon === 'truck' ? '🚚' : b.icon === 'shield' ? '🛡️' : b.icon === 'gift' ? '🎁' : b.icon === 'refresh' ? '↻' : '✓'}</span>
              {b.text}
            </span>
          ))}
        </div>
      )}
      <div className="rybella-footer-main">
        <div className="rybella-footer-about">
          <h4>{settings?.site_title || 'Rybella'}</h4>
          <p>{settings?.footer_about || 'الجمال الذي تستحقينه'}</p>
          {settings?.footer_phone && <p>📞 {settings.footer_phone}</p>}
          {settings?.footer_email && <p>✉ {settings.footer_email}</p>}
        </div>
        <div className="rybella-footer-links">
          <Link to="/explore">المنتجات</Link>
          <Link to="/categories">الفئات</Link>
          <Link to="/brands">العلامات</Link>
          <Link to="/cart">السلة</Link>
        </div>
      </div>
      <div className="rybella-footer-bottom">
        © {new Date().getFullYear()} {settings?.site_title || 'Rybella'}. جميع الحقوق محفوظة.
      </div>
    </footer>
  )
}
