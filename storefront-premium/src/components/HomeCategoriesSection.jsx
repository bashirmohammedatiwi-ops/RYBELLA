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
      style={{ '--tone-a': toneA, '--tone-b': toneB, '--hc-i': index }}
    >
      <span className="hc-chip-box">
        <span className="hc-chip-shine" aria-hidden="true" />
        <span className="hc-chip-icon">
          <CategoryIconVisual category={category} />
        </span>
      </span>
      <span className="hc-chip-label">{category.name}</span>
    </Link>
  )
}

function CategoryRow({ category, index }) {
  const imageUrl = category.image ? `${IMG_BASE}${category.image}` : null

  return (
    <Link
      to={`/explore?category=${category.id}`}
      className={`hc-row${imageUrl ? ' hc-row--has-image' : ''}`}
      style={imageUrl ? { '--hc-img': `url("${imageUrl}")` } : { '--hc-i': index }}
    >
      <span className="hc-row-overlay" aria-hidden="true" />
      <span className="hc-row-content">
        <span className="hc-row-name">{category.name}</span>
        <span className="hc-row-arrow" aria-hidden="true">
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
      <section className="hc-strip" aria-label="الأقسام">
        <div className="hc-strip-inner">
          <div className="hc-strip-scroll">
            {categories.map((c, i) => (
              <CategoryStripItem key={c.id} category={c} index={i} />
            ))}
            <Link to="/categories" className="hc-chip hc-chip--all">
              <span className="hc-chip-box hc-chip-box--all">
                <span className="hc-chip-icon hc-chip-icon--all">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="2" />
                    <rect x="14" y="3" width="7" height="7" rx="2" />
                    <rect x="3" y="14" width="7" height="7" rx="2" />
                    <rect x="14" y="14" width="7" height="7" rx="2" />
                  </svg>
                </span>
              </span>
              <span className="hc-chip-label">الكل</span>
            </Link>
          </div>
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
