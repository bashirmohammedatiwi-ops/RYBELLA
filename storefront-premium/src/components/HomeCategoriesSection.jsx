import { Link } from 'react-router-dom'
import CategoryIconVisual from './CategoryIconVisual'
import { CATEGORY_RING_TONES } from '../utils/categoryIcon'
import './HomeCategoriesSection.css'

function CategoryStripItem({ category, index, tone = 'light' }) {
  const [toneA, toneB] = CATEGORY_RING_TONES[index % CATEGORY_RING_TONES.length]

  return (
    <Link
      to={`/explore?category=${category.id}`}
      className={`home-cat-chip home-cat-chip--${tone}`}
      style={{ '--ring-a': toneA, '--ring-b': toneB }}
    >
      <span className="home-cat-chip-icon">
        <CategoryIconVisual category={category} />
      </span>
      <span className="home-cat-chip-name">{category.name}</span>
    </Link>
  )
}

function CategoryGridItem({ category, index }) {
  const [toneA, toneB] = CATEGORY_RING_TONES[index % CATEGORY_RING_TONES.length]

  return (
    <Link
      to={`/explore?category=${category.id}`}
      className="home-cat-tile"
      style={{ '--ring-a': toneA, '--ring-b': toneB }}
    >
      <span className="home-cat-tile-ring">
        <span className="home-cat-tile-icon">
          <CategoryIconVisual category={category} />
        </span>
      </span>
      <span className="home-cat-tile-text">
        <span className="home-cat-tile-name">{category.name}</span>
        {category.overlay_text?.trim() && (
          <span className="home-cat-tile-sub">{category.overlay_text.trim()}</span>
        )}
      </span>
    </Link>
  )
}

export default function HomeCategoriesSection({ categories = [], variant = 'section' }) {
  if (!categories.length) return null

  if (variant === 'header') {
    return (
      <nav className="home-cats-header" aria-label="الأقسام">
        <div className="home-cats-header-track">
          {categories.map((c, i) => (
            <CategoryStripItem key={c.id} category={c} index={i} tone="header" />
          ))}
          <Link to="/categories" className="home-cat-chip home-cat-chip--header home-cat-chip--all">
            <span className="home-cat-chip-icon home-cat-chip-icon--all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </span>
            <span className="home-cat-chip-name">الكل</span>
          </Link>
        </div>
      </nav>
    )
  }

  return (
    <section className="home-cats-section" aria-label="الأقسام الرئيسية">
      <header className="home-cats-section-head">
        <div>
          <span className="home-cats-section-eyebrow">الأقسام</span>
          <h2 className="home-cats-section-title">تسوقي حسب القسم</h2>
          <p className="home-cats-section-desc">كل الأقسام بأيقوناتها للوصول السريع.</p>
        </div>
        <Link to="/categories" className="home-cats-section-link">عرض الكل</Link>
      </header>

      <div className="home-cats-grid">
        {categories.map((c, i) => (
          <CategoryGridItem key={c.id} category={c} index={i} />
        ))}
      </div>
    </section>
  )
}
