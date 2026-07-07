import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import CategoryIconVisual from './CategoryIconVisual'
import { CATEGORY_RING_TONES } from '../utils/categoryIcon'
import { IMG_BASE } from '../services/api'
import './ExploreCategoryBar.css'

function CategoryItem({ to, selected, label, category, index }) {
  const ref = useRef(null)
  const [toneA, toneB] = CATEGORY_RING_TONES[(index ?? 0) % CATEGORY_RING_TONES.length]

  useEffect(() => {
    if (!selected || !ref.current) return
    ref.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selected])

  return (
    <Link
      ref={ref}
      to={to}
      className={`explore-cat-item${selected ? ' selected' : ''}`}
      style={{ '--glow-a': toneA, '--glow-b': toneB }}
      aria-current={selected ? 'page' : undefined}
    >
      <span className="explore-cat-icon">
        {category ? (
          <CategoryIconVisual category={category} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        )}
      </span>
      <span className="explore-cat-label">{label}</span>
    </Link>
  )
}

function SubcategoryPill({ to, selected, label, image }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!selected || !ref.current) return
    ref.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selected])

  return (
    <Link
      ref={ref}
      to={to}
      className={`explore-subcat-pill${selected ? ' selected' : ''}`}
      aria-current={selected ? 'page' : undefined}
    >
      {image && (
        <span className="explore-subcat-pill-img">
          <img src={`${IMG_BASE}${image}`} alt="" loading="lazy" />
        </span>
      )}
      <span>{label}</span>
    </Link>
  )
}

export default function ExploreCategoryBar({
  categories = [],
  subcategories = [],
  categoryId,
  subcategoryId,
  buildUrl,
}) {
  const showSubcategories = Boolean(categoryId && subcategories.length > 0)

  return (
    <nav className="explore-cat-bar" aria-label="أقسام المنتجات">
      <div className="explore-cat-scroll">
        <CategoryItem
          to={buildUrl({ category: null, subcategory: null })}
          selected={!categoryId}
          label="الكل"
        />
        {categories.map((c, i) => (
          <CategoryItem
            key={c.id}
            to={buildUrl({ category: c.id, subcategory: null })}
            selected={categoryId === String(c.id)}
            label={c.name}
            category={c}
            index={i}
          />
        ))}
      </div>

      {showSubcategories && (
        <div className="explore-subcat-scroll">
          <SubcategoryPill
            to={buildUrl({ subcategory: null })}
            selected={!subcategoryId}
            label="كل الفرعية"
          />
          {subcategories.map((sc) => (
            <SubcategoryPill
              key={sc.id}
              to={buildUrl({ subcategory: sc.id })}
              selected={subcategoryId === String(sc.id)}
              label={sc.name}
              image={sc.image}
            />
          ))}
        </div>
      )}
    </nav>
  )
}
