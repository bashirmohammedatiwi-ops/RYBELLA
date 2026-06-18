import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'
import './HomeCategoriesSection.css'

const ICON_SVG = {
  'face-woman-outline': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  'eye-outline': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  lipstick: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 22c-2 0-3-1-3-2 0-1 1-2 3-2s3 1 3 2c0 1-1 2-3 2z" />
      <path d="M9 18c-2 0-3-1-3-2V4c0-1 1-2 3-2s3 1 3 2v12c0 1-1 2-3 2z" />
    </svg>
  ),
  brush: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9.06 11.9L2 19l2.5-2.5 5.06-5.06" />
      <path d="M12 8l4-4 4 4-4 4" />
    </svg>
  ),
  'tag-outline': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    </svg>
  ),
  'view-grid-outline': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
}

const RING_TONES = [
  ['#E85D7A', '#F08FA6'],
  ['#D14A66', '#FF9EC0'],
  ['#C94A5A', '#E85D7A'],
  ['#E85D7A', '#FFB3C6'],
]

function isIconImage(icon) {
  if (!icon || typeof icon !== 'string') return false
  return icon.startsWith('/') || icon.startsWith('http') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(icon)
}

function getCategoryIconUrl(category) {
  const icon = category?.icon
  if (!isIconImage(icon)) return null
  if (icon.startsWith('http')) return icon
  return `${IMG_BASE}${icon}`
}

function getNamedIcon(category) {
  const icon = category?.icon?.trim()
  if (!icon || isIconImage(icon)) return null
  return ICON_SVG[icon] || ICON_SVG['tag-outline']
}

export default function HomeCategoriesSection({ categories = [] }) {
  if (!categories.length) return null

  return (
    <section className="home-cats" aria-label="الفئات">
      <div className="home-cats-bg" aria-hidden="true" />
      <div className="home-cats-glow home-cats-glow--a" aria-hidden="true" />
      <div className="home-cats-glow home-cats-glow--b" aria-hidden="true" />

      <div className="home-cats-inner">
        <header className="home-cats-head">
          <div className="home-cats-head-text">
            <span className="home-cats-eyebrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              تسوقي حسب القسم
            </span>
            <h2 className="home-cats-title">الفئات</h2>
            <span className="home-cats-accent" aria-hidden="true" />
          </div>
          <Link to="/categories" className="home-cats-all-btn">
            عرض الكل
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
        </header>

        <div className="home-cats-track-wrap">
          <div className="home-cats-track">
            {categories.map((c, i) => {
              const iconUrl = getCategoryIconUrl(c)
              const namedIcon = getNamedIcon(c)
              const [toneA, toneB] = RING_TONES[i % RING_TONES.length]

              return (
                <Link
                  key={c.id}
                  to={`/explore?category=${c.id}`}
                  className="home-cat-item"
                  style={{ '--ring-a': toneA, '--ring-b': toneB }}
                >
                  <span className="home-cat-item-ring">
                    <span className="home-cat-item-icon">
                      {iconUrl ? (
                        <img src={iconUrl} alt="" loading="lazy" />
                      ) : (
                        namedIcon
                      )}
                    </span>
                  </span>
                  <span className="home-cat-item-name">{c.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
