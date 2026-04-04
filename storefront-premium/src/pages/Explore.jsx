import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { productsAPI, categoriesAPI, subcategoriesAPI, brandsAPI, wishlistAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import MobileHeader from '../components/MobileHeader'
import './Explore.css'

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [brands, setBrands] = useState([])
  const [filterTags, setFilterTags] = useState([])
  const [filterColors, setFilterColors] = useState([])
  const [wishlistIds, setWishlistIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('')
  const { user } = useAuth()

  const categoryId = searchParams.get('category')
  const subcategoryId = searchParams.get('subcategory')
  const brandId = searchParams.get('brand')
  const tagFilter = searchParams.get('tag')
  const colorFilter = searchParams.get('color')
  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')
  const search = searchParams.get('search')
  const featured = searchParams.get('featured')

  useEffect(() => {
    setSortBy(searchParams.get('sort') || '')
  }, [searchParams])

  useEffect(() => {
    productsAPI.getFilters()
      .then((r) => {
        setFilterTags(r?.data?.tags || [])
        setFilterColors(r?.data?.colors || [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (categoryId) params.category_id = categoryId
    if (subcategoryId) params.subcategory_id = subcategoryId
    if (brandId) params.brand_id = brandId
    if (tagFilter) params.tags = tagFilter
    if (colorFilter) params.color_code = colorFilter
    if (minPrice) params.min_price = minPrice
    if (maxPrice) params.max_price = maxPrice
    if (search) params.search = search
    if (featured) params.featured = '1'
    if (sortBy) params.sort_by = sortBy

    productsAPI.getAll(params)
      .then((r) => setProducts(r?.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [categoryId, subcategoryId, brandId, tagFilter, colorFilter, minPrice, maxPrice, search, featured, sortBy])

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

  return (
    <div className="premium-explore">
      <MobileHeader title="المنتجات" showBack />
      <div className="premium-explore-sidebar">
        <div className="premium-filter-block">
          <h3>الفئات</h3>
          <Link to={buildUrl({ category: null })} className={!categoryId ? 'active' : ''}>الكل</Link>
          {categories.map((c) => (
            <Link key={c.id} to={buildUrl({ category: c.id })} className={categoryId === String(c.id) ? 'active' : ''}>
              {c.name}
            </Link>
          ))}
        </div>
        {subcategories.length > 0 && (
          <div className="premium-filter-block">
            <h3>النوع</h3>
            <Link to={buildUrl({ subcategory: null })} className={!subcategoryId ? 'active' : ''}>الكل</Link>
            {subcategories.map((sc) => (
              <Link key={sc.id} to={buildUrl({ subcategory: sc.id })} className={subcategoryId === String(sc.id) ? 'active' : ''}>
                {sc.name}
              </Link>
            ))}
          </div>
        )}
        <div className="premium-filter-block">
          <h3>العلامات التجارية</h3>
          <Link to={buildUrl({ brand: null })} className={!brandId ? 'active' : ''}>الكل</Link>
          {brands.map((b) => (
            <Link key={b.id} to={buildUrl({ brand: b.id })} className={brandId === String(b.id) ? 'active' : ''}>
              {b.name}
            </Link>
          ))}
        </div>
        {filterTags.length > 0 && (
          <div className="premium-filter-block">
            <h3>العلامات</h3>
            <Link to={buildUrl({ tag: null })} className={!tagFilter ? 'active' : ''}>الكل</Link>
            {filterTags.map((t) => (
              <Link key={t} to={buildUrl({ tag: t })} className={tagFilter === t ? 'active' : ''}>{t}</Link>
            ))}
          </div>
        )}
        {filterColors.length > 0 && (
          <div className="premium-filter-block">
            <h3>درجات الألوان</h3>
            <Link to={buildUrl({ color: null })} className={!colorFilter ? 'active' : ''}>الكل</Link>
            <div className="premium-color-filters">
              {filterColors.map((c) => (
                <Link
                  key={c.code + c.name}
                  to={buildUrl({ color: c.code })}
                  className={`premium-color-swatch ${colorFilter === c.code ? 'active' : ''}`}
                  title={c.name}
                  style={{ backgroundColor: c.code }}
                />
              ))}
            </div>
          </div>
        )}
        <div className="premium-filter-block">
          <h3>نطاق السعر</h3>
          <div className="premium-price-range">
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
          </div>
        </div>
      </div>
      <div className="premium-explore-main">
        <div className="premium-explore-mobile-filters">
          {filterTags.length > 0 && (
            <div className="premium-mobile-filter-group">
              <span className="premium-mobile-filter-label">العلامات:</span>
              <Link to={buildUrl({ tag: null })} className={!tagFilter ? 'active' : ''}>الكل</Link>
              {filterTags.slice(0, 5).map((t) => (
                <Link key={t} to={buildUrl({ tag: t })} className={tagFilter === t ? 'active' : ''}>{t}</Link>
              ))}
            </div>
          )}
          {filterColors.length > 0 && (
            <div className="premium-mobile-filter-group">
              <span className="premium-mobile-filter-label">الألوان:</span>
              <Link to={buildUrl({ color: null })} className={!colorFilter ? 'active' : ''}>الكل</Link>
              {filterColors.slice(0, 8).map((c) => (
                <Link
                  key={c.code + c.name}
                  to={buildUrl({ color: c.code })}
                  className={`premium-mobile-chip premium-color-chip ${colorFilter === c.code ? 'active' : ''}`}
                  title={c.name}
                  style={{ backgroundColor: c.code }}
                />
              ))}
            </div>
          )}
          {(minPrice || maxPrice) && (
            <Link to={buildUrl({ min_price: null, max_price: null })} className="premium-mobile-chip">
              مسح السعر
            </Link>
          )}
        </div>
        <div className="premium-explore-header">
          <h1>استكشف المنتجات</h1>
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
              <ProductCard key={p.id} product={p} wishlistIds={wishlistIds} onWishlistToggle={user ? toggleWishlist : undefined} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
