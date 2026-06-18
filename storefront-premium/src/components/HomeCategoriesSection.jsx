import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'
import './HomeCategoriesSection.css'

function getCategoryCover(c) {
  if (c.image) return `${IMG_BASE}${c.image}`
  const iconIsImage = c.icon && (c.icon.startsWith('/') || c.icon.startsWith('http') || /\.(png|jpg|jpeg|gif|webp)$/i.test(c.icon))
  if (iconIsImage) return `${IMG_BASE}${c.icon}`
  return null
}

function CategoryTile({ category }) {
  const cover = getCategoryCover(category)
  const overlay = category.overlay_text?.trim()

  return (
    <Link
      to={`/explore?category=${category.id}`}
      className={`home-cats-tile${cover ? '' : ' home-cats-tile--plain'}`}
    >
      <div className="home-cats-tile-media">
        {cover ? (
          <img src={cover} alt="" className="home-cats-tile-img" loading="lazy" />
        ) : (
          <div className="home-cats-tile-fallback" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2z" />
            </svg>
          </div>
        )}
        <div className="home-cats-tile-shine" aria-hidden="true" />
        <div className="home-cats-tile-gradient" aria-hidden="true" />
      </div>
      {overlay && <span className="home-cats-tile-badge">{overlay}</span>}
      <div className="home-cats-tile-footer">
        <span className="home-cats-tile-name">{category.name}</span>
        <span className="home-cats-tile-arrow" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </span>
      </div>
    </Link>
  )
}

function CategoryChip({ category }) {
  const cover = getCategoryCover(category)
  return (
    <Link to={`/explore?category=${category.id}`} className="home-cats-chip">
      <span className="home-cats-chip-thumb">
        {cover ? (
          <img src={cover} alt="" loading="lazy" />
        ) : (
          <span>{(category.name || '?').charAt(0)}</span>
        )}
      </span>
      <span className="home-cats-chip-label">{category.name}</span>
    </Link>
  )
}

export default function HomeCategoriesSection({ categories = [] }) {
  if (!categories.length) return null

  const gridCats = categories.slice(0, 4)
  const extraCats = categories.slice(4)
  const moreCount = extraCats.length

  return (
    <section className="home-cats" aria-label="الفئات الرئيسية">
      <div className="home-cats-shell">
        <div className="home-cats-glow home-cats-glow--a" aria-hidden="true" />
        <div className="home-cats-glow home-cats-glow--b" aria-hidden="true" />

        <header className="home-cats-head">
          <div>
            <h2 className="home-cats-title">الفئات الرئيسية</h2>
            <span className="home-cats-accent" aria-hidden="true" />
            <p className="home-cats-desc">
              {moreCount > 0
                ? `أربع فئات في الشبكة — و${moreCount} قسم إضافي`
                : 'اختاري قسمك من الشبكة أدناه'}
            </p>
          </div>
        </header>

        <Link to="/categories" className="home-cats-all-row">
          <span className="home-cats-all-icon" aria-hidden="true">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
          </span>
          <span className="home-cats-all-label">كل الفئات</span>
          <span className="home-cats-all-arrow" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </span>
        </Link>

        <div className={`home-cats-grid home-cats-grid--${Math.min(gridCats.length, 4)}`}>
          {gridCats.map((c) => (
            <CategoryTile key={c.id} category={c} />
          ))}
        </div>

        {moreCount > 0 && (
          <div className="home-cats-more">
            <p className="home-cats-more-label">أقسام أخرى</p>
            <div className="home-cats-more-track">
              {extraCats.map((c) => (
                <CategoryChip key={c.id} category={c} />
              ))}
            </div>
          </div>
        )}

        <Link to="/categories" className="home-cats-see-all">
          عرض الكل
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
