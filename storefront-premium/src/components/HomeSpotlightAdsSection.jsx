import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'
import { formatPrice } from '../utils/format'
import './HomeSpotlightAdsSection.css'

const ROTATION_MS = 15 * 60 * 1000
const IMAGE_CYCLE_MS = 3000
const MIN_ADDITIONAL_IMAGES = 2

function getRotationBucket() {
  return Math.floor(Date.now() / ROTATION_MS)
}

function isTruthyFlag(value) {
  return value === true || value === 1 || value === '1'
}

function getAdditionalImages(product) {
  if (!Array.isArray(product?.images)) return []
  return product.images.filter(Boolean)
}

function hasSpotlightGallery(product) {
  return getAdditionalImages(product).length >= MIN_ADDITIONAL_IMAGES
}

function getProductImages(product) {
  const imgs = []
  const main = product?.main_image || product?.variants?.[0]?.image
  if (main) imgs.push(main)
  getAdditionalImages(product).forEach((img) => {
    if (!imgs.includes(img)) imgs.push(img)
  })
  return imgs
}

function getMinPrice(product) {
  return product?.min_price ?? product?.variants?.[0]?.price
}

function buildSpotlightProducts(products, featured, bestSellers, rotationBucket = 0) {
  const seen = new Set()
  const all = [...featured, ...bestSellers, ...products].filter((p) => {
    if (!p?.id || seen.has(p.id)) return false
    seen.add(p.id)
    return hasSpotlightGallery(p)
  })

  const score = (p) =>
    getProductImages(p).length * 12 +
    (isTruthyFlag(p.is_featured) ? 40 : 0) +
    (isTruthyFlag(p.is_best_seller) ? 28 : 0)

  const sorted = [...all].sort((a, b) => score(b) - score(a))
  if (sorted.length <= 8) return sorted

  const start = (rotationBucket * 8) % sorted.length
  const picked = []
  for (let i = 0; i < 8; i += 1) {
    picked.push(sorted[(start + i) % sorted.length])
  }
  return picked
}

