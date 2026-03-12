import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { brandsAPI, IMG_BASE } from '../services/api'
import './Brands.css'

export default function Brands() {
  const [brands, setBrands] = useState([])

  useEffect(() => {
    brandsAPI.getAll().then((r) => setBrands(r?.data || [])).catch(() => [])
  }, [])

  return (
    <div className="brands-page">
      <h2>العلامات التجارية</h2>
      <div className="brands-grid">
        {brands.map((b) => (
          <Link key={b.id} to={`/explore?brand=${b.id}`} className="brand-card">
            {b.logo ? (
              <img src={`${IMG_BASE}${b.logo}`} alt={b.name} />
            ) : (
              <span className="brand-name">{b.name}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
