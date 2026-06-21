import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'
import { formatPrice } from '../utils/format'
import './HomeSpotlightAdsSection.css'

function isTruthyFlag(value) {
  return value === true || value === 1 || value === '1'
}

function getProductImages(product) {
  const imgs = []
  const main = product?.main_image || product?.variants?.[0]?.image
  if (main) imgs.push(main)
  if (Array.isArray(product?.images)) {
    product.images.forEach((img) => {
      if (img && !imgs.includes(img)) imgs.push(img)
    })
  }
  return imgs
}

function getMinPrice(product) {
  return product?.min_price ?? product?.variants?.[0]?.price
}

function getProductBadge(product) {
  if (isTruthyFlag(product.is_featured)) return 'مميز'
  if (isTruthyFlag(product.is_best_seller)) return 'الأكثر مبيعاً'
  if (product.created_at && (Date.now() - new Date(product.created_at)) / 864e5 <= 30) return 'جديد'
  return 'مختار لكِ'
}

function buildSpotlightProducts(products, featured, bestSellers) {
  const seen = new Set()
  const all = [...featured, ...bestSellers, ...products].filter((p) => {
    if (!p?.id || seen.has(p.id)) return false
    seen.add(p.id)
    return getProductImages(p).length >= 1
  })

  const score = (p) =>
    getProductImages(p).length * 12 +
    (isTruthyFlag(p.is_featured) ? 40 : 0) +
    (isTruthyFlag(p.is_best_seller) ? 28 : 0)

  return [...all].sort((a, b) => score(b) - score(a)).slice(0, 10)
}

function ProductSpotlightStage({ product, imageIdx, isVisible }) {
  const images = getProductImages(product)
  const extras = images.slice(1, 5)
  const activeImage = images[imageIdx % images.length] || images[0]
  const badge = getProductBadge(product)
  const brand = product.brand_name || product.category_name

  return (
    <article className={`sp-stage${isVisible ? ' is-visible' : ''}`} aria-hidden={!isVisible}>
      <div className="sp-stage-aura sp-stage-aura--1" aria-hidden="true" />
      <div className="sp-stage-aura sp-stage-aura--2" aria-hidden="true" />
      <div className="sp-stage-ring" aria-hidden="true" />

      <div className="sp-visual">
        <div className="sp-hero-stack">
          {images.map((src, i) => (
            <img
              key={src}
              src={`${IMG_BASE}${src}`}
              alt=""
              className={`sp-hero-img${src === activeImage ? ' is-active' : ''}`}
              loading="lazy"
            />
          ))}
        </div>

        {extras.length > 0 && (
          <div className="sp-filmstrip" aria-label="صور إضافية">
            {extras.map((src, i) => {
              const imgIndex = i + 1
              const isLit = images.indexOf(activeImage) === imgIndex
              return (
                <div
                  key={src}
                  className={`sp-filmstrip-item${isLit ? ' is-lit' : ''}`}
                  style={{ '--sp-delay': `${i * 0.12}s` }}
                >
                  <img src={`${IMG_BASE}${src}`} alt="" loading="lazy" />
                </div>
              )
            })}
          </div>
        )}

        <div className="sp-flash" aria-hidden="true" />
      </div>

      <div className="sp-info">
        <span className="sp-badge">{badge}</span>
        {brand && <span className="sp-brand">{brand}</span>}
        <h3 className="sp-name">{product.name}</h3>
        <p className="sp-price">{formatPrice(getMinPrice(product))}</p>
        <Link to={`/products/${product.id}`} className="sp-cta">
          <span>اكتشفي المنتج</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </article>
  )
}

export default function HomeSpotlightAdsSection({ products = [], featured = [], bestSellers = [] }) {
  const sectionRef = useRef(null)
  const [inView, setInView] = useState(false)
  const [productIdx, setProductIdx] = useState(0)
  const [imageIdx, setImageIdx] = useState(0)
  const [tick, setTick] = useState(0)

  const spotlightProducts = useMemo(
    () => buildSpotlightProducts(products, featured, bestSellers),
    [products, featured, bestSellers]
  )

  const activeProduct = spotlightProducts[productIdx]

  const goToProduct = useCallback((idx) => {
    setProductIdx(idx)
    setImageIdx(0)
    setTick((t) => t + 1)
  }, [])

  const nextProduct = useCallback(() => {
    if (spotlightProducts.length <= 1) return
    goToProduct((productIdx + 1) % spotlightProducts.length)
  }, [spotlightProducts.length, productIdx, goToProduct])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || spotlightProducts.length <= 1) return
    const t = setInterval(nextProduct, 8500)
    return () => clearInterval(t)
  }, [inView, spotlightProducts.length, nextProduct, productIdx])

  useEffect(() => {
    if (!inView || !activeProduct) return
    const images = getProductImages(activeProduct)
    if (images.length <= 1) return
    const t = setInterval(() => setImageIdx((i) => i + 1), 3000)
    return () => clearInterval(t)
  }, [inView, activeProduct, productIdx])

  if (!spotlightProducts.length) return null

  return (
    <section ref={sectionRef} className="sp-section" aria-label="منتج مميز">
      <header className="sp-head">
        <div>
          <span className="sp-eyebrow">Spotlight</span>
          <h2 className="sp-title">نجمة اللحظة</h2>
          <p className="sp-desc">منتج واحد · معرض صوره يتحرّك · يتجدّد تلقائياً</p>
        </div>
        {spotlightProducts.length > 1 && (
          <span className="sp-counter">
            {String(productIdx + 1).padStart(2, '0')}
            <span className="sp-counter-sep">/</span>
            {String(spotlightProducts.length).padStart(2, '0')}
          </span>
        )}
      </header>

      <div className="sp-viewport">
        {spotlightProducts.map((product, i) => (
          <ProductSpotlightStage
            key={product.id}
            product={product}
            imageIdx={i === productIdx ? imageIdx : 0}
            isVisible={i === productIdx}
          />
        ))}
      </div>

      {spotlightProducts.length > 1 && (
        <>
          <div className="sp-dots">
            {spotlightProducts.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`sp-dot${i === productIdx ? ' is-active' : ''}`}
                onClick={() => goToProduct(i)}
                aria-label={`منتج ${i + 1}`}
              />
            ))}
          </div>
          <div className="sp-progress" aria-hidden="true">
            <span className="sp-progress-fill" key={`${productIdx}-${tick}`} />
          </div>
        </>
      )}
    </section>
  )
}
