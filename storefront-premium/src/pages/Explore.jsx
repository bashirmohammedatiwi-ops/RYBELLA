import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { productsAPI, categoriesAPI, wishlistAPI } from '../services/api'
import { isBarcodeLikeQuery } from '../utils/barcode'
import { searchByBarcode } from '../utils/barcodeSearch'
import BarcodeScanner from '../components/BarcodeScanner'
import BarcodeScanButton from '../components/BarcodeScanButton'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import MobileHeader from '../components/MobileHeader'
import ExploreCategoryBar from '../components/ExploreCategoryBar'
import './Explore.css'

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [wishlistIds, setWishlistIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const mainScrollRef = useRef(null)
  const { user } = useAuth()

  const categoryId = searchParams.get('category')
  const brandId = searchParams.get('brand')
  const tagFilter = searchParams.get('tag')
  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')
  const search = searchParams.get('search')
  const featured = searchParams.get('featured')

  useEffect(() => {
    setSearchInput(searchParams.get('search') || '')
    setSortBy(searchParams.get('sort') || '')
  }, [searchParams])

  useEffect(() => {
    if (!searchParams.has('color')) return
    const p = new URLSearchParams(searchParams)
    p.delete('color')
    setSearchParams(p, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!searchParams.has('subcategory')) return
    const p = new URLSearchParams(searchParams)
    p.delete('subcategory')
    setSearchParams(p, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (categoryId) params.category_id = categoryId
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
  }, [categoryId, brandId, tagFilter, minPrice, maxPrice, search, featured, sortBy])

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
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [categoryId, brandId, tagFilter, minPrice, maxPrice, search, featured, sortBy])

  const buildUrl = (overrides = {}) => {
    const p = new URLSearchParams(searchParams)
    Object.entries(overrides).forEach(([k, v]) => {
      if (!v) p.delete(k)
      else p.set(k, v)
    })
    return '/explore' + (p.toString() ? '?' + p.toString() : '')
  }

  const handleExploreSearch = async (e) => {
    e?.preventDefault?.()
    const q = searchInput.trim()
    if (!q) {
      const p = new URLSearchParams(searchParams)
      p.delete('search')
      setSearchParams(p)
      return
    }
    if (isBarcodeLikeQuery(q)) {
      await searchByBarcode(navigate, q, {
        onExploreSearch: (code) => {
          const p = new URLSearchParams(searchParams)
          p.set('search', code)
          setSearchParams(p)
        },
      })
      return
    }
    const p = new URLSearchParams(searchParams)
    p.set('search', q)
    setSearchParams(p)
  }

  const handleBarcodeDetected = async (code) => {
    setScannerOpen(false)
    setSearchInput(code)
    await searchByBarcode(navigate, code, {
      onExploreSearch: (value) => {
        const p = new URLSearchParams(searchParams)
        p.set('search', value)
        setSearchParams(p)
      },
    })
  }

  return (
    <div className="premium-explore">
      <div className="premium-explore-top">
        <MobileHeader title="المنتجات" showBack />
        <ExploreCategoryBar
          categories={categories}
          categoryId={categoryId}
          buildUrl={buildUrl}
        />
      </div>

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

          <form className="premium-explore-search" onSubmit={handleExploreSearch}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحثي بالاسم، الوصف، البراند، الدرجة، أو الباركود..."
              inputMode="search"
              autoComplete="off"
            />
            <BarcodeScanButton className="barcode-scan-btn--explore" onClick={() => setScannerOpen(true)} />
            <button type="submit">بحث</button>
          </form>

          <BarcodeScanner
            open={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onDetected={handleBarcodeDetected}
          />

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
            <div className="premium-empty">
              {search ? `لا توجد نتائج لـ "${search}"` : 'لا توجد منتجات.'}
            </div>
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
    </div>
  )
}
