import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { productsAPI, categoriesAPI, subcategoriesAPI, brandsAPI, wishlistAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import MobileHeader from '../components/MobileHeader'
import ExploreCategorySidebar, { loadSidebarVisible, saveSidebarVisible } from '../components/ExploreCategorySidebar'
import './Explore.css'

const SIDEBAR_FADE_SCROLL_PX = 280

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [brands, setBrands] = useState([])
  const [filterTags, setFilterTags] = useState([])
  const [wishlistIds, setWishlistIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('')
  const [sidebarVisible, setSidebarVisible] = useState(loadSidebarVisible)
  const [sidebarFade, setSidebarFade] = useState(1)
  const mainScrollRef = useRef(null)
  const { user } = useAuth()

  const categoryId = searchParams.get('category')
  const subcategoryId = searchParams.get('subcategory')
  const brandId = searchParams.get('brand')
  const tagFilter = searchParams.get('tag')
  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')
  const search = searchParams.get('search')
  const featured = searchParams.get('featured')

  useEffect(() => {
    setSortBy(searchParams.get('sort') || '')
  }, [searchParams])

  useEffect(() => {
    productsAPI.getFilters()
      .then((r) => setFilterTags(r?.data?.tags || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!searchParams.has('color')) return
    const p = new URLSearchParams(searchParams)
    p.delete('color')
    setSearchParams(p, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (categoryId) params.category_id = categoryId
    if (subcategoryId) params.subcategory_id = subcategoryId
    if (brandId) params.brand_id = brandId
    if (tagFilter) params.tags = tagFilter
    if (minPrice) params.min_price = minPrice
    if (maxPrice) params.max_price = maxPrice
    if (search) params.search = search
    if (featured) params.featured = '1'
    if (sortBy) params.sort_by = sortBy

    productsAPI.getAll(params)
      .then((r) => setProducts(r?.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [categoryId, subcategoryId, brandId, tagFilter, minPrice, maxPrice, search, featured, sortBy])

  useEffect(() => {
    categoriesAPI.getAll().then((r) => setCategories(r?.data || [])).catch(() => [])
    brandsAPI.getAll().then((r) => setBrands(r?.data || [])).catch(() => [])
  }, [])

  useEffect(() => {
    if (!user) return
    wishlistAPI.getAll().then((r) => {
      const ids = (r?.data || []).map((p) => p.product_id || p.id)
      setWishlistIds(ids)
    }).catch(() => {})
  }, [user])

  const toggleWishlist = (productId) => {
    if (!user) return
    if (wishlistIds.includes(productId)) {
      wishlistAPI.remove(productId).then(() => setWishlistIds((prev) => prev.filter((id) => id !== productId)))
    } else {
      wishlistAPI.add(productId).then(() => setWishlistIds((prev) => [...prev, productId]))
    }
  }

  useEffect(() => {
    subcategoriesAPI.getAll({ category_id: categoryId || undefined })
      .then((r) => setSubcategories(r?.data || []))
      .catch(() => [])
  }, [categoryId])

  const buildUrl = (overrides = {}) => {
    const p = new URLSearchParams(searchParams)
    Object.entries(overrides).forEach(([k, v]) => {
      if (!v) p.delete(k)
      else p.set(k, v)
    })
    return '/explore' + (p.toString() ? '?' + p.toString() : '')
  }

  const applyPriceRange = () => {
    const min = document.getElementById('filter-min-price')?.value
    const max = document.getElementById('filter-max-price')?.value
    const p = new URLSearchParams(searchParams)
    if (min) p.set('min_price', min); else p.delete('min_price')
    if (max) p.set('max_price', max); else p.delete('max_price')
    setSearchParams(p)
  }

  const handleSidebarCollapse = useCallback(() => {
    setSidebarVisible(false)
    saveSidebarVisible(false)
  }, [])

  const handleSidebarExpand = useCallback(() => {
    setSidebarVisible(true)
    saveSidebarVisible(true)
  }, [])

  const syncSidebarFade = useCallback(() => {
    const el = mainScrollRef.current
    if (!el) return
    const next = Math.max(0, Math.min(1, 1 - el.scrollTop / SIDEBAR_FADE_SCROLL_PX))
    setSidebarFade((prev) => (Math.abs(prev - next) > 0.002 ? next : prev))
  }, [])

  useEffect(() => {
    const el = mainScrollRef.current
    if (!el) return undefined
    syncSidebarFade()
    el.addEventListener('scroll', syncSidebarFade, { passive: true })
    return () => el.removeEventListener('scroll', syncSidebarFade)
  }, [syncSidebarFade])

  const railFade = sidebarVisible ? sidebarFade : 0
  const railOpen = sidebarVisible && sidebarFade > 0.05

  return (
    <div className="premium-explore">
      <MobileHeader title="المنتجات" showBack />

      <div
        className="premium-explore-layout"
        style={{ '--rail-fade': railFade }}
        data-rail-open={railOpen ? 'true' : 'false'}
      >
        <div className="premium-explore-main" ref={mainScrollRef}>
          <div className="premium-explore-main-inner">
            <div className="premium-explore-hero">
              <p className="premium-explore-eyebrow">
                <span>المتجر</span>
                <span className="premium-explore-eyebrow-dot" aria-hidden="true" />
                <span className="premium-explore-eyebrow-brand">Rybella</span>
              </p>
              <h1 className="premium-explore-page-title">المنتجات</h1>
              {featured && (
                <span className="premium-explore-featured-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l1.8 5.5H19l-4.5 3.3 1.7 5.2L12 14.8 7.8 16l1.7-5.2L5 7.5h5.2L12 2z" />
                  </svg>
                  تشكيلة مميزة
                </span>
              )}
            </div>

            <div className="premium-explore-filters">
              <div className="premium-explore-filters-head">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="10" y1="18" x2="14" y2="18" />
                </svg>
                تصفية سريعة
              </div>

              <div className="premium-explore-pills">
                <Link
                  to={buildUrl({ brand: null, tag: null })}
                  className={!brandId && !tagFilter ? 'active' : ''}
                >
                  الكل
                </Link>
                {brands.slice(0, 12).map((b) => (
                  <Link
                    key={b.id}
                    to={buildUrl({ brand: b.id })}
                    className={brandId === String(b.id) ? 'active' : ''}
                  >
                    {b.name}
                  </Link>
                ))}
              </div>

              {filterTags.length > 0 && (
                <div className="premium-explore-pills premium-explore-pills--tags">
                  <Link to={buildUrl({ tag: null })} className={!tagFilter ? 'active' : ''}>كل العلامات</Link>
                  {filterTags.slice(0, 10).map((t) => (
                    <Link key={t} to={buildUrl({ tag: t })} className={tagFilter === t ? 'active' : ''}>{t}</Link>
                  ))}
                </div>
              )}

              <div className="premium-explore-price-row">
                <input
                  id="filter-min-price"
                  type="number"
                  placeholder="من"
                  min="0"
                  defaultValue={minPrice}
                  className="premium-price-input"
                />
                <input
                  id="filter-max-price"
                  type="number"
                  placeholder="إلى"
                  min="0"
                  defaultValue={maxPrice}
                  className="premium-price-input"
                />
                <button type="button" className="premium-price-btn" onClick={applyPriceRange}>تطبيق</button>
                {(minPrice || maxPrice) && (
                  <Link to={buildUrl({ min_price: null, max_price: null })} className="premium-explore-clear-price">
                    مسح
                  </Link>
                )}
              </div>
            </div>

            <div className="premium-explore-header">
              <p className="premium-explore-count">
                {loading ? '...' : `${products.length} منتج`}
              </p>
              <select
                value={sortBy}
                onChange={(e) => {
                  const v = e.target.value
                  setSortBy(v)
                  const p = new URLSearchParams(searchParams)
                  if (v) p.set('sort', v); else p.delete('sort')
                  setSearchParams(p)
                }}
                className="premium-sort-select"
              >
                <option value="">ترتيب افتراضي</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
                <option value="newest">الأحدث</option>
              </select>
            </div>

            {loading ? (
              <div className="premium-loading">جاري التحميل...</div>
            ) : products.length === 0 ? (
              <div className="premium-empty">لا توجد منتجات.</div>
            ) : (
              <div className="premium-products-grid">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    wishlistIds={wishlistIds}
                    onWishlistToggle={user ? toggleWishlist : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <ExploreCategorySidebar
          categories={categories}
          subcategories={subcategories}
          categoryId={categoryId}
          subcategoryId={subcategoryId}
          buildUrl={buildUrl}
          visible={sidebarVisible}
          fade={sidebarFade}
          onCollapse={handleSidebarCollapse}
          onExpand={handleSidebarExpand}
        />
      </div>
    </div>
  )
}
