import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productsAPI, categoriesAPI, brandsAPI, subcategoriesAPI } from '../services/api'
import ProductCard from '../components/ProductCard'
import './Explore.css'

export default function Explore() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '')
  const [subcategoryId, setSubcategoryId] = useState(searchParams.get('subcategory') || '')
  const [brandId, setBrandId] = useState(searchParams.get('brand') || searchParams.get('brand_id') || '')
  const [featured, setFeatured] = useState(searchParams.get('featured') === '1')

  useEffect(() => {
    categoriesAPI.getAll().then((r) => setCategories(r?.data || [])).catch(() => [])
    brandsAPI.getAll().then((r) => setBrands(r?.data || [])).catch(() => [])
  }, [])

  useEffect(() => {
    if (categoryId) {
      subcategoriesAPI.getAll({ category_id: categoryId }).then((r) => setSubcategories(r?.data || [])).catch(() => setSubcategories([]))
      setSubcategoryId('')
    } else setSubcategories([])
  }, [categoryId])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (categoryId) params.category_id = categoryId
    if (subcategoryId) params.subcategory_id = subcategoryId
    if (brandId) params.brand_id = brandId
    if (featured) params.featured = '1'
    productsAPI.getAll(params)
      .then((r) => setProducts(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [search, categoryId, subcategoryId, brandId, featured])

  return (
    <div className="explore">
      <h1 className="explore-title">استكشف المنتجات</h1>
      {/* Filter bar - inspired by BuyMore */}
      <div className="filter-bar">
        <div className="filter-search">
          <input
            type="search"
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-row">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="filter-select">
            <option value="">كل الفئات</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {categoryId && (
            <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} className="filter-select">
              <option value="">كل الفئات الثانوية</option>
              {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="filter-select">
            <option value="">كل العلامات</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <label className="filter-check">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            مميز
          </label>
        </div>
      </div>
      {loading ? (
        <div className="loading">جاري التحميل...</div>
      ) : (
        <div className="products-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
      {!loading && products.length === 0 && (
        <p className="empty-msg">لا توجد منتجات</p>
      )}
    </div>
  )
}
