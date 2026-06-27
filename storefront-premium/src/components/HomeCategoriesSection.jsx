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
      className="hc-top-item"
      style={{ '--glow-a': toneA, '--glow-b': toneB }}
    >
      <span className="hc-top-icon">
        <CategoryIconVisual category={category} />
      </span>
      <span className="hc-top-label">{category.name}</span>
    </Link>
  )
}

function CategoryRow({ category }) {
  const imageUrl = category.image ? `${IMG_BASE}${category.image}` : null

  return (
    <Link to={`/explore?category=${category.id}`} className="hc-bottom-card">
      <span className="hc-bottom-visual">
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" draggable={false} />
        ) : (
          <span className="hc-bottom-fallback" aria-hidden="true">
            <CategoryIconVisual category={category} />
          </span>
        )}
      </span>

      <span className="hc-bottom-footer">
        <span className="hc-bottom-name">{category.name}</span>
        <span className="hc-bottom-arrow" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </span>
    </Link>
  )
}

export default function HomeCategoriesSection({ categories = [], variant = 'section' }) {
  if (!categories.length) return null

  if (variant === 'strip') {
    return (
      <section className="hc-top" aria-label="الأقسام">
        <div className="hc-top-scroll">
          {categories.map((c, i) => (
            <CategoryStripItem key={c.id} category={c} index={i} />
          ))}
          <Link to="/categories" className="hc-top-item hc-top-item--all">
            <span className="hc-top-icon hc-top-icon--all">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </span>
            <span className="hc-top-label">الكل</span>
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="hc-bottom" aria-label="الأقسام">
      <header className="hc-bottom-head">
        <h2 className="hc-bottom-title">الأقسام</h2>
        <Link to="/categories" className="hc-bottom-link">عرض الكل</Link>
      </header>

      <div className="hc-bottom-list">
        {categories.map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </div>
    </section>
  )
}
