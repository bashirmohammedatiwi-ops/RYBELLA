import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useRecentlyViewed } from '../context/RecentlyViewedContext'
import { productsAPI, wishlistAPI, IMG_BASE } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import MobileHeader from '../components/MobileHeader'
import './ProductDetail.css'

const SHADE_COLOR_MAP = {
  أحمر: '#C62828', وردي: '#EC407A', برتقالي: '#EF6C00', أصفر: '#F9A825',
  أخضر: '#2E7D32', أزرق: '#1565C0', بنفسجي: '#7B1FA2', بني: '#5D4037',
  أسود: '#212121', أبيض: '#FAFAFA', بيج: '#D7CCC8', كحلي: '#283593',
  ذهبي: '#FFD700', فضي: '#9E9E9E', nude: '#E8D5C4', nude2: '#D4B896',
  مشمشي: '#FFAB91', مرجاني: '#FF8A65', خوخي: '#FFCCBC',
}

function getVariantColor(v) {
  if (v.color_code && /^#[0-9A-Fa-f]{3,8}$/.test(v.color_code)) return v.color_code
  const name = (v.shade_name || '').toLowerCase()
  for (const [key, hex] of Object.entries(SHADE_COLOR_MAP)) {
    if (name.includes(key.toLowerCase())) return hex
  }
  return null
}

function isMetallicShade(color, shadeName) {
  if (!color) return false
  const name = (shadeName || '').toLowerCase()
  return name.includes('ذهبي') || name.includes('فضي') || name.includes('gold') || name.includes('silver')
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const galleryRef = useRef(null)
  const [product, setProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [galleryIdx, setGalleryIdx] = useState(0)
  const { user } = useAuth()
  const { addItem } = useCart()
  const { addProduct } = useRecentlyViewed()

  useEffect(() => {
    addProduct(Number(id))
    productsAPI.getById(id).then((r) => {
      const p = r?.data
      setProduct(p)
      if (p?.variants?.length) {
        const first = p.variants.find((v) => v.stock > 0) || p.variants[0]
        setSelectedVariant(first)
      } else {
        setSelectedVariant(null)
      }
    }).catch(() => setProduct(null)).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!user || !product) return
    wishlistAPI.getAll().then((r) => {
      const ids = (r?.data || []).map((p) => p.product_id || p.id)
      setIsInWishlist(ids.includes(Number(id)))
    }).catch(() => {})
  }, [user, product, id])

  useEffect(() => {
    setGalleryIdx(0)
  }, [id])

  const trackRef = useRef(null)
  const galleryDataRef = useRef({ gallerySlides: [], product: null })

  useEffect(() => {
    const gallery = galleryRef.current
    const track = trackRef.current
    if (!gallery || !track || track.children.length === 0) return
    const slides = Array.from(track.children)
    const observer = new IntersectionObserver(
      (entries) => {
        let best = { idx: -1, ratio: 0 }
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > best.ratio) {
            const idx = slides.indexOf(entry.target)
            if (idx >= 0) best = { idx, ratio: entry.intersectionRatio }
          }
        })
        if (best.idx >= 0) {
          setGalleryIdx(best.idx)
          const { gallerySlides: gs, product: prod } = galleryDataRef.current
          const slide = gs[best.idx]
          if (slide?.variantId && prod?.variants) {
            const v = prod.variants.find((x) => x.id === slide.variantId)
            if (v) setSelectedVariant(v)
          }
        }
      },
      { root: gallery, rootMargin: '0px', threshold: [0.25, 0.5, 0.75, 1] }
    )
    slides.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [product?.id])

  const toggleWishlist = () => {
    if (!user) return
    if (isInWishlist) {
      wishlistAPI.remove(id).then(() => setIsInWishlist(false))
    } else {
      wishlistAPI.add(id).then(() => setIsInWishlist(true))
    }
  }

  const handleAddToCart = () => {
    if (!selectedVariant) return
    const guestData = !user ? {
      product_id: product.id,
      product_name: product.name,
      shade_name: selectedVariant.shade_name,
      price: selectedVariant.price,
      image: selectedVariant.image || product.main_image || product.images?.[0],
    } : null
    addItem(selectedVariant.id, qty, guestData)
    navigate('/cart')
  }

  const goToSlide = (i) => {
    const track = galleryRef.current?.querySelector('.pd-gallery-track')
    const slide = track?.children[i]
    if (slide) {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
      setGalleryIdx(i)
    }
  }

  const handleGalleryScroll = (e, slides, prod) => {
    const track = galleryRef.current?.querySelector('.pd-gallery-track')
    if (!track || !slides?.length) return
    const w = e.target.clientWidth || 1
    const isRTL = getComputedStyle(e.target).direction === 'rtl'
    const scrollLeft = e.target.scrollLeft
    const idx = isRTL
      ? Math.round(-scrollLeft / w)
      : Math.round(scrollLeft / w)
    const safeIdx = Math.max(0, Math.min(idx, slides.length - 1))
    setGalleryIdx(safeIdx)
    const slide = slides[safeIdx]
    if (slide?.variantId && prod?.variants) {
      const v = prod.variants.find((x) => x.id === slide.variantId)
      if (v) setSelectedVariant(v)
    }
  }

  if (loading) return <div className="pd-page pd-loading"><div className="pd-spinner" /><span>جاري التحميل...</span></div>
  if (!product) return <div className="pd-page pd-empty"><p>المنتج غير موجود.</p><Link to="/explore">تصفح المتجر</Link></div>

  const variants = product.variants || []
  const productImages = [
    ...(product.main_image ? [product.main_image] : []),
    ...(product.images || []).filter((u) => u !== product.main_image),
  ].filter(Boolean)

  const gallerySlides = []
  const variantIdToSlideIndex = {}
  const usedUrls = new Set()

  productImages.forEach((url) => {
    if (url) {
      gallerySlides.push({ url, shade_name: null, variantId: null })
      usedUrls.add(url)
    }
  })

  variants.forEach((v) => {
    const url = v.image || product.main_image || product.images?.[0]
    if (url) {
      const idx = gallerySlides.length
      gallerySlides.push({ url, shade_name: v.shade_name, variantId: v.id })
      variantIdToSlideIndex[v.id] = idx
      usedUrls.add(url)
    } else if (product.main_image || product.images?.[0]) {
      const fallbackUrl = product.main_image || product.images[0]
      const idx = gallerySlides.length
      gallerySlides.push({ url: fallbackUrl, shade_name: v.shade_name, variantId: v.id })
      variantIdToSlideIndex[v.id] = idx
    }
  })

  if (gallerySlides.length === 0) {
    const fallback = product.main_image || product.images?.[0]
    if (fallback) gallerySlides.push({ url: fallback, shade_name: null, variantId: null })
  }

  const hasMultipleImages = gallerySlides.length > 1
  const hasVariants = variants.length > 1
  const hasColorVariants = hasVariants && variants.some((v) => getVariantColor(v))

  galleryDataRef.current = { gallerySlides, product }

  const handleSelectVariant = (v) => {
    setSelectedVariant(v)
    const slideIdx = variantIdToSlideIndex[v.id]
    if (slideIdx != null) {
      requestAnimationFrame(() => goToSlide(slideIdx))
    }
  }

  return (
    <div className="pd-page">
      <MobileHeader title={product.name} showBack showCart />

      {/* معرض الصور - سلايدر مع مؤشرات */}
      <div className="pd-hero">
        <div
          className="pd-gallery"
          ref={galleryRef}
          onScroll={(e) => handleGalleryScroll(e, gallerySlides, product)}
        >
          <div ref={trackRef} className="pd-gallery-track" style={{ width: gallerySlides.length > 0 ? `${gallerySlides.length * 100}%` : '100%' }}>
            {gallerySlides.length > 0 ? (
              gallerySlides.map((slide, i) => (
                <div key={i} className="pd-gallery-slide" style={{ flex: `0 0 ${100 / gallerySlides.length}%` }}>
                  <img src={`${IMG_BASE}${slide.url}`} alt={product.name} />
                  {slide.shade_name && (
                    <span className="pd-slide-shade">{slide.shade_name}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="pd-gallery-slide pd-placeholder" style={{ flex: '0 0 100%' }}>
                <span>صورة</span>
              </div>
            )}
          </div>
        </div>
        {hasMultipleImages && (
          <div className="pd-gallery-dots">
            {gallerySlides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`pd-gallery-dot ${i === galleryIdx ? 'active' : ''}`}
                onClick={() => goToSlide(i)}
                aria-label={`صورة ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="pd-body">
        <div className="pd-meta">
          <div className="pd-meta-top">
            {(product.category?.name || product.category_name) && (
              <span className="pd-category">{product.category?.name || product.category_name}</span>
            )}
            {product.brand && (
              <Link to={`/explore?brand=${product.brand_id}`} className="pd-brand">{product.brand.name}</Link>
            )}
          </div>
          <h1 className="pd-title">{product.name}</h1>
          <p className="pd-price">
            {selectedVariant ? `${Number(selectedVariant.price).toLocaleString('ar-IQ')} د.ع` : (product.min_price ?? product.price ?? '—') + ' د.ع'}
          </p>
        </div>

        {hasVariants && (
          <div className="pd-variants">
            <div className="pd-variants-header">
              <span className="pd-variants-label">اختر الدرجة</span>
              {selectedVariant && (
                <span className="pd-variants-selected">{selectedVariant.shade_name}</span>
              )}
            </div>
            <div className="pd-swatches-wrap">
              <div className={`pd-swatches ${hasColorVariants ? 'color-mode' : 'text-mode'}`}>
                {product.variants.map((v) => {
                  const color = getVariantColor(v)
                  const isActive = selectedVariant?.id === v.id
                  const metallic = color && isMetallicShade(color, v.shade_name)
                  const outOfStock = (v.stock ?? 0) <= 0
                  return (
                    <button
                      key={v.id}
                      type="button"
                      className={`pd-swatch ${isActive ? 'active' : ''} ${color ? 'has-color' : ''} ${metallic ? 'metallic' : ''} ${outOfStock ? 'out-of-stock' : ''}`}
                      onClick={() => handleSelectVariant(v)}
                      title={v.shade_name}
                      style={color ? { '--swatch-color': color } : {}}
                    >
                      <span className="pd-swatch-preview">
                        {color ? (
                          <span className="pd-swatch-circle" />
                        ) : (
                          <span className="pd-swatch-text">{v.shade_name || `#${v.id}`}</span>
                        )}
                        {isActive && <span className="pd-swatch-check">✓</span>}
                      </span>
                      <span className="pd-swatch-name">{v.shade_name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {product.description && (
          <div className="pd-desc">
            <h3>الوصف</h3>
            <p>{product.description}</p>
          </div>
        )}

        <div className="pd-qty">
          <span className="pd-qty-label">الكمية</span>
          <div className="pd-qty-controls">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button type="button" onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
        </div>

        <div className="pd-actions">
          <button className="pd-add-cart" onClick={handleAddToCart} disabled={!selectedVariant || (selectedVariant?.stock ?? 0) < 1}>
            {selectedVariant && selectedVariant.stock > 0 ? 'أضف للسلة' : 'غير متوفر'}
          </button>
          {user && (
            <button type="button" className={`pd-wishlist ${isInWishlist ? 'active' : ''}`} onClick={toggleWishlist} aria-label="المفضلة">
              {isInWishlist ? '♥' : '♡'}
            </button>
          )}
        </div>
      </div>

      <div className="pd-sticky-bar">
        <span className="pd-sticky-price">
          {selectedVariant ? `${(selectedVariant.price * qty).toLocaleString('ar-IQ')} د.ع` : '—'}
        </span>
        <button className="pd-sticky-add" onClick={handleAddToCart} disabled={!selectedVariant || (selectedVariant?.stock ?? 0) < 1}>
          {selectedVariant && selectedVariant.stock > 0 ? 'أضف للسلة' : 'غير متوفر'}
        </button>
      </div>
    </div>
  )
}
