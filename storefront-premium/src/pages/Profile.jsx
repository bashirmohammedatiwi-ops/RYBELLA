import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import MobileHeader from '../components/MobileHeader'
import { PushEnableButton } from '../components/PushPermissionPrompt'
import './Profile.css'

const MENU_ITEMS = [
  {
    to: '/orders',
    label: 'طلباتي',
    desc: 'تتبّع حالة طلباتك',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    to: '/notifications',
    label: 'الإشعارات',
    desc: 'عروض وتنبيهات الطلبات',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    to: '/wishlist',
    label: 'المفضلة',
    desc: 'منتجاتك المحفوظة',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    to: '/privacy-policy',
    label: 'سياسة الخصوصية',
    desc: 'شروط الاستخدام والخصوصية',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
]

export default function Profile() {
  const { user, logout } = useAuth()
  const displayName = user?.name || 'مستخدم'
  const initial = (user?.name || user?.phone || '?').charAt(0).toUpperCase()

  return (
    <div className="premium-profile">
      <MobileHeader title="حسابي" showBack={false} showCart={false} />

      <div className="premium-profile-body">
        <section className="premium-profile-hero" aria-label="معلومات الحساب">
          <div className="premium-profile-avatar" aria-hidden="true">
            {initial}
          </div>
          <div className="premium-profile-hero-text">
            <p className="premium-profile-eyebrow">مرحباً</p>
            <h1 className="premium-profile-name">{displayName}</h1>
            {user?.phone && (
              <p className="premium-profile-phone" dir="ltr">{user.phone}</p>
            )}
          </div>
        </section>

        <nav className="premium-profile-menu" aria-label="قائمة الحساب">
          {MENU_ITEMS.map((item) => (
            <Link key={item.to} to={item.to} className="premium-profile-menu-item">
              <span className="premium-profile-menu-icon">{item.icon}</span>
              <span className="premium-profile-menu-copy">
                <span className="premium-profile-menu-label">{item.label}</span>
                <span className="premium-profile-menu-desc">{item.desc}</span>
              </span>
              <span className="premium-profile-menu-arrow" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </span>
            </Link>
          ))}
        </nav>

        <section className="premium-profile-push-card" aria-label="إشعارات الهاتف">
          <div className="premium-profile-push-head">
            <span className="premium-profile-push-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </span>
            <div>
              <h2 className="premium-profile-push-title">إشعارات الهاتف</h2>
              <p className="premium-profile-push-desc">تنبيهات فورية للطلبات والعروض</p>
            </div>
          </div>
          <PushEnableButton className="premium-profile-push" />
        </section>

        <button type="button" className="premium-profile-logout" onClick={logout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          تسجيل الخروج
        </button>
      </div>
    </div>
  )
}
