import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'
import './ExploreCategorySidebar.css'

const SIDEBAR_PREF_KEY = 'explore_sidebar_visible'

export function loadSidebarVisible() {
  try {
    const v = localStorage.getItem(SIDEBAR_PREF_KEY)
    if (v === '0') return false
    if (v === '1') return true
  } catch {
    /* ignore */
  }
  return true
}

export function saveSidebarVisible(visible) {
  try {
    localStorage.setItem(SIDEBAR_PREF_KEY, visible ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function SidebarIcon({ type }) {
  if (type === 'all') {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    )
  }
  if (type === 'sub-all') {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 12h10M12 7v10" />
      </svg>
    )
  }
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    </svg>
  )
}

function SidebarItem({ to, selected, compact, iconType, iconUrl, label }) {
  return (
    <Link
      to={to}
      className={`explore-rail-item${selected ? ' selected' : ''}${compact ? ' compact' : ''}`}
      aria-label={label}
      title={label}
    >
      <span className="explore-rail-item-ring">
        <span className="explore-rail-item-icon">
          {iconUrl ? (
            <img src={iconUrl} alt="" loading="lazy" />
          ) : (
            <SidebarIcon type={iconType} />
          )}
        </span>
      </span>
    </Link>
  )
}

function getCategoryIconUrl(category) {
  const src = category?.icon || category?.image
  if (!src || typeof src !== 'string') return null
  if (src.startsWith('http')) return src
  if (src.startsWith('/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(src)) {
    return `${IMG_BASE}${src}`
  }
  return null
}

export default function ExploreCategorySidebar({
  categories = [],
  subcategories = [],
  categoryId,
  subcategoryId,
  buildUrl,
  visible = true,
  fade = 1,
  onCollapse,
  onExpand,
}) {
  const showRail = visible && fade > 0.04
  const showExpand = !visible || fade < 0.05

  return (
    <>
      <aside
        className={`explore-category-rail${visible ? '' : ' collapsed'}`}
        style={{ opacity: fade, '--rail-fade': visible ? fade : 0 }}
        aria-hidden={!showRail}
      >
        {showRail && (
          <div className="explore-category-rail-inner">
            <div className="explore-category-rail-head">
              <span className="explore-category-rail-title">فئات</span>
              <button
                type="button"
                className="explore-category-rail-collapse"
                onClick={onCollapse}
                aria-label="إخفاء الفئات"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>

            <div className="explore-category-rail-scroll">
              <SidebarItem
                to={buildUrl({ category: null, subcategory: null })}
                selected={!categoryId}
                iconType="all"
                label="كل الفئات"
              />

              {categories.map((c) => (
                <SidebarItem
                  key={c.id}
                  to={buildUrl({ category: c.id, subcategory: null })}
                  selected={categoryId === String(c.id)}
                  iconUrl={getCategoryIconUrl(c)}
                  label={c.name}
                />
              ))}

              {categoryId && subcategories.length > 0 && (
                <>
                  <div className="explore-category-rail-divider" aria-hidden="true" />
                  <span className="explore-category-rail-label">فرعية</span>
                  <SidebarItem
                    to={buildUrl({ subcategory: null })}
                    selected={!subcategoryId}
                    compact
                    iconType="sub-all"
                    label="كل الفرعية"
                  />
                  {subcategories.map((sc) => (
                    <SidebarItem
                      key={sc.id}
                      to={buildUrl({ subcategory: sc.id })}
                      selected={subcategoryId === String(sc.id)}
                      compact
                      iconUrl={sc.image ? `${IMG_BASE}${sc.image}` : null}
                      label={sc.name}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </aside>

      {showExpand && (
        <button
          type="button"
          className="explore-category-rail-expand"
          onClick={onExpand}
          aria-label="عرض الفئات"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </>
  )
}
