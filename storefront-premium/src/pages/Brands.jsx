import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { brandsAPI, IMG_BASE } from '../services/api'
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
      <h1>العلامات التجارية</h1>
      <div className="premium-brands-grid">
        {brands.map((b) => (
          <Link key={b.id} to={`/explore?brand=${b.id}`} className="premium-brand-card">
            {b.logo ? (
              <img src={`${IMG_BASE}${b.logo}`} alt="" className="premium-brand-logo" />
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
