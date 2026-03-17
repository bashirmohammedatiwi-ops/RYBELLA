import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productsAPI, categoriesAPI, subcategoriesAPI, bannersAPI, offersAPI, brandsAPI, webSettingsAPI, wishlistAPI, IMG_BASE } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useRecentlyViewed } from '../context/RecentlyViewedContext'
import ProductCard from '../components/ProductCard'
import QuickView from '../components/QuickView'
import './Home.css'

export default function Home() {
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [banners, setBanners] = useState([])
  const [brands, setBrands] = useState([])
  const [offers, setOffers] = useState([])
  const [featured, setFeatured] = useState([])
  const [popular, setPopular] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [wishlistIds, setWishlistIds] = useState([])
  const [settings, setSettings] = useState(null)
  const [quickViewId, setQuickViewId] = useState(null)
  const [recentProducts, setRecentProducts] = useState([])
  const [bannerIdx, setBannerIdx] = useState(0)
  const bannerRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { totalCount } = useCart()
  const { recentIds } = useRecentlyViewed()

  useEffect(() => {
    const toArr = (d) => (Array.isArray(d) ? d : d?.data && Array.isArray(d.data) ? d.data : [])
    Promise.all([
      categoriesAPI.getAll().then((r) => toArr(r?.data)).catch(() => []),
      subcategoriesAPI.getAll().then((r) => toArr(r?.data)).catch(() => []),
      bannersAPI.getAll().then((r) => toArr(r?.data)).catch(() => []),
      brandsAPI.getAll().then((r) => toArr(r?.data)).catch(() => []),
      offersAPI.getAll().then((r) => toArr(r?.data)).catch(() => []),
      productsAPI.getAll({ featured: '1' }).then((r) => toArr(r?.data)).catch(() => []),
      productsAPI.getAll().then((r) => toArr(r?.data)).catch(() => []),
    ]).then(([cats, subcats, bns, brs, offs, feat, pop]) => {
      setCategories(cats)
      setSubcategories(subcats)
      setBanners(bns)
      setBrands(brs)
      setOffers(offs)
      setFeatured(feat.slice(0, 10))
      setPopular(pop)
      setBestSellers(pop.filter((p) => p.is_best_seller).slice(0, 10))
    })
    webSettingsAPI.get().then((r) => r?.data && setSettings(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!recentIds?.length) return
    Promise.all(recentIds.slice(0, 6).map((id) => productsAPI.getById(id).then((r) => r?.data).catch(() => null)))
      .then((list) => setRecentProducts(list.filter(Boolean)))
  }, [recentIds?.join(',')])

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

  const handleSearch = (e) => {
    e?.preventDefault?.()
    navigate(search ? `/explore?search=${encodeURIComponent(search)}` : '/explore')
  }

  const heroTitle = settings?.hero_title || 'Rybella'
  const heroSubtitle = settings?.hero_subtitle || 'الجمال الذي تستحقينه'
  const showRecent = settings?.show_recently_viewed !== '0' && recentProducts.length > 0
  const quickViewEnabled = settings?.quick_view_enabled !== '0'

  const getCatImage = (c) => {
    const iconIsImage = c.icon && (c.icon.startsWith('/') || c.icon.startsWith('http') || /\.(png|jpg|jpeg|gif|webp)$/i.test(c.icon))
    return iconIsImage ? `${IMG_BASE}${c.icon}` : c.image ? `${IMG_BASE}${c.image}` : null
  }

  return (
    <div className="home">
      {/* 1. شريط علوي ثابت */}
      <header className="home-header">
        <Link to="/" className="home-logo">{heroTitle}</Link>
        <form className="home-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="ابحثي..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" aria-label="بحث">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </form>
        <div className="home-actions">
          <Link to="/categories" className="home-action-btn" aria-label="الفئات">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </Link>
          <Link to="/cart" className="home-action-btn home-cart" aria-label="السلة">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {totalCount > 0 && <span className="home-cart-badge">{totalCount > 99 ? '99+' : totalCount}</span>}
          </Link>
        </div>
      </header>

      {/* 1. الفئات - فوق البانرات */}
      <section className="home-section home-section-categories">
        <div className="home-section-header">
          <h2 className="home-section-title">المميزة</h2>
          <Link to="/categories" className="home-section-link">الكل</Link>
        </div>
        <div className="home-categories">
          {categories.slice(0, 8).map((c) => (
            <Link key={c.id} to={`/explore?category=${c.id}`} className="home-category">
              <div className="home-category-icon">
                {getCatImage(c) ? (
                  <img src={getCatImage(c)} alt="" />
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                  </svg>
                )}
              </div>
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. البانرات - تصميم مثل الصورة */}
      <section className="home-hero">
        {banners.length > 0 ? (
          <div className="home-banners">
            <div
              className="home-banners-slider"
              ref={bannerRef}
              onScroll={(e) => setBannerIdx(Math.round(e.target.scrollLeft / e.target.clientWidth))}
            >
              {banners.slice(0, 5).map((b) => (
                <Link
                  key={b.id}
                  to={b.link_type === 'product' && b.link_value ? `/products/${b.link_value}` : b.link_type === 'category' && b.link_value ? `/explore?category=${b.link_value}` : '#'}
                  className="home-banner-slide"
                >
                  {/* طبقة 1: صورة الخلفية - تملأ البانر بالكامل */}
                  <div className="home-banner-bg">
                    {b.background_image ? (
                      <img src={`${IMG_BASE}${b.background_image}`} alt="" />
                    ) : null}
                  </div>
                  {/* طبقة 2: الصورة الرئيسية - تملأ البانر بالكامل */}
                  {b.image && (
                    <div className="home-banner-main-img">
                      <img src={`${IMG_BASE}${b.image}`} alt={b.title || ''} />
                    </div>
                  )}
                  {/* طبقة 3: النص والزر فوق الصور */}
                  <div className="home-banner-content">
                    <div className="home-banner-text">
                      <span className="home-banner-offer">{b.title || 'عروض حصرية'}</span>
                      {b.subtitle && <span className="home-banner-subtitle">{b.subtitle}</span>}
                      <span className="home-banner-btn">
                        تسوقي الآن
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {banners.length > 1 && (
              <div className="home-banners-pagination">
                {banners.slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`home-banners-dot ${i === bannerIdx ? 'active' : ''}`}
                    onClick={() => {
                      const el = bannerRef.current
                      if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
                    }}
                    aria-label={`بانر ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="home-hero-welcome">
            <h1 className="home-hero-title">{heroTitle}</h1>
            <p className="home-hero-subtitle">{heroSubtitle}</p>
          </div>
        )}
      </section>

      {/* 4. الفئات الثانوية */}
      {subcategories.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">تسوقي حسب النوع</h2>
            <Link to="/explore" className="home-section-link">الكل</Link>
          </div>
          <div className="home-subcategories">
            {subcategories.slice(0, 10).map((sc) => (
              <Link key={sc.id} to={`/explore?subcategory=${sc.id}`} className="home-subcategory">
                <div className="home-subcategory-image">
                  {sc.image ? (
                    <img src={`${IMG_BASE}${sc.image}`} alt={sc.name} />
                  ) : (
                    <span>✦</span>
                  )}
                </div>
                <span>{sc.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. العروض */}
      {offers.length > 0 && (
        <section className="home-section home-section-offers">
          <div className="home-section-header">
            <h2 className="home-section-title">العروض الحصرية</h2>
            <Link to="/explore" className="home-section-link">الكل</Link>
          </div>
          <div className="home-offers">
            {offers.slice(0, 4).map((o) => (
              <Link key={o.id} to={o.product_ids ? `/explore?offer=${o.id}` : '/explore'} className="home-offer">
                {o.image && <img src={`${IMG_BASE}${o.image}`} alt={o.title} />}
                <span className="home-offer-label">{o.discount_label || o.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. المنتجات المميزة */}
      {featured.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <div>
              <h2 className="home-section-title">المنتجات المميزة</h2>
              <p className="home-section-desc">اختياراتنا الخاصة لكِ</p>
            </div>
            <Link to="/explore?featured=1" className="home-section-link">الكل</Link>
          </div>
          <div className="home-products">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} wishlistIds={wishlistIds} onWishlistToggle={user ? toggleWishlist : undefined} onQuickView={quickViewEnabled ? setQuickViewId : undefined} />
            ))}
          </div>
        </section>
      )}

      {/* 7. الأكثر مبيعاً */}
      {(bestSellers.length > 0 || popular.length > 0) && (
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">الأكثر مبيعاً</h2>
            <Link to="/explore" className="home-section-link">الكل</Link>
          </div>
          <div className="home-products">
            {(bestSellers.length ? bestSellers : popular.slice(0, 8)).map((p) => (
              <ProductCard key={p.id} product={p} wishlistIds={wishlistIds} onWishlistToggle={user ? toggleWishlist : undefined} onQuickView={quickViewEnabled ? setQuickViewId : undefined} />
            ))}
          </div>
        </section>
      )}

      {/* 8. الماركات */}
      {brands.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">الماركات</h2>
            <Link to="/brands" className="home-section-link">الكل</Link>
          </div>
          <div className="home-brands">
            {brands.slice(0, 8).map((b) => (
              <Link key={b.id} to={`/explore?brand=${b.id}`} className="home-brand">
                {b.logo ? <img src={`${IMG_BASE}${b.logo}`} alt={b.name} /> : <span>{b.name?.[0] || '?'}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 9. شاهدته مؤخراً */}
      {showRecent && (
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">شاهدته مؤخراً</h2>
          </div>
          <div className="home-products">
            {recentProducts.map((p) => (
              <ProductCard key={p.id} product={p} wishlistIds={wishlistIds} onWishlistToggle={user ? toggleWishlist : undefined} onQuickView={quickViewEnabled ? setQuickViewId : undefined} />
            ))}
          </div>
        </section>
      )}

      {quickViewId && <QuickView productId={quickViewId} onClose={() => setQuickViewId(null)} />}
    </div>
  )
}
