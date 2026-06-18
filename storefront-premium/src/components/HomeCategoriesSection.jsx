import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'

const ICON_SVG = {
  'face-woman-outline': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  'eye-outline': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  lipstick: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 22c-2 0-3-1-3-2 0-1 1-2 3-2s3 1 3 2c0 1-1 2-3 2z" />
      <path d="M9 18c-2 0-3-1-3-2V4c0-1 1-2 3-2s3 1 3 2v12c0 1-1 2-3 2z" />
    </svg>
  ),
  brush: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9.06 11.9L2 19l2.5-2.5 5.06-5.06" />
      <path d="M12 8l4-4 4 4-4 4" />
    </svg>
  ),
  'tag-outline': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    </svg>
  ),
  'view-grid-outline': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
}

const RING_COLORS = [
  '#E85D7A',
  '#A878FF',
  '#FF9862',
  '#58A6FF',
  '#4CAF78',
  '#FFC148',
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

  const visible = categories.slice(0, 14)
  const extra = categories.length - visible.length

  return (
    <div className="home-top-cats">
      <div className="home-top-cats-head">
        <h2 className="home-top-cats-title">الفئات</h2>
        <Link to="/categories" className="home-top-cats-all">الكل</Link>
      </div>

      <div className="home-top-cats-scroll">
        {visible.map((c, i) => {
          const iconUrl = getCategoryIconUrl(c)
          const namedIcon = getNamedIcon(c)
          const ring = RING_COLORS[i % RING_COLORS.length]

          return (
            <Link
              key={c.id}
              to={`/explore?category=${c.id}`}
              className="home-top-cat"
              style={{ '--cat-ring': ring }}
            >
              <span className="home-top-cat-ring">
                <span className="home-top-cat-icon">
                  {iconUrl ? (
                    <img src={iconUrl} alt="" loading="lazy" />
                  ) : (
                    namedIcon
                  )}
                </span>
              </span>
              <span className="home-top-cat-name">{c.name}</span>
            </Link>
          )
        })}

        {extra > 0 && (
          <Link to="/categories" className="home-top-cat home-top-cat-more">
            <span className="home-top-cat-ring">
              <span className="home-top-cat-icon home-top-cat-icon-more">
                +{extra}
              </span>
            </span>
            <span className="home-top-cat-name">المزيد</span>
          </Link>
        )}
      </div>
    </div>
  )
}
