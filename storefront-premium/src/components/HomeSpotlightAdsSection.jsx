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

function ImageCarousel({ images, productId, isActive, inView }) {
  const carouselRef = useRef(null)
  const idxRef = useRef(0)
  const [idx, setIdx] = useState(0)

  const scrollTo = useCallback((index) => {
    const el = carouselRef.current
    if (!el) return
    const safe = Math.max(0, Math.min(index, images.length - 1))
    const frame = el.children[safe]
    if (!frame) return
    frame.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    idxRef.current = safe
    setIdx(safe)
  }, [images.length])

  const onScroll = useCallback(() => {
    const el = carouselRef.current
    if (!el?.clientWidth) return
    const isRTL = getComputedStyle(el).direction === 'rtl'
    const w = el.clientWidth
    const next = isRTL
      ? Math.round(-el.scrollLeft / w)
      : Math.round(el.scrollLeft / w)
    const safe = Math.max(0, Math.min(next, images.length - 1))
    if (safe !== idxRef.current) {
      idxRef.current = safe
      setIdx(safe)
    }
  }, [images.length])

  useEffect(() => {
    idxRef.current = 0
    setIdx(0)
    const first = carouselRef.current?.children[0]
    first?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'start' })
  }, [productId])

  useEffect(() => {
    if (!isActive || !inView || images.length <= 1) return
    const t = setInterval(() => {
      scrollTo((idxRef.current + 1) % images.length)
    }, 4200)
    return () => clearInterval(t)
  }, [isActive, inView, images.length, scrollTo])

  return (
    <div className="pk-viewer">
      <div
        ref={carouselRef}
        className="pk-carousel"
        onScroll={onScroll}
        aria-label="صور المنتج"
      >
        {images.map((src, i) => (
          <div key={src} className="pk-frame">
            <img
              src={`${IMG_BASE}${src}`}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="pk-viewer-ui">
          <div className="pk-segments" aria-hidden="true">
            {images.map((src, i) => (
              <span
                key={src}
                className={`pk-seg${i === idx ? ' is-on' : ''}${i < idx ? ' is-done' : ''}`}
              />
            ))}
          </div>
          <span className="pk-counter">{idx + 1} / {images.length}</span>
        </div>
      )}
    </div>
  )
}

function ProductSlide({ product, isActive, inView }) {
  const images = getProductImages(product)

  return (
    <article className={`pk-slide${isActive ? ' is-active' : ''}`}>
      <ImageCarousel
        images={images}
        productId={product.id}
        isActive={isActive}
        inView={inView}
      />

      <Link to={`/products/${product.id}`} className="pk-info">
        <div className="pk-info-main">
          <div className="pk-info-text">
            {(product.brand_name || product.category_name) && (
              <span className="pk-brand">{product.brand_name || product.category_name}</span>
            )}
            <h3 className="pk-name">{product.name}</h3>
          </div>
          <span className="pk-price">{formatPrice(getMinPrice(product))}</span>
        </div>
        <span className="pk-cta">
          <span>تسوقي الآن</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </Link>
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

    userPausedRef.current = true
    if (pauseRef.current) clearTimeout(pauseRef.current)
    pauseRef.current = window.setTimeout(() => { userPausedRef.current = false }, 8000)

    const center = track.scrollLeft + track.clientWidth / 2
    let closest = 0
    let min = Infinity
    Array.from(track.children).forEach((el, i) => {
      const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - center)
      if (d < min) { min = d; closest = i }
    })
    activeIdxRef.current = closest
    setActiveIdx(closest)
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 })
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
    <section ref={sectionRef} className="pk-section" aria-label="معرض صور المنتج">
      <header className="pk-head">
        <div className="pk-head-main">
          <span className="pk-label">Gallery</span>
          <h2 className="pk-title">معرض <em>الصور</em></h2>
        </div>
        {items.length > 1 && (
          <span className="pk-head-count">{activeIdx + 1} / {items.length}</span>
        )}
      </header>

      <div className="pk-track" ref={trackRef} onScroll={onTrackScroll}>
        {items.map((p, i) => (
          <ProductSlide key={p.id} product={p} isActive={i === activeIdx} inView={inView} />
        ))}
      </div>

      {items.length > 1 && (
        <div className="pk-dots">
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`pk-dot${i === activeIdx ? ' is-on' : ''}`}
              onClick={() => scrollTo(i)}
              aria-label={`منتج ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
