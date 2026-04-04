import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categoriesAPI, IMG_BASE } from '../services/api'
import './Categories.css'

const iconSvg = {
  'face-woman-outline': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  'eye-outline': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  'lipstick': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 22c-2 0-3-1-3-2 0-1 1-2 3-2s3 1 3 2c0 1-1 2-3 2z" />
      <path d="M9 18c-2 0-3-1-3-2V4c0-1 1-2 3-2s3 1 3 2v12c0 1-1 2-3 2z" />
    </svg>
  ),
  'brush': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.06 11.9L2 19l2.5-2.5 5.06-5.06" />
      <path d="M12 8l4-4 4 4-4 4" />
    </svg>
  ),
  'tag-outline': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    </svg>
  ),
  'view-grid-outline': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
}

function CategoryCard({ item, imgUrl, iconUrl, onPress }) {
  const iconIsImage = item.icon && (item.icon.startsWith('/') || item.icon.startsWith('http') || /\.(png|jpg|jpeg|gif|webp)$/i.test(item.icon))
  const iconName = !iconUrl && item.icon && item.icon.trim() ? item.icon.trim() : 'tag-outline'
  const hasOverlayText = item.overlay_text && item.overlay_text.trim()

  return (
    <Link to={`/explore?category=${item.id}`} className={`cat-card ${imgUrl ? 'has-image' : ''}`} onClick={onPress}>
      <div className="cat-card-inner">
        {imgUrl ? (
          <>
            <img src={imgUrl} alt="" className="cat-card-image" />
            <div className="cat-card-overlay" />
          </>
        ) : (
          <div className="cat-card-gradient" />
        )}
        <div className="cat-card-content">
          <div className="cat-card-top">
            <div className={`cat-icon-badge ${imgUrl ? 'light' : ''}`}>
              {iconUrl ? (
                <img src={iconUrl} alt="" className="cat-icon-img" />
              ) : (
                iconSvg[iconName] || (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                  </svg>
                )
              )}
            </div>
            {hasOverlayText && (
              <span className={`cat-overlay-text ${!imgUrl ? 'solid' : ''}`}>{item.overlay_text.trim()}</span>
            )}
          </div>
          <div className="cat-card-bottom">
            <span className={`cat-card-name ${imgUrl ? 'light' : ''}`}>{item.name}</span>
            <span className="cat-arrow-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function Categories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    categoriesAPI.getAll()
      .then((r) => setCategories(r?.data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="categories-page">
        <div className="categories-header">
          <div className="categories-skeleton" style={{ width: 60, height: 16 }} />
          <div className="categories-skeleton" style={{ width: 40, height: 12, marginTop: 8 }} />
        </div>
        <div className="categories-list">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="categories-skeleton-card" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="categories-page">
      <div className="categories-header">
        <button className="categories-back-btn" onClick={() => navigate(-1)} aria-label="رجوع">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="categories-header-text">
          <h1 className="categories-title">الفئات</h1>
          <span className="categories-subtitle">{categories.length} تصنيف</span>
        </div>
      </div>

      <div className="categories-list">
        {categories.length === 0 ? (
          <div className="categories-empty">
            <div className="categories-empty-icon">✨</div>
            <p className="categories-empty-title">لا توجد فئات</p>
            <p className="categories-empty-text">أضف فئات من لوحة التحكم</p>
          </div>
        ) : (
          categories.map((c) => {
            const iconIsImg = c.icon && (c.icon.startsWith('/') || c.icon.startsWith('http') || /\.(png|jpg|jpeg|gif|webp)$/i.test(c.icon))
            const iconUrl = iconIsImg ? `${IMG_BASE}${c.icon}` : null
            return (
              <CategoryCard
                key={c.id}
                item={c}
                imgUrl={c.image ? `${IMG_BASE}${c.image}` : null}
                iconUrl={iconUrl}
                onPress={() => {}}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
