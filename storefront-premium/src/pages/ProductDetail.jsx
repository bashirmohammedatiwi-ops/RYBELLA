import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useRecentlyViewed } from '../context/RecentlyViewedContext'
import { productsAPI, wishlistAPI, IMG_BASE } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
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

  if (loading) return <div className="pd-page pd-loading"><div className="pd-spinner" /><span>جاري التحميل...</span></div>
  if (!product) return <div className="pd-page pd-empty"><p>المنتج غير موجود.</p><Link to="/explore">تصفح المتجر</Link></div>

  const allImages = [
    ...(selectedVariant?.image ? [selectedVariant.image] : []),
    ...(product.main_image ? [product.main_image] : []),
    ...(product.images || []).filter((url) => url !== selectedVariant?.image && url !== product.main_image),
  ].filter(Boolean)
  const mainImg = allImages[galleryIdx] ? `${IMG_BASE}${allImages[galleryIdx]}` : (allImages[0] ? `${IMG_BASE}${allImages[0]}` : null)
  const hasVariants = product.variants?.length > 1
  const hasColorVariants = hasVariants && product.variants.some((v) => getVariantColor(v))

  useEffect(() => {
    setGalleryIdx(0)
  }, [selectedVariant?.id])

  return (
    <div className="pd-page">
      <div className="pd-container">
        <div className="pd-gallery-wrap">
          <div className="pd-gallery">
            {mainImg ? (
              <img src={mainImg} alt={product.name} className="pd-main-img" />
            ) : (
              <div className="pd-placeholder"><span>صورة</span></div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="pd-thumbs">
              {allImages.slice(0, 5).map((url, i) => (
                <button key={i} type="button" className={`pd-thumb ${galleryIdx === i ? 'active' : ''}`} onClick={() => setGalleryIdx(i)}>
                  <img src={`${IMG_BASE}${url}`} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pd-info">
          {product.brand && (
            <Link to={`/explore?brand=${product.brand_id}`} className="pd-brand">{product.brand.name}</Link>
          )}
          <h1 className="pd-title">{product.name}</h1>
          <p className="pd-price">
            {selectedVariant ? `${Number(selectedVariant.price).toLocaleString('ar-IQ')} د.ع` : (product.min_price ?? product.price ?? '—') + ' د.ع'}
          </p>

          {hasVariants && (
            <div className="pd-variants">
              <label className="pd-variants-label">اختر الدرجة</label>
              <div className={`pd-variant-swatches ${hasColorVariants ? 'color-mode' : 'text-mode'}`}>
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
                      onClick={() => setSelectedVariant(v)}
                      title={v.shade_name}
                      style={color ? { '--swatch-color': color } : {}}
                    >
                      {color ? (
                        <span className="pd-swatch-circle" />
                      ) : (
                        <span className="pd-swatch-text">{v.shade_name || `#${v.id}`}</span>
                      )}
                      <span className="pd-swatch-name">{v.shade_name}</span>
                    </button>
                  )
                })}
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
            <label>الكمية</label>
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
