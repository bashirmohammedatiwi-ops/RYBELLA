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

  return [...all].sort((a, b) => score(b) - score(a)).slice(0, 8)
}

export default function HomeSpotlightAdsSection({ products = [], featured = [], bestSellers = [] }) {
  const sectionRef = useRef(null)
  const [inView, setInView] = useState(false)
  const [productIdx, setProductIdx] = useState(0)
  const [imageIdx, setImageIdx] = useState(0)
  const [direction, setDirection] = useState(1)

  const items = useMemo(
    () => buildSpotlightProducts(products, featured, bestSellers),
    [products, featured, bestSellers]
  )

  const product = items[productIdx]
  const images = product ? getProductImages(product) : []
  const activeImg = images[imageIdx % Math.max(images.length, 1)]

  const goTo = useCallback((idx, dir = 1) => {
    setDirection(dir)
    setProductIdx(idx)
    setImageIdx(0)
  }, [])

  const nextProduct = useCallback(() => {
    if (items.length <= 1) return
    goTo((productIdx + 1) % items.length, 1)
  }, [items.length, productIdx, goTo])

  const prevProduct = useCallback(() => {
    if (items.length <= 1) return
    goTo((productIdx - 1 + items.length) % items.length, -1)
  }, [items.length, productIdx, goTo])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || items.length <= 1) return
    const t = setInterval(nextProduct, 9000)
    return () => clearInterval(t)
  }, [inView, items.length, nextProduct, productIdx])

  useEffect(() => {
    if (!inView || images.length <= 1) return
    const t = setInterval(() => setImageIdx((i) => i + 1), 3500)
    return () => clearInterval(t)
  }, [inView, images.length, productIdx])

  if (!product) return null

  return (
    <section ref={sectionRef} className="bx-section" aria-label="منتج مميز">
      <div className="bx-blob bx-blob--a" aria-hidden="true" />
      <div className="bx-blob bx-blob--b" aria-hidden="true" />

      <header className="bx-head">
        <span className="bx-kicker">✦ Rybella Pick</span>
        <h2 className="bx-title">لمسة واحدة<br /><em>تغيّر يومك</em></h2>
      </header>

      <div className={`bx-card bx-card--${direction > 0 ? 'fwd' : 'back'}`} key={product.id}>
        <div className="bx-visual">
          <div className="bx-arch">
            <div className="bx-arch-inner">
              {images.map((src) => (
                <img
                  key={src}
                  src={`${IMG_BASE}${src}`}
                  alt=""
                  className={`bx-arch-img${src === activeImg ? ' is-on' : ''}`}
                  loading="lazy"
                />
              ))}
            </div>
            <div className="bx-arch-frame" aria-hidden="true" />
          </div>

          {images.length > 1 && (
            <div className="bx-thumbs" role="tablist" aria-label="صور المنتج">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  role="tab"
                  aria-selected={i === imageIdx % images.length}
                  className={`bx-thumb${i === imageIdx % images.length ? ' is-on' : ''}`}
                  onClick={() => setImageIdx(i)}
                >
                  <img src={`${IMG_BASE}${src}`} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bx-body">
          <div className="bx-meta">
            {isTruthyFlag(product.is_featured) && <span className="bx-pill">مميز</span>}
            {isTruthyFlag(product.is_best_seller) && <span className="bx-pill bx-pill--hot">الأكثر مبيعاً</span>}
            {(product.brand_name || product.category_name) && (
              <span className="bx-brand">{product.brand_name || product.category_name}</span>
            )}
          </div>

          <h3 className="bx-name">{product.name}</h3>
          <p className="bx-price">{formatPrice(getMinPrice(product))}</p>

          <p className="bx-hint">
            {images.length > 1
              ? `${images.length} صور · تتغيّر تلقائياً`
              : 'منتج مختار خصيصاً لكِ'}
          </p>

          <Link to={`/products/${product.id}`} className="bx-cta">
            <span>تسوقي الآن</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>

      {items.length > 1 && (
        <footer className="bx-footer">
          <button type="button" className="bx-nav" onClick={prevProduct} aria-label="المنتج السابق">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
          </button>

          <div className="bx-queue">
            {items.map((p, i) => {
              const thumb = getProductImages(p)[0]
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`bx-queue-item${i === productIdx ? ' is-on' : ''}`}
                  onClick={() => goTo(i, i > productIdx ? 1 : -1)}
                  aria-label={p.name}
                  aria-current={i === productIdx ? 'true' : undefined}
                >
                  {thumb ? <img src={`${IMG_BASE}${thumb}`} alt="" loading="lazy" /> : <span>✦</span>}
                </button>
              )
            })}
          </div>

          <button type="button" className="bx-nav" onClick={nextProduct} aria-label="المنتج التالي">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </footer>
      )}
    </section>
  )
}
