import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'
import './ProductCard.css'

export default function ProductCard({ product, wishlistIds = [], onWishlistToggle }) {
  const minPrice = product.min_price ?? product.variants?.[0]?.price
  const img = product.main_image || product.images?.[0] || product.variants?.[0]?.image

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-card-image-wrap">
        {img ? (
          <img src={`${IMG_BASE}${img}`} alt={product.name} className="product-card-image" />
        ) : (
          <div className="product-card-placeholder">لا صورة</div>
        )}
        {onWishlistToggle && (
          <button
            className={`wishlist-btn ${wishlistIds?.includes(product.id) ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onWishlistToggle(product.id); }}
            aria-label="إضافة للمفضلة"
          >
            ❤️
          </button>
        )}
      </div>
      <div className="product-card-body">
        <span className="product-card-category">{product.category_name || product.brand_name || 'منتجات'}</span>
        <h3 className="product-card-title">{product.name}</h3>
        <span className="product-card-price">
          {minPrice != null ? `${Number(minPrice).toLocaleString('ar-IQ')} د.ع` : '—'}
        </span>
      </div>
    </Link>
  )
}