function ImageGallery({ images, frontIdx, onChange, slideVisible, inView }) {
  const touchRef = useRef({ x: 0, y: 0 })
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const canCycle = inView && slideVisible && images.length > 1
  const count = images.length
  const prevIdx = count > 1 ? (frontIdx - 1 + count) % count : 0
  const nextIdx = count > 1 ? (frontIdx + 1) % count : 0

  useEffect(() => {
    if (!canCycle) return undefined
    const t = window.setInterval(() => {
      onChangeRef.current((prev) => (prev + 1) % count)
    }, IMAGE_CYCLE_MS)
    return () => window.clearInterval(t)
  }, [canCycle, count])

  const onTouchStart = (e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const onTouchEnd = (e) => {
    if (count <= 1) return
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return
    onChange((prev) => ((prev + (dx < 0 ? 1 : -1)) % count + count) % count)
  }

  return (
    <div
      className="sg-gallery"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="sg-stage">
        <div className="sg-stage-glow" aria-hidden="true" />
        <div className="sg-stage-ambient" aria-hidden="true">
          <img
            key={`ambient-${images[frontIdx]}`}
            src={`${IMG_BASE}${images[frontIdx]}`}
            alt=""
            className="sg-ambient-img"
            draggable={false}
          />
        </div>

        {count > 1 && (
          <div className="sg-stage-peeks" aria-hidden="true">
            <span className="sg-peek sg-peek--prev">
              <img src={`${IMG_BASE}${images[prevIdx]}`} alt="" draggable={false} />
            </span>
            <span className="sg-peek sg-peek--next">
              <img src={`${IMG_BASE}${images[nextIdx]}`} alt="" draggable={false} />
            </span>
          </div>
        )}

        <div className="sg-stage-main">
          <div className="sg-stage-arch" aria-hidden="true" />
          {images.map((src, i) => (
            <img
              key={src}
              src={`${IMG_BASE}${src}`}
              alt=""
              className={`sg-hero-img${i === frontIdx ? ' is-active' : ''}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          ))}
          <span className="sg-stage-shine" aria-hidden="true" />
        </div>

        {count > 1 && (
          <span className="sg-stage-badge">
            <span className="sg-stage-badge-num">{String(frontIdx + 1).padStart(2, '0')}</span>
            <span className="sg-stage-badge-sep" />
            <span className="sg-stage-badge-total">{String(count).padStart(2, '0')}</span>
          </span>
        )}
      </div>

      {count > 1 && (
        <div className="sg-controls">
          <div className="sg-filmstrip" role="tablist" aria-label="صور المنتج">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={i === frontIdx}
                className={`sg-film${i === frontIdx ? ' is-active' : ''}`}
                onClick={() => onChange(i)}
                aria-label={`صورة ${i + 1}`}
              >
                <span className="sg-film-frame">
                  <img src={`${IMG_BASE}${src}`} alt="" loading="lazy" draggable={false} />
                </span>
                {i === frontIdx && (
                  <span
                    key={`timer-${frontIdx}`}
                    className="sg-film-timer"
                    style={{ animationDuration: `${IMAGE_CYCLE_MS}ms` }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProductSlide({ product, isActive, inView, index }) {
  const slideRef = useRef(null)
  const images = getProductImages(product)
  const [frontIdx, setFrontIdx] = useState(0)
  const [slideVisible, setSlideVisible] = useState(false)

  useEffect(() => {
    setFrontIdx(0)
  }, [product.id])

  useEffect(() => {
    const el = slideRef.current
    if (!el) return undefined
    const obs = new IntersectionObserver(
      ([entry]) => setSlideVisible(entry.isIntersecting && entry.intersectionRatio >= 0.45),
      { threshold: [0, 0.45, 0.65, 0.85, 1] }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [product.id])

  return (
    <article
      ref={slideRef}
      className={`sg-slide${isActive ? ' is-active' : ''}`}
      style={{ '--sg-i': index }}
    >
      <div className="sg-slide-shell">
        <span className="sg-slide-index" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>

        <ImageGallery
          images={images}
          frontIdx={frontIdx}
          onChange={setFrontIdx}
          slideVisible={slideVisible}
          inView={inView}
        />

        <Link to={`/products/${product.id}`} className="sg-info">
          <div className="sg-info-body">
            {(product.brand_name || product.category_name) && (
              <span className="sg-brand">{product.brand_name || product.category_name}</span>
            )}
            <h3 className="sg-name">{product.name}</h3>
            <span className="sg-price">{formatPrice(getMinPrice(product))}</span>
          </div>
          <span className="sg-cta">
            <span>اكتشفي</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
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
  const [rotationBucket, setRotationBucket] = useState(() => getRotationBucket())

  const items = useMemo(
    () => buildSpotlightProducts(products, featured, bestSellers, rotationBucket),
    [products, featured, bestSellers, rotationBucket]
  )

  useEffect(() => {
    const syncRotation = () => setRotationBucket(getRotationBucket())
    syncRotation()
    let intervalId
    const timeoutId = window.setTimeout(() => {
      syncRotation()
      intervalId = window.setInterval(syncRotation, ROTATION_MS)
    }, ROTATION_MS - (Date.now() % ROTATION_MS))
    return () => {
      window.clearTimeout(timeoutId)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    activeIdxRef.current = 0
    setActiveIdx(0)
    const track = trackRef.current
    if (track) track.scrollTo({ left: 0, behavior: 'auto' })
  }, [rotationBucket, items.length])

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

  const syncActiveIndex = useCallback(() => {
    const track = trackRef.current
    if (!track?.children.length) return

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

  const onTrackScroll = useCallback(() => {
    userPausedRef.current = true
    if (pauseRef.current) clearTimeout(pauseRef.current)
    pauseRef.current = window.setTimeout(() => { userPausedRef.current = false }, 8000)
    syncActiveIndex()
  }, [syncActiveIndex])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined
    syncActiveIndex()
    const ro = new ResizeObserver(() => syncActiveIndex())
    ro.observe(track)
    return () => ro.disconnect()
  }, [items.length, syncActiveIndex])

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
    <section ref={sectionRef} className="sg-section" aria-label="معرض الصور">
      <div className="sg-section-bg" aria-hidden="true">
        <span className="sg-section-orb sg-section-orb--a" />
        <span className="sg-section-orb sg-section-orb--b" />
      </div>

      <header className="sg-head">
        <div className="sg-head-main">
          <span className="sg-eyebrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
            </svg>
            معرض الصور
          </span>
          <h2 className="sg-title">لحظات جمال<br />بلمسة فاخرة</h2>
          <p className="sg-desc">منتجات بصور متعددة تتبدّل تلقائياً — مرّري واكتشفي كل تفصيل.</p>
        </div>
        {items.length > 1 && (
          <div className="sg-head-nav">
            <span className="sg-head-count">{activeIdx + 1} / {items.length}</span>
            <div className="sg-head-btns">
              <button
                type="button"
                className="sg-nav-btn"
                onClick={() => scrollTo((activeIdx - 1 + items.length) % items.length)}
                aria-label="المنتج السابق"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                className="sg-nav-btn"
                onClick={() => scrollTo((activeIdx + 1) % items.length)}
                aria-label="المنتج التالي"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="sg-track-wrap">
        <div className="sg-track" ref={trackRef} onScroll={onTrackScroll}>
          {items.map((p, i) => (
            <ProductSlide key={p.id} product={p} isActive={i === activeIdx} inView={inView} index={i} />
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <div className="sg-dots" role="tablist" aria-label="المنتجات">
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === activeIdx}
              className={`sg-dot${i === activeIdx ? ' is-on' : ''}`}
              onClick={() => scrollTo(i)}
              aria-label={`منتج ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
