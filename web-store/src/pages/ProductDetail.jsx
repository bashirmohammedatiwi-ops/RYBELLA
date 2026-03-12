import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { productsAPI, IMG_BASE } from '../services/api'
import { useCart } from '../context/CartContext'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [variantId, setVariantId] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    productsAPI.getById(id)
      .then((r) => {
        const p = r?.data
        setProduct(p)
        if (p?.variants?.[0]) setVariantId(String(p.variants[0].id))
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = async () => {
    if (!variantId) return
    const v = product?.variants?.find((x) => String(x.id) === String(variantId))
    if (!v) return
    try {
      await addItem(Number(variantId), qty)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (e) {
      alert(e.response?.data?.message || 'فشل الإضافة')
    }
  }

  if (loading) return <div className="loading">جاري التحميل...</div>
  if (!product) return <p className="empty-msg">المنتج غير موجود</p>

  const thumb = product.main_image || product.images?.[0] || product.variants?.[0]?.image
  const v = product?.variants?.find((x) => String(x.id) === String(variantId))

  return (
    <div className="product-detail">
      <div className="product-detail-grid">
        <div className="product-image-wrap">
          {thumb ? (
            <img src={`${IMG_BASE}${thumb}`} alt={product.name} />
          ) : (
            <div className="product-placeholder">لا صورة</div>
          )}
        </div>
        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="product-brand">{product.brand_name}</p>
          <div className="product-badges">
            {product.is_featured && <span className="badge">مميز</span>}
            {product.is_best_seller && <span className="badge best">أكثر مبيعاً</span>}
          </div>
          <p className="product-price">{v?.price ? `${Number(v.price).toLocaleString('ar-IQ')} د.ع` : '—'}</p>
          {product.description && <p className="product-desc">{product.description}</p>}
          {product.variants?.length > 1 && (
            <div className="variant-select">
              <label>اللون / الظل</label>
              <select value={variantId} onChange={(e) => setVariantId(e.target.value)}>
                {product.variants.map((x) => (
                  <option key={x.id} value={String(x.id)}>{x.shade_name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="product-actions">
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, +e.target.value))}
              className="qty-input"
            />
            <button onClick={handleAddToCart} disabled={added} className="add-btn">
              {added ? 'تمت الإضافة ✓' : 'أضف للسلة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
