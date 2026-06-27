import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'
import CategoryIconVisual from './CategoryIconVisual'
import { CATEGORY_RING_TONES } from '../utils/categoryIcon'
import './HomeCategoriesSection.css'

function CategoryStripItem({ category, index }) {
  const [toneA, toneB] = CATEGORY_RING_TONES[index % CATEGORY_RING_TONES.length]

  return (
    <Link
      to={`/explore?category=${category.id}`}
      className="hc-chip"
      style={{ '--ring-a': toneA, '--ring-b': toneB }}
    >
      <span className="hc-chip-ring">
        <CategoryIconVisual category={category} />
      </span>
      <span className="hc-chip-label">{category.name}</span>
    </Link>
  )
}

function CategoryImageCard({ category, index }) {
  const imageUrl = category.image ? `${IMG_BASE}${category.image}` : null
  const label = category.overlay_text?.trim() || category.name

  return (
    <Link
      to={`/explore?category=${category.id}`}
      className={`hc-card${imageUrl ? ' hc-card--has-image' : ''}`}
      style={{ '--hc-i': index }}
    >
      <span className="hc-card-media">
        {imageUrl ? (
          <img src={imageUrl} alt={category.name} loading="lazy" draggable={false} />
        ) : (
          <span className="hc-card-fallback" aria-hidden="true">
            {category.name?.slice(0, 1) || 'R'}
          </span>
        )}
        <span className="hc-card-overlay" aria-hidden="true" />
        <span className="hc-card-shine" aria-hidden="true" />
      </span>
      <span className="hc-card-body">
        <span className="hc-card-name">{label}</span>
        {category.overlay_text?.trim() && category.overlay_text.trim() !== category.name && (
          <span className="hc-card-sub">{category.name}</span>
        )}
      </span>
      <span className="hc-card-arrow" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  )
}

export default function HomeCategoriesSection({ categories = [], variant = 'section' }) {
  if (!categories.length) return null

  if (variant === 'header') {
    return (
      <nav className="hc-strip" aria-label="الأقسام السريعة">
        <div className="hc-strip-track">
          {categories.map((c, i) => (
            <CategoryStripItem key={c.id} category={c} index={i} />
          ))}
          <Link to="/categories" className="hc-chip hc-chip--all">
            <span className="hc-chip-ring hc-chip-ring--all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </span>
            <span className="hc-chip-label">الكل</span>
          </Link>
        </div>
      </nav>
    )
  }

  return (
    <section className="hc-section" aria-label="الأقسام الرئيسية">
      <div className="hc-section-bg" aria-hidden="true">
        <span className="hc-section-glow" />
      </div>

      <header className="hc-section-head">
        <div>
          <span className="hc-section-eyebrow">الأقسام</span>
          <h2 className="hc-section-title">اختاري عالمكِ</h2>
          <p className="hc-section-desc">كل قسم بصورته — تصفّحي بسهولة واكتشفي ما يناسبك.</p>
        </div>
        <Link to="/categories" className="hc-section-link">عرض الكل</Link>
      </header>

      <div className="hc-grid">
        {categories.map((c, i) => (
          <CategoryImageCard key={c.id} category={c} index={i} />
        ))}
      </div>
    </section>
  )
}
