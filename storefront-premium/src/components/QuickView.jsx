import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { productsAPI, IMG_BASE } from '../services/api'
import { useCart } from '../context/CartContext'
import './QuickView.css'

export default function QuickView({ productId, onClose }) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    productsAPI.getById(productId)
      .then((r) => setProduct(r?.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [productId])

  if (!productId) return null

  const handleAddToCart = () => {
    const v = product?.variants?.find((x) => x.stock > 0) || product?.variants?.[0]
    if (v) addItem(v.id, 1)
    onClose()
  }

  const selectedVariant = product?.variants?.find((v) => v.stock > 0) || product?.variants?.[0]
  const img = selectedVariant?.image || product?.main_image || product?.images?.[0]
  const price = selectedVariant?.price ?? product?.min_price

  return (
    <div className="qv-overlay" onClick={onClose}>
      <div className="qv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="qv-close" onClick={onClose}>×</button>
        {loading ? (
          <div className="qv-loading">جاري التحميل...</div>
        ) : product ? (
          <div className="qv-content">
            <div className="qv-img">
              {img ? <img src={`${IMG_BASE}${img}`} alt={product.name} /> : <span>صورة</span>}
            </div>
            <div className="qv-info">
              <h3>{product.name}</h3>
              {price != null && <p className="qv-price">{Number(price).toLocaleString('ar-IQ')} د.ع</p>}
              <p className="qv-desc">{product.description ? `${product.description.slice(0, 120)}...` : ''}</p>
              <div className="qv-actions">
                <Link to={`/products/${product.id}`} className="qv-btn qv-detail" onClick={onClose}>عرض التفاصيل</Link>
                <button className="qv-btn qv-cart" onClick={handleAddToCart} disabled={!selectedVariant || selectedVariant?.stock < 1}>
                  أضف للسلة
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="qv-error">المنتج غير موجود</div>
        )}
      </div>
    </div>
  )
}
