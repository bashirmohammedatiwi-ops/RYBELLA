import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRecentlyViewed } from '../context/RecentlyViewedContext'
import { productsAPI, wishlistAPI, IMG_BASE } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [isInWishlist, setIsInWishlist] = useState(false)
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

  if (loading) return <div className="premium-product-detail premium-loading">جاري التحميل...</div>
  if (!product) return <div className="premium-product-detail premium-empty">المنتج غير موجود.</div>

  const img = (selectedVariant?.image || product.main_image || product.images?.[0])
    ? `${IMG_BASE}${selectedVariant?.image || product.main_image || product.images?.[0]}`
    : null

  return (
    <div className="premium-product-detail">
      <div className="premium-pd-row">
        <div className="premium-pd-gallery">
          {img ? <img src={img} alt={product.name} /> : <span className="premium-pd-placeholder">صورة</span>}
        </div>
        <div className="premium-pd-info">
          <h1>{product.name}</h1>
          {product.brand && <p className="premium-pd-brand">{product.brand.name}</p>}
          <p className="premium-pd-price">
            {selectedVariant ? `${selectedVariant.price} د.ع` : (product.min_price ?? product.price ?? '—') + ' د.ع'}
          </p>
          {product.variants?.length > 1 && (
            <div className="premium-pd-variants">
              <label>الدرجة</label>
              <div className="premium-pd-variant-list">
                {product.variants.filter((v) => v.stock > 0).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`premium-pd-variant-btn ${selectedVariant?.id === v.id ? 'active' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {v.shade_name || `#${v.id}`}
                  </button>
                ))}
              </div>
            </div>
          )}
          {product.description && <p className="premium-pd-desc">{product.description}</p>}
          <div className="premium-pd-qty">
            <label>الكمية</label>
            <div className="premium-pd-qty-controls">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
          </div>
          <div className="premium-pd-actions">
            <button className="premium-pd-add-cart" onClick={handleAddToCart} disabled={!selectedVariant || (selectedVariant?.stock ?? 0) < 1}>
              {selectedVariant && selectedVariant.stock > 0 ? 'أضف للسلة' : 'غير متوفر'}
            </button>
            {user && (
              <button className={`premium-pd-wishlist ${isInWishlist ? 'active' : ''}`} onClick={toggleWishlist}>
                {isInWishlist ? '♥' : '♡'}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="premium-pd-sticky-bar">
        <span className="premium-pd-sticky-price">
          {selectedVariant ? `${(selectedVariant.price * qty).toLocaleString('ar-IQ')} د.ع` : '—'}
        </span>
        <button className="premium-pd-sticky-add" onClick={handleAddToCart} disabled={!selectedVariant || (selectedVariant?.stock ?? 0) < 1}>
          {selectedVariant && selectedVariant.stock > 0 ? 'أضف للسلة' : 'غير متوفر'}
        </button>
      </div>
    </div>
  )
}
