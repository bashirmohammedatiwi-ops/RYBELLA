import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'
import './ProductCard.css'

const getBadges = (p) => {
  const b = []
  if (p.is_featured) b.push('مميز')
  if (p.is_best_seller) b.push('الأكثر مبيعاً')
  if (p.new_until && p.new_until >= new Date().toISOString().slice(0, 10)) b.push('جديد')
  else if (p.created_at && (Date.now() - new Date(p.created_at)) / 864e5 <= 30) b.push('جديد')
  return b
}

export default function ProductCard({ product, wishlistIds = [], onWishlistToggle, onQuickView }) {
  const minPrice = product.min_price ?? product.variants?.[0]?.price
  const img = product.main_image || product.images?.[0] || product.variants?.[0]?.image
  const badges = getBadges(product)
  const inStock = product.variants?.some((v) => v.stock > 0) ?? product.in_stock > 0 ?? true

  return (
    <div className="premium-product-card-wrap">
      <Link to={`/products/${product.id}`} className="premium-product-card">
      <div className="premium-product-img-wrap">
        {img ? (
          <img src={`${IMG_BASE}${img}`} alt={product.name} className="premium-product-img" />
        ) : (
          <div className="premium-product-placeholder">لا صورة</div>
        )}
        {badges[0] && <span className="premium-product-badge">{badges[0]}</span>}
        {!inStock && <span className="premium-product-soldout">نفذ</span>}
        {onWishlistToggle && (
          <button
            className={`premium-wishlist-btn ${wishlistIds?.includes(product.id) ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onWishlistToggle(product.id); }}
            aria-label="إضافة للمفضلة"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        )}
      </div>
      <div className="premium-product-body">
        <span className="premium-product-cat">{product.category_name || product.brand_name || 'منتجات'}</span>
        <h3 className="premium-product-title">{product.name}</h3>
        <span className="premium-product-price">
          {minPrice != null ? `${Number(minPrice).toLocaleString('ar-IQ')} د.ع` : '—'}
        </span>
      </div>
    </Link>
      {onQuickView && (
        <button
          className="premium-quick-view-btn"
          onClick={(e) => { e.preventDefault(); onQuickView(product.id); }}
        >
          معاينة سريعة
        </button>
      )}
    </div>
  )
}
