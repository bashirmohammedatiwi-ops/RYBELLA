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
      className={`hc-tile-item${index % 2 ? ' hc-tile-item--alt' : ''}`}
      style={{ '--tone-a': toneA, '--tone-b': toneB }}
    >
      <span className="hc-tile">
        <span className="hc-tile-icon">
          <CategoryIconVisual category={category} />
        </span>
      </span>
      <span className="hc-tile-name">{category.name}</span>
    </Link>
  )
}

function CategoryRow({ category, index }) {
  const imageUrl = category.image ? `${IMG_BASE}${category.image}` : null

  return (
    <Link
      to={`/explore?category=${category.id}`}
      className={`hc-row${imageUrl ? ' hc-row--has-image' : ''}${index % 2 ? ' hc-row--flip' : ''}`}
    >
      <span className="hc-row-media">
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" draggable={false} />
        ) : (
          <span className="hc-row-media-fallback" aria-hidden="true">
            <CategoryIconVisual category={category} />
          </span>
        )}
      </span>

      <span className="hc-row-body">
        <span className="hc-row-name">{category.name}</span>
        <span className="hc-row-arrow" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
      <section className="hc-tiles" aria-label="الأقسام">
        <div className="hc-tiles-track">
          {categories.map((c, i) => (
            <CategoryStripItem key={c.id} category={c} index={i} />
          ))}
          <Link to="/categories" className="hc-tile-item hc-tile-item--all hc-tile-item--alt">
            <span className="hc-tile hc-tile--all">
              <span className="hc-tile-icon hc-tile-icon--all">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="2" />
                  <rect x="14" y="3" width="7" height="7" rx="2" />
                  <rect x="3" y="14" width="7" height="7" rx="2" />
                  <rect x="14" y="14" width="7" height="7" rx="2" />
                </svg>
              </span>
            </span>
            <span className="hc-tile-name">الكل</span>
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="hc-section" aria-label="الأقسام">
      <header className="hc-section-head">
        <h2 className="hc-section-title">الأقسام</h2>
        <Link to="/categories" className="hc-section-link">عرض الكل</Link>
      </header>

      <div className="hc-list">
        {categories.map((c, i) => (
          <CategoryRow key={c.id} category={c} index={i} />
        ))}
      </div>
    </section>
  )
}
