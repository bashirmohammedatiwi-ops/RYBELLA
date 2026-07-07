import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { brandsAPI } from '../services/api'
import MobileHeader from '../components/MobileHeader'
import OptimizedImage from '../components/OptimizedImage'
import './Brands.css'

export default function Brands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    brandsAPI.getAll()
      .then((r) => setBrands(r?.data || []))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="premium-brands premium-loading">جاري التحميل...</div>

  return (
    <div className="premium-brands">
      <MobileHeader title="العلامات التجارية" showBack />
      <h1>العلامات التجارية</h1>
      <div className="premium-brands-grid">
        {brands.map((b) => (
          <Link key={b.id} to={`/explore?brand=${b.id}`} className="premium-brand-card">
            {b.logo ? (
              <OptimizedImage src={b.logo} alt="" className="premium-brand-logo" preset="icon" />
            ) : (
              <span className="premium-brand-name-only">{b.name}</span>
            )}
            <span className="premium-brand-name">{b.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
