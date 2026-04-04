import { useState, useEffect } from 'react'
import { wishlistAPI } from '../services/api'
import ProductCard from '../components/ProductCard'
import { useAuth } from '../context/AuthContext'
import './Wishlist.css'

export default function Wishlist() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProducts([])
      setLoading(false)
      return
    }
    wishlistAPI.getAll()
      .then((r) => setProducts(r?.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [user])

  const handleRemove = async (productId) => {
    try {
      await wishlistAPI.remove(productId)
      setProducts((p) => p.filter((x) => x.id !== productId))
    } catch {}
  }

  if (!user) return <p className="empty-msg">سجّلي دخولك لعرض المفضلة</p>

  if (loading) return <p className="loading">جاري التحميل...</p>
  if (products.length === 0) return <p className="empty-msg">لا توجد منتجات في المفضلة</p>

  return (
    <div className="wishlist-page">
      <h2>المفضلة</h2>
      <div className="wishlist-grid">
        {products.map((p) => (
          <div key={p.id} className="wishlist-item">
            <ProductCard product={p} onWishlistToggle={() => handleRemove(p.id)} wishlistIds={products.map((x) => x.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}
