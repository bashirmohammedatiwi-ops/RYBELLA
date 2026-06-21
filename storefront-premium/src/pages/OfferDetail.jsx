import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { offersAPI, IMG_BASE } from '../services/api'
import { useCart } from '../context/CartContext'
import { formatPrice, formatPercent } from '../utils/format'
import MobileHeader from '../components/MobileHeader'
import './OfferDetail.css'

export default function OfferDetail() {
  const { id } = useParams()
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addedToCart, setAddedToCart] = useState(false)
  const { addBundle } = useCart()

  useEffect(() => {
    offersAPI.getById(id)
      .then((r) => setOffer(r?.data))
      .catch(() => setOffer(null))
      .finally(() => setLoading(false))
  }, [id])

  const getFirstVariant = (p) => {
    const variants = p.variants || []
    return variants.find((v) => (v.stock ?? 0) > 0) || variants[0]
  }

  const handleAddBundle = async () => {
    if (!offer?.products?.length) return
    const lines = []
    for (const p of offer.products) {
      const v = getFirstVariant(p)
      if (!v) return
      lines.push({
        variant_id: v.id,
        product_id: p.id,
        product_name: p.name,
        shade_name: v.shade_name,
        price: Number(v.price),
        image: v.image || p.main_image || p.images?.[0],
      })
    }
    await addBundle({
      offer_id: offer.id,
      offer_title: offer.title,
      offer_image: offer.image,
      discount_percent: offer.discount_percent || 0,
      discount_label: offer.discount_label,
      quantity: 1,
      lines,
      unit_price: totalAfterDiscount,
      subtotal: totalOriginal,
    })
    setAddedToCart(true)
    window.setTimeout(() => setAddedToCart(false), 2200)
  }

  if (loading) return <div className="offer-detail offer-loading"><div className="offer-spinner" /><span>جاري التحميل...</span></div>
  if (!offer) return <div className="offer-detail offer-empty"><p>العرض غير موجود.</p><Link to="/">العودة للرئيسية</Link></div>

  const discount = (offer.discount_percent ?? 0) / 100
  const products = offer.products || []
  let totalOriginal = 0
  let totalAfterDiscount = 0
  let allInStock = true
  for (const p of products) {
    const v = getFirstVariant(p)
    if (!v) { allInStock = false; continue }
    totalOriginal += Number(v.price)
    totalAfterDiscount += Number(v.price) * (1 - discount)
    if ((v.stock ?? 0) <= 0) allInStock = false
  }

  return (
    <div className="offer-detail">
      <MobileHeader title={offer.title} showBack />
      <div className="offer-hero">
        {offer.image && <img src={`${IMG_BASE}${offer.image}`} alt={offer.title} />}
        <div className="offer-hero-overlay" />
        <div className="offer-hero-content">
          <span className="offer-badge">باكج حصري</span>
          <h1>{offer.title}</h1>
          {offer.discount_label && <span className="offer-discount-label">{offer.discount_label}</span>}
          <p className="offer-bundle-note">يجب شراء جميع المنتجات معاً كباكج واحد</p>
        </div>
      </div>

      <div className="offer-products">
        <h2>محتويات الباكج</h2>
        <div className="offer-products-list">
          {products.map((p) => {
            const v = getFirstVariant(p)
            const price = v ? Number(v.price) : 0
            const discountedPrice = price * (1 - discount)
            const img = v?.image || p.main_image || p.images?.[0]
            return (
              <Link key={p.id} to={`/products/${p.id}`} className="offer-product-card">
                <div className="offer-product-img">
                  {img ? <img src={`${IMG_BASE}${img}`} alt={p.name} /> : <span>صورة</span>}
                </div>
                <div className="offer-product-info">
                  <h3>{p.name}</h3>
                  {p.brand_name && <span className="offer-product-brand">{p.brand_name}</span>}
                  <div className="offer-product-price">
                    {discount > 0 ? (
                      <>
                        <span className="original">{formatPrice(price)}</span>
                        <span className="discounted">{formatPrice(discountedPrice)}</span>
                      </>
                    ) : (
                      <span>{formatPrice(price)}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="offer-summary">
        <div className="offer-summary-row">
          <span>المجموع قبل الخصم</span>
          <span>{formatPrice(totalOriginal)}</span>
        </div>
        {discount > 0 && (
          <div className="offer-summary-row highlight">
            <span>المجموع بعد الخصم ({formatPercent(offer.discount_percent)})</span>
            <span>{formatPrice(totalAfterDiscount)}</span>
          </div>
        )}
        <button className="offer-add-bundle" onClick={handleAddBundle} disabled={!allInStock || products.length === 0}>
          {!allInStock
            ? 'بعض المنتجات غير متوفرة'
            : addedToCart
              ? 'تمت الإضافة ✓'
              : `أضيفي الباكج للسلة (${formatPrice(totalAfterDiscount)})`}
        </button>
      </div>
    </div>
  )
}
