import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productsAPI, categoriesAPI, bannersAPI, IMG_BASE } from '../services/api'
import ProductCard from '../components/ProductCard'
import './Home.css'

export default function Home() {
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState([])
  const [banners, setBanners] = useState([])
  const [featured, setFeatured] = useState([])
  const [popular, setPopular] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    categoriesAPI.getAll().then((r) => setCategories(r?.data || [])).catch(() => [])
    bannersAPI.getAll().then((r) => setBanners(r?.data || [])).catch(() => [])
    productsAPI.getAll({ featured: '1' }).then((r) => setFeatured(r?.data?.slice(0, 8) || [])).catch(() => [])
    productsAPI.getAll().then((r) => setPopular(r?.data?.slice(0, 6) || [])).catch(() => [])
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(search ? `/explore?search=${encodeURIComponent(search)}` : '/explore')
  }

  return (
    <div className="home">
      {/* Hero - inspired by child.com */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">تسوق التجميل بفرح</h1>
          <p className="hero-subtitle">اكتشفي تشكيلة واسعة من مستحضرات التجميل الأصلية</p>
          <form onSubmit={handleSearch} className="hero-search">
            <input
              type="search"
              placeholder="ابحثي..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="hero-search-input"
            />
            <button type="submit" className="hero-search-btn">بحث</button>
          </form>
        </div>
      </section>

      {/* Select Categories - inspired by child.com */}
      <section className="section">
        <div className="section-header">
          <h2>اختر الفئات</h2>
          <Link to="/categories" className="show-all">عرض الكل</Link>
        </div>
        <div className="categories-grid">
          {categories.slice(0, 10).map((c) => (
            <Link key={c.id} to={`/explore?category=${c.id}`} className="category-card">
              {c.image ? (
                <img src={`${IMG_BASE}${c.image}`} alt="" className="category-icon" />
              ) : (
                <span className="category-emoji">✨</span>
              )}
              <span className="category-name">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Banners - if any */}
      {banners.length > 0 && (
        <section className="section">
          <div className="banners-row">
            {banners.slice(0, 2).map((b) => (
              <div key={b.id} className="banner-card">
                {b.image && (
                  <img src={`${IMG_BASE}${b.image}`} alt={b.title} />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Most Popular - inspired by child.com */}
      <section className="section">
        <div className="section-header">
          <h2>الأكثر شعبية</h2>
          <Link to="/explore" className="show-all">عرض الكل</Link>
        </div>
        <div className="products-scroll">
          {popular.map((p) => (
            <div key={p.id} className="product-scroll-item">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="section">
        <div className="section-header">
          <h2>المنتجات المميزة</h2>
          <Link to="/explore?featured=1" className="show-all">عرض الكل</Link>
        </div>
        <div className="products-grid">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  )
}
