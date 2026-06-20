import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'
import { formatNumber, formatCount } from '../utils/format'
import { getProductColorSwatches } from '../utils/variantColor'
import './ProductCard.css'

function isNewProduct(p) {
  if (p.new_until && p.new_until >= new Date().toISOString().slice(0, 10)) return true
  if (p.created_at && (Date.now() - new Date(p.created_at)) / 864e5 <= 30) return true
  return false
}

export default function ProductCard({ product, wishlistIds = [], onWishlistToggle }) {
  const minPrice = product.min_price ?? product.variants?.[0]?.price
  const img = product.main_image || product.images?.[0] || product.variants?.[0]?.image
  const inStock = product.variants?.some((v) => v.stock > 0) ?? product.in_stock > 0 ?? true
  const variants = product.variants || []
  const { displayed: colorSwatches, remaining: remainingColors, total: totalColors } = getProductColorSwatches(variants)
  const showColorSwatches = variants.length > 1 && totalColors > 0
  const shadeCount = variants.filter((v) => v.shade_name).length
  const brandLabel = product.brand_name || product.category_name

  const priceValue = minPrice != null ? formatNumber(minPrice) : null

  return (
    <div className="premium-product-card-wrap">
      <Link to={`/products/${product.id}`} className="premium-product-card">
        <div className="premium-product-media">
          <div className="premium-product-image-frame">
            {img ? (
              <img src={`${IMG_BASE}${img}`} alt={product.name} className="premium-product-img" loading="lazy" />
            ) : (
              <div className="premium-product-placeholder">لا صورة</div>
            )}
            <div className="premium-product-img-shine" aria-hidden="true" />
          </div>

          <div className="premium-product-badges">
            {product.is_featured && (
              <span className="premium-product-badge premium-product-badge--featured">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l1.8 5.5H19l-4.5 3.3 1.7 5.2L12 14.8 7.8 16l1.7-5.2L5 7.5h5.2L12 2z" />
                </svg>
                مميز
              </span>
            )}
            {product.is_best_seller && (
              <span className="premium-product-badge premium-product-badge--bestseller">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                الأكثر مبيعاً
              </span>
            )}
            {!product.is_featured && !product.is_best_seller && isNewProduct(product) && (
              <span className="premium-product-badge premium-product-badge--new">جديد</span>
            )}
          </div>

          {onWishlistToggle && (
            <button
              type="button"
              className={`premium-wishlist-btn ${wishlistIds?.includes(product.id) ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWishlistToggle(product.id) }}
              aria-label="إضافة للمفضلة"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlistIds?.includes(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          )}

          {!inStock && (
            <div className="premium-product-soldout">
              <span>نفذت الكمية</span>
            </div>
          )}
        </div>

        <div className="premium-product-divider" aria-hidden="true" />

        <div className="premium-product-body">
          {brandLabel && (
            <span className="premium-product-brand">{brandLabel}</span>
          )}
          <h3 className="premium-product-title">{product.name}</h3>
          <div className="premium-product-footer">
            <span className="premium-product-price">
              {priceValue != null ? (
                <>
                  <span className="premium-product-price-value">{priceValue}</span>
                  <span className="premium-product-price-currency"> د.ع</span>
                </>
              ) : '—'}
            </span>
            {showColorSwatches && (
              <div className="premium-product-shades" aria-label={`${totalColors} درجات لون`}>
                {colorSwatches.map((color) => (
                  <span
                    key={color}
                    className="premium-product-shade-dot"
                    style={{ backgroundColor: color }}
                  />
                ))}
                {remainingColors > 0 && (
                  <span className="premium-product-shades-more">+{formatCount(remainingColors, 9)}</span>
                )}
              </div>
            )}
            {!showColorSwatches && variants.length > 1 && shadeCount > 1 && (
              <span className="premium-product-shades-count">{shadeCount} درجات</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
