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

function ShowcaseSlide({ product, isActive, inView }) {
  const images = getProductImages(product)
  const [imgIdx, setImgIdx] = useState(0)
  const imgIdxRef = useRef(0)
  const touchRef = useRef({ x: 0, y: 0 })

  const goImage = useCallback((idx) => {
    const next = ((idx % images.length) + images.length) % images.length
    imgIdxRef.current = next
    setImgIdx(next)
  }, [images.length])

  useEffect(() => {
    imgIdxRef.current = 0
    setImgIdx(0)
  }, [product.id])

  useEffect(() => {
    if (!isActive || !inView || images.length <= 1) return
    const t = setInterval(() => goImage(imgIdxRef.current + 1), 3800)
    return () => clearInterval(t)
  }, [isActive, inView, images.length, product.id, goImage])

  const onTouchStart = (e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const onTouchEnd = (e) => {
    if (images.length <= 1) return
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
    goImage(imgIdxRef.current + (dx < 0 ? 1 : -1))
  }

  const extras = images.filter((_, i) => i !== imgIdx).slice(0, 3)

  return (
    <article className={`pv-slide${isActive ? ' is-active' : ''}`}>
      <div className="pv-bg-stack" aria-hidden="true">
        {images.map((src, i) => (
          <img
            key={src}
            src={`${IMG_BASE}${src}`}
            alt=""
            className={`pv-bg-img${i === imgIdx ? ' is-on' : ''}`}
            loading="lazy"
          />
        ))}
        <div className="pv-bg-shade" />
      </div>

      <div
        className="pv-touch-layer"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-hidden="true"
      />

      {extras.length > 0 && (
        <div className="pv-floats" aria-hidden="true">
          {extras.map((src, i) => (
            <div key={src} className={`pv-float pv-float--${i + 1}`}>
              <img src={`${IMG_BASE}${src}`} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {images.length > 1 && (
        <div className="pv-img-nav">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`pv-img-dot${i === imgIdx ? ' is-on' : ''}`}
              onClick={() => goImage(i)}
              aria-label={`صورة ${i + 1}`}
            />
          ))}
        </div>
      )}

      <div className="pv-content">
        <div className="pv-badges">
          {isTruthyFlag(product.is_featured) && <span className="pv-badge">مميز</span>}
          {isTruthyFlag(product.is_best_seller) && <span className="pv-badge pv-badge--hot">الأكثر مبيعاً</span>}
        </div>

        {(product.brand_name || product.category_name) && (
          <span className="pv-brand">{product.brand_name || product.category_name}</span>
        )}

        <h3 className="pv-name">{product.name}</h3>
        <p className="pv-price">{formatPrice(getMinPrice(product))}</p>

        <Link to={`/products/${product.id}`} className="pv-cta">
          <span>احصلي عليه الآن</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </article>
  )
}

export default function HomeSpotlightAdsSection({ products = [], featured = [], bestSellers = [] }) {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const activeIdxRef = useRef(0)
  const pauseRef = useRef(null)
  const userPausedRef = useRef(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [inView, setInView] = useState(false)

  const items = useMemo(
    () => buildSpotlightProducts(products, featured, bestSellers),
    [products, featured, bestSellers]
  )

  const scrollTo = useCallback((index) => {
    const track = trackRef.current
    if (!track) return
    const slide = track.children[index]
    if (!slide) return
    track.scrollTo({
      left: slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2,
      behavior: 'smooth',
    })
    activeIdxRef.current = index
    setActiveIdx(index)
  }, [])

  const onTrackScroll = useCallback(() => {
    const track = trackRef.current
    if (!track?.children.length) return

    if (pauseRef.current) clearTimeout(pauseRef.current)
    userPausedRef.current = true
    pauseRef.current = window.setTimeout(() => {
      userPausedRef.current = false
    }, 8000)

    const center = track.scrollLeft + track.clientWidth / 2
    let closest = 0
    let min = Infinity
    Array.from(track.children).forEach((el, i) => {
      const c = el.offsetLeft + el.clientWidth / 2
      const d = Math.abs(c - center)
      if (d < min) { min = d; closest = i }
    })
    activeIdxRef.current = closest
    setActiveIdx(closest)
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || items.length <= 1) return
    const t = setInterval(() => {
      if (userPausedRef.current) return
      scrollTo((activeIdxRef.current + 1) % items.length)
    }, 9000)
    return () => clearInterval(t)
  }, [inView, items.length, scrollTo])

  useEffect(() => () => { if (pauseRef.current) clearTimeout(pauseRef.current) }, [])

  if (!items.length) return null

  return (
    <section ref={sectionRef} className="pv-section" aria-label="منتج مميز">
      <header className="pv-head">
        <span className="pv-label">Spotlight</span>
        <h2 className="pv-title">اختاري <em>بثقة</em></h2>
        {items.length > 1 && (
          <p className="pv-hint">← اسحبي بين المنتجات →</p>
        )}
      </header>

      {items.length > 1 && (
        <div className="pv-progress" aria-hidden="true">
          {items.map((p, i) => (
            <span key={p.id} className={`pv-progress-seg${i === activeIdx ? ' is-on' : ''}${i < activeIdx ? ' is-past' : ''}`} />
          ))}
        </div>
      )}

      <div className="pv-viewport">
        <div className="pv-track" ref={trackRef} onScroll={onTrackScroll}>
          {items.map((p, i) => (
            <ShowcaseSlide key={p.id} product={p} isActive={i === activeIdx} inView={inView} />
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <p className="pv-index" aria-live="polite">
          {activeIdx + 1} / {items.length}
        </p>
      )}
    </section>
  )
}
