import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productsAPI, categoriesAPI, subcategoriesAPI, bannersAPI, offersAPI, webSettingsAPI, wishlistAPI, IMG_BASE } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useRecentlyViewed } from '../context/RecentlyViewedContext'
import ProductCard from '../components/ProductCard'
import HomeCategoriesSection from '../components/HomeCategoriesSection'
import HomeOffersSection from '../components/HomeOffersSection'
import HomeSpotlightAdsSection from '../components/HomeSpotlightAdsSection'
import StoriesBar from '../components/StoriesBar'
import { formatCount, formatPercent } from '../utils/format'
import './Home.css'

export default function Home() {
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [banners, setBanners] = useState([])
  const [offers, setOffers] = useState([])
  const [featured, setFeatured] = useState([])
  const [popular, setPopular] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [wishlistIds, setWishlistIds] = useState([])
  const [settings, setSettings] = useState(null)
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
      offersAPI.getAll().then((r) => toArr(r?.data)).catch(() => []),
      productsAPI.getAll({ featured: '1' }).then((r) => toArr(r?.data)).catch(() => []),
      productsAPI.getAll().then((r) => toArr(r?.data)).catch(() => []),
    ]).then(([cats, subcats, bns, offs, feat, pop]) => {
      setCategories(cats)
      setSubcategories(subcats)
      setBanners(bns)
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
  const showOffers = settings?.show_offers !== '0' && offers.length > 0

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
            {formatCount(totalCount) && <span className="home-cart-badge">{formatCount(totalCount)}</span>}
          </Link>
        </div>
      </header>

      <HomeCategoriesSection categories={categories} />

      {/* اليوميات - مثل انستغرام */}
      <StoriesBar />

      {/* 2. البانرات - إعادة بناء كاملة: الصورة تخرج من الأعلى فقط */}
      <section className="home-hero">
        {banners.length > 0 ? (
          <div className="home-banners-wrapper">
            <div
              className="home-banners"
              ref={bannerRef}
              onScroll={(e) => setBannerIdx(Math.round(e.target.scrollLeft / e.target.clientWidth))}
            >
              <div className="home-banners-slider">
              {banners.slice(0, 5).map((b) => {
                /* خصائص من لوحة التحكم: الموضع والحجم متغير */
                const posX = b.image_pos_x != null ? b.image_pos_x : 80;
                const posY = b.image_pos_y != null ? b.image_pos_y : 70;
                const displaySize = b.image_size > 0 ? b.image_size : 62;
                const bgColor = b.background_color || '#F5F5F5'
                const borderColor = b.border_color || '#E85D7A'
                const hasLightBg = !b.background_image && (bgColor.toLowerCase().includes('f5') || bgColor === '#fff' || bgColor === '#ffffff')
                return (
                <Link
                  key={b.id}
                  to={b.link_url || (b.link_type === 'url' && b.link_value ? b.link_value : '#')}
                  className="home-banner-slide"
                  style={{
                    background: b.background_image ? undefined : bgColor,
                    border: `2px solid ${borderColor}`,
                  }}
                >
                  {/* حاوية القص: تسمح بالخروج من الأعلى فقط */}
                  <div className="home-banner-clip">
                    {/* طبقة الخلفية */}
                    <div className="home-banner-bg" style={{ background: bgColor }}>
                      {b.background_image ? (
                        <img src={`${IMG_BASE}${b.background_image}`} alt="" />
                      ) : null}
                    </div>
                    {/* طبقة المحتوى: عنوان، عنوان فرعي، زر */}
                    {(b.title || b.subtitle || b.button_text) && (
                      <div className={`home-banner-content ${hasLightBg ? 'home-banner-content-dark' : ''}`}>
                        <div className="home-banner-text">
                          {b.title && <span className="home-banner-title">{b.title}</span>}
                          {b.subtitle && <span className="home-banner-subtitle">{b.subtitle}</span>}
                          {b.button_text && (
                            <span className="home-banner-btn">{b.button_text}</span>
                          )}
                        </div>
                      </div>
                    )}
                    {/* شارة الخصم */}
                    {b.discount_percent != null && b.discount_percent > 0 && (
                      <div className="home-banner-discount-badge">
                        <span className="home-banner-discount-label">خصم</span>
                        <span className="home-banner-discount-value">{formatPercent(b.discount_percent)}</span>
                      </div>
                    )}
                    {/* صورة المنتج/الشخص - موضع وحجم من لوحة التحكم، تخرج من الأعلى */}
                    {b.image && (
                      <div
                        className="home-banner-figure"
                        style={{
                          left: `${posX}%`,
                          bottom: `${Math.max(0, 100 - posY)}%`,
                          width: `${displaySize}%`,
                        }}
                      >
                        <img src={`${IMG_BASE}${b.image}`} alt={b.title || ''} />
                      </div>
                    )}
                  </div>
                </Link>
                );
              })}
              </div>
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

      <HomeSpotlightAdsSection
        products={popular}
        featured={featured}
        bestSellers={bestSellers}
      />

      {/* 5. العروض الحصرية */}
      {showOffers && <HomeOffersSection offers={offers} />}

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
              <ProductCard key={p.id} product={p} wishlistIds={wishlistIds} onWishlistToggle={user ? toggleWishlist : undefined} />
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
              <ProductCard key={p.id} product={p} wishlistIds={wishlistIds} onWishlistToggle={user ? toggleWishlist : undefined} />
            ))}
          </div>
        </section>
      )}

      {/* 8. شاهدته مؤخراً */}
      {showRecent && (
        <section className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">شاهدته مؤخراً</h2>
          </div>
          <div className="home-products">
            {recentProducts.map((p) => (
              <ProductCard key={p.id} product={p} wishlistIds={wishlistIds} onWishlistToggle={user ? toggleWishlist : undefined} />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
