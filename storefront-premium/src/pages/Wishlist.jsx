import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { wishlistAPI, IMG_BASE } from '../services/api'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import './Wishlist.css'

export default function Wishlist() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    wishlistAPI.getAll()
      .then((r) => setProducts(r?.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const wishlistIds = products.map((p) => p.id)

  const removeFromWishlist = (productId) => {
    wishlistAPI.remove(productId).then(() => setProducts((prev) => prev.filter((p) => p.id !== productId)))
  }

  if (!user) {
    return (
      <div className="premium-wishlist premium-wishlist-empty">
        <h2>المفضلة</h2>
        <p>سجّلي الدخول لعرض قائمة المفضلة.</p>
        <Link to="/login">تسجيل الدخول</Link>
      </div>
    )
  }

  if (loading) return <div className="premium-wishlist premium-loading">جاري التحميل...</div>

  return (
    <div className="premium-wishlist">
      <h1>المفضلة</h1>
      {products.length === 0 ? (
        <div className="premium-wishlist-empty">
          <p>لا توجد منتجات في المفضلة.</p>
          <Link to="/explore">تصفح المنتجات</Link>
        </div>
      ) : (
        <>
          <div className="premium-wishlist-products">
            {products.map((p) => (
              <div key={p.id} className="premium-wishlist-item">
                <ProductCard product={p} wishlistIds={wishlistIds} onWishlistToggle={removeFromWishlist} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
