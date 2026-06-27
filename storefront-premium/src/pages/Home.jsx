import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productsAPI, categoriesAPI, bannersAPI, offersAPI, webSettingsAPI, wishlistAPI, IMG_BASE } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useRecentlyViewed } from '../context/RecentlyViewedContext'
import ProductCard from '../components/ProductCard'
import HomeOffersSection from '../components/HomeOffersSection'
import HomeSpotlightAdsSection from '../components/HomeSpotlightAdsSection'
import StoriesBar from '../components/StoriesBar'
import { formatCount, formatPercent } from '../utils/format'
import './Home.css'

export default function Home() {
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState([])
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
      bannersAPI.getAll().then((r) => toArr(r?.data)).catch(() => []),
      offersAPI.getAll().then((r) => toArr(r?.data)).catch(() => []),
      productsAPI.getAll({ featured: '1' }).then((r) => toArr(r?.data)).catch(() => []),
      productsAPI.getAll().then((r) => toArr(r?.data)).catch(() => []),
    ]).then(([cats, bns, offs, feat, pop]) => {
      setCategories(cats)
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
  const featuredProducts = (featured.length ? featured : popular).slice(0, 8)
  const bestSellerProducts = (bestSellers.length ? bestSellers : popular).slice(0, 8)
  const newProducts = popular.slice(0, 6)

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-header-top">
          <Link to="/" className="home-logo" aria-label={heroTitle}>
            <img src="/assets/rybella-logo.png" alt={heroTitle} />
          </Link>

          <div className="home-actions">
            <Link to="/categories" className="home-action-btn" aria-label="الفئات">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
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
        </div>

        <form className="home-search" onSubmit={handleSearch}>
          <svg className="home-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="ابحثي عن منتج أو درجة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">بحث</button>
        </form>
      </header>

      <main className="home-main">
        {banners.length > 0 ? (
          <section className="home-banners-section" aria-label="بنرات العروض">
            <div
              className="home-banners"
              ref={bannerRef}
              onScroll={(e) => setBannerIdx(Math.round(e.target.scrollLeft / e.target.clientWidth))}
            >
              <div className="home-banners-slider">
                {banners.slice(0, 5).map((b) => {
                  const posX = b.image_pos_x != null ? b.image_pos_x : 78
                  const posY = b.image_pos_y != null ? b.image_pos_y : 70
                  const displaySize = b.image_size > 0 ? b.image_size : 58
                  const bgColor = b.background_color || '#fff1f5'
                  const borderColor = b.border_color || '#f4b7c4'
                  const hasLightBg = !b.background_image && ['#fff', '#ffffff', '#f5f5f5'].includes(bgColor.toLowerCase())
                  const bannerLink = b.link_url || (b.link_type === 'url' && b.link_value ? b.link_value : '#')

                  return (
                    <Link
                      key={b.id}
                      to={bannerLink}
                      className="home-banner-slide"
                      style={{ background: b.background_image ? undefined : bgColor, borderColor }}
                    >
                      <div className="home-banner-clip">
                        <div className="home-banner-bg" style={{ background: bgColor }}>
                          {b.background_image && <img src={`${IMG_BASE}${b.background_image}`} alt="" />}
                        </div>

                        {(b.title || b.subtitle || b.button_text) && (
                          <div className={`home-banner-content ${hasLightBg ? 'home-banner-content-dark' : ''}`}>
                            <div className="home-banner-text">
                              {b.title && <span className="home-banner-title">{b.title}</span>}
                              {b.subtitle && <span className="home-banner-subtitle">{b.subtitle}</span>}
                              {b.button_text && <span className="home-banner-btn">{b.button_text}</span>}
                            </div>
                          </div>
                        )}

                        {b.discount_percent != null && b.discount_percent > 0 && (
                          <span className="home-banner-discount-badge">
                            خصم {formatPercent(b.discount_percent)}
                          </span>
                        )}

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
                  )
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
          </section>
        ) : (
          <section className="home-hero-welcome">
            <h1>{heroTitle}</h1>
            <p>{heroSubtitle}</p>
          </section>
        )}

        <nav className="home-quick-nav" aria-label="روابط سريعة">
          <Link to="/explore">كل المنتجات</Link>
          <Link to="/categories">الفئات</Link>
          <Link to="/explore?featured=1">المميزة</Link>
          <Link to="/explore?sort_by=newest">وصل حديثاً</Link>
        </nav>

        {categories.length > 0 && (
          <section className="home-section home-main-categories">
            <div className="home-section-header">
              <div>
                <span className="home-section-eyebrow">الأقسام</span>
                <h2 className="home-section-title">الأقسام الرئيسية</h2>
                <p className="home-section-desc">كل الأقسام الرئيسية بصورها لسهولة الوصول.</p>
              </div>
              <Link to="/categories" className="home-section-link">عرض الكل</Link>
            </div>

            <div className="home-category-grid">
              {categories.map((c) => (
                <Link key={c.id} to={`/explore?category=${c.id}`} className="home-category-card">
                  <span className="home-category-card-media">
                    {c.image ? (
                      <img src={`${IMG_BASE}${c.image}`} alt={c.name} loading="lazy" />
                    ) : (
                      <span className="home-category-card-fallback">{c.name?.slice(0, 1) || 'R'}</span>
                    )}
                  </span>
                  <span className="home-category-card-overlay" />
                  <span className="home-category-card-name">{c.overlay_text || c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <StoriesBar />

        <HomeSpotlightAdsSection
          products={popular}
          featured={featured}
          bestSellers={bestSellers}
        />

        {showOffers && <HomeOffersSection offers={offers} />}

        {featuredProducts.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <div>
                <span className="home-section-eyebrow">مختارات</span>
                <h2 className="home-section-title">منتجات مميزة</h2>
                <p className="home-section-desc">اختيارات ناعمة ومناسبة لكل يوم.</p>
              </div>
              <Link to="/explore?featured=1" className="home-section-link">الكل</Link>
            </div>
            <div className="home-products">
              {featuredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  wishlistIds={wishlistIds}
                  onWishlistToggle={user ? toggleWishlist : undefined}
                />
              ))}
            </div>
          </section>
        )}

        {newProducts.length > 0 && (
          <section className="home-simple-card">
            <div>
              <span>وصل حديثاً</span>
              <h2>منتجات جديدة لتجربة أجمل</h2>
              <p>تصفحي أحدث الإضافات بتصميم بسيط وواضح.</p>
            </div>
            <Link to="/explore?sort_by=newest">شاهدي الجديد</Link>
          </section>
        )}

        {bestSellerProducts.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <div>
                <span className="home-section-eyebrow">الأكثر طلباً</span>
                <h2 className="home-section-title">المفضلة لدى الزبائن</h2>
              </div>
              <Link to="/explore" className="home-section-link">الكل</Link>
            </div>
            <div className="home-products">
              {bestSellerProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  wishlistIds={wishlistIds}
                  onWishlistToggle={user ? toggleWishlist : undefined}
                />
              ))}
            </div>
          </section>
        )}

        {showRecent && (
          <section className="home-section">
            <div className="home-section-header">
              <div>
                <span className="home-section-eyebrow">رجوع سريع</span>
                <h2 className="home-section-title">شاهدته مؤخراً</h2>
              </div>
            </div>
            <div className="home-products">
              {recentProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  wishlistIds={wishlistIds}
                  onWishlistToggle={user ? toggleWishlist : undefined}
                />
              ))}
            </div>
          </section>
        )}

        <section className="home-footer-note">
          <span>{heroTitle}</span>
          <p>تجربة تسوق بسيطة، أنيقة، وسريعة.</p>
        </section>
      </main>
    </div>
  )
}
