import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { categoriesAPI, IMG_BASE } from '../services/api'
import './Categories.css'

export default function Categories() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    categoriesAPI.getAll().then((r) => setCategories(r?.data || [])).catch(() => [])
  }, [])

  return (
    <div className="categories-page">
      <h2>الفئات</h2>
      <div className="categories-grid">
        {categories.map((c) => (
          <Link key={c.id} to={`/explore?category=${c.id}`} className="category-card">
            {c.image ? (
              <img src={`${IMG_BASE}${c.image}`} alt="" />
            ) : (
              <span className="cat-emoji">✨</span>
            )}
            <span>{c.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
