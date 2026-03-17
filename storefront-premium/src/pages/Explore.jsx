import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { productsAPI, categoriesAPI, subcategoriesAPI, brandsAPI, wishlistAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import MobileHeader from '../components/MobileHeader'
import './Explore.css'

export default function Explore() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [brands, setBrands] = useState([])
  const [wishlistIds, setWishlistIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('')
  const { user } = useAuth()

  const categoryId = searchParams.get('category')
  const subcategoryId = searchParams.get('subcategory')
  const brandId = searchParams.get('brand')
  const search = searchParams.get('search')
  const featured = searchParams.get('featured')

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (categoryId) params.category_id = categoryId
    if (subcategoryId) params.subcategory_id = subcategoryId
    if (brandId) params.brand_id = brandId
    if (search) params.search = search
    if (featured) params.featured = '1'
    if (sortBy) params.sort_by = sortBy

    productsAPI.getAll(params)
      .then((r) => setProducts(r?.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [categoryId, subcategoryId, brandId, search, featured, sortBy])

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
          <h3>العلامات</h3>
          <Link to={buildUrl({ brand: null })} className={!brandId ? 'active' : ''}>الكل</Link>
          {brands.map((b) => (
            <Link key={b.id} to={buildUrl({ brand: b.id })} className={brandId === String(b.id) ? 'active' : ''}>
              {b.name}
            </Link>
          ))}
        </div>
      </div>
      <div className="premium-explore-main">
        <div className="premium-explore-header">
          <h1>استكشف المنتجات</h1>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="premium-sort-select">
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
