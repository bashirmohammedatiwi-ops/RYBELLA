import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productsAPI, categoriesAPI, subcategoriesAPI, wishlistAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import MobileHeader from '../components/MobileHeader'
import ExploreCategorySidebar, { loadSidebarVisible, saveSidebarVisible } from '../components/ExploreCategorySidebar'
import './Explore.css'

const SIDEBAR_FADE_SCROLL_PX = 400
const RAIL_TRANSITION_MS = 520

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3
}

function setLayoutRailVars(layoutEl, { scrollFade, open, pinned }) {
  if (!layoutEl) return
  if (scrollFade != null) {
    layoutEl.style.setProperty('--rail-scroll-fade', scrollFade.toFixed(4))
    const prev = layoutEl.dataset.railScrolled === 'true'
    const next = prev ? scrollFade < 0.24 : scrollFade < 0.1
    layoutEl.dataset.railScrolled = next ? 'true' : 'false'
  }
  if (open != null) {
    layoutEl.style.setProperty('--rail-open', open ? '1' : '0')
    layoutEl.dataset.railOpen = open ? 'true' : 'false'
  }
  if (pinned != null) {
    layoutEl.dataset.railPinned = pinned ? 'true' : 'false'
  }
}

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [wishlistIds, setWishlistIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('')
  const [sidebarVisible, setSidebarVisible] = useState(loadSidebarVisible)
  const layoutRef = useRef(null)
  const mainScrollRef = useRef(null)
  const scrollFadeRef = useRef(1)
  const scrollFadeLockedRef = useRef(false)
  const scrollRafRef = useRef(null)
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

  const runRailTransition = useCallback((nextVisible) => {
    const layoutEl = layoutRef.current
    if (!layoutEl) return
    layoutEl.classList.add('rail-transitioning')
    setLayoutRailVars(layoutEl, { open: nextVisible })
    window.setTimeout(() => {
      layoutEl.classList.remove('rail-transitioning')
    }, RAIL_TRANSITION_MS)
  }, [])

  const handleSidebarCollapse = useCallback(() => {
    scrollFadeLockedRef.current = false
    setSidebarVisible(false)
    saveSidebarVisible(false)
    runRailTransition(false)
    const layoutEl = layoutRef.current
    if (layoutEl) {
      setLayoutRailVars(layoutEl, { pinned: false })
    }
  }, [runRailTransition])

  const handleSidebarExpand = useCallback(() => {
    scrollFadeLockedRef.current = true
    scrollFadeRef.current = 1

    setSidebarVisible(true)
    saveSidebarVisible(true)
    runRailTransition(true)

    const layoutEl = layoutRef.current
    if (layoutEl) {
      setLayoutRailVars(layoutEl, { scrollFade: 1, pinned: true })
    }
  }, [runRailTransition])

  const syncSidebarFade = useCallback(() => {
    if (scrollFadeLockedRef.current) return

    const scrollEl = mainScrollRef.current
    const layoutEl = layoutRef.current
    if (!scrollEl || !layoutEl) return

    const progress = Math.max(0, Math.min(1, scrollEl.scrollTop / SIDEBAR_FADE_SCROLL_PX))
    const next = easeOutCubic(1 - progress)

    if (Math.abs(scrollFadeRef.current - next) < 0.002) return
    scrollFadeRef.current = next
    setLayoutRailVars(layoutEl, { scrollFade: next, pinned: false })
  }, [])

  useEffect(() => {
    const layoutEl = layoutRef.current
    if (!layoutEl) return
    setLayoutRailVars(layoutEl, { open: sidebarVisible })
    syncSidebarFade()
  }, [sidebarVisible, syncSidebarFade])

  useEffect(() => {
    const scrollEl = mainScrollRef.current
    if (!scrollEl) return undefined

    syncSidebarFade()

    const onScroll = () => {
      if (scrollFadeLockedRef.current) {
        scrollFadeLockedRef.current = false
        const layoutEl = layoutRef.current
        if (layoutEl) {
          setLayoutRailVars(layoutEl, { pinned: false })
        }
      }

      if (scrollRafRef.current != null) return
      scrollRafRef.current = window.requestAnimationFrame(() => {
        syncSidebarFade()
        scrollRafRef.current = null
      })
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scrollEl.removeEventListener('scroll', onScroll)
      if (scrollRafRef.current != null) {
        window.cancelAnimationFrame(scrollRafRef.current)
      }
    }
  }, [syncSidebarFade])

  return (
    <div className="premium-explore">
      <MobileHeader title="المنتجات" showBack />

      <div
        ref={layoutRef}
        className="premium-explore-layout"
        data-rail-open={sidebarVisible ? 'true' : 'false'}
        data-rail-scrolled="false"
        data-rail-pinned="false"
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
          onCollapse={handleSidebarCollapse}
          onExpand={handleSidebarExpand}
        />
      </div>
    </div>
  )
}
