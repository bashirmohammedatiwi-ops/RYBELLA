import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'
import { formatPrice } from '../utils/format'
import './HomeSpotlightAdsSection.css'

const STACK_LAYOUT = [
  { rot: -2, x: 0, y: -4, w: 224, h: 264, scale: 1, shape: 'round', z: 10 },
  { rot: -14, x: -102, y: 52, w: 184, h: 184, scale: 1, shape: 'circle', z: 8 },
  { rot: 12, x: 104, y: 44, w: 178, h: 178, scale: 1, shape: 'round', z: 9 },
  { rot: -17, x: -76, y: -76, w: 170, h: 170, scale: 1, shape: 'circle', z: 6 },
  { rot: 15, x: 80, y: -72, w: 162, h: 162, scale: 1, shape: 'round', z: 7 },
]

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

function getStackCards(images, frontIdx) {
  const slotCount = Math.min(images.length, STACK_LAYOUT.length)
  const n = images.length
  return STACK_LAYOUT.slice(0, slotCount)
    .map((layout, depth) => ({
      src: images[(frontIdx + depth) % n],
      imgIdx: (frontIdx + depth) % n,
      depth,
      layout,
    }))
    .sort((a, b) => b.depth - a.depth)
}

function ImageStack({ images, frontIdx, onChange, isActive, inView }) {
  const touchRef = useRef({ x: 0, y: 0 })
  const cards = getStackCards(images, frontIdx)

  useEffect(() => {
    if (!isActive || !inView || images.length <= 1) return
    const t = setInterval(() => {
      onChange((prev) => (prev + 1) % images.length)
    }, IMAGE_CYCLE_MS)
    return () => clearInterval(t)
  }, [isActive, inView, images.length, onChange])

  const onTouchStart = (e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const onTouchEnd = (e) => {
    if (images.length <= 1) return
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return
    onChange((prev) => ((prev + (dx < 0 ? 1 : -1)) % images.length + images.length) % images.length)
  }

  return (
    <div
      className={`pk-stack${isActive ? ' is-live' : ''}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="pk-stack-bg" aria-hidden="true" />
      <div className="pk-stack-shadow" aria-hidden="true" />

      <div className="pk-stack-cards">
        {cards.map(({ src, imgIdx, depth, layout }) => (
          <button
            key={`${src}-${depth}`}
            type="button"
            className={`pk-card pk-card--${layout.shape}${depth === 0 ? ' is-front' : ' is-back'}`}
            style={{
              '--pk-x': `${layout.x}px`,
              '--pk-y': `${layout.y}px`,
              '--pk-w': `${layout.w}px`,
              '--pk-h': `${layout.h}px`,
              '--pk-rot': `${layout.rot}deg`,
              '--pk-scale': layout.scale,
              zIndex: layout.z,
            }}
            onClick={() => onChange(imgIdx)}
            aria-label={`صورة ${imgIdx + 1}`}
          >
            <span className="pk-card-media">
              <img
                src={`${IMG_BASE}${src}`}
                alt=""
                loading={depth <= 1 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </span>
          </button>
        ))}
      </div>

      {images.length > 1 && (
        <div className="pk-stack-ui">
          <span className="pk-stack-count">{frontIdx + 1} / {images.length}</span>
          <div className="pk-stack-dots">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                className={`pk-stack-dot${i === frontIdx ? ' is-on' : ''}`}
                onClick={() => onChange(i)}
                aria-label={`صورة ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProductSlide({ product, isActive, inView }) {
  const images = getProductImages(product)
  const [frontIdx, setFrontIdx] = useState(0)

  useEffect(() => {
    setFrontIdx(0)
  }, [product.id])

  return (
    <article className={`pk-slide${isActive ? ' is-active' : ''}`}>
      <ImageStack
        images={images}
        frontIdx={frontIdx}
        onChange={setFrontIdx}
        isActive={isActive}
        inView={inView}
      />

      <Link to={`/products/${product.id}`} className="pk-info">
        <div className="pk-info-text">
          {(product.brand_name || product.category_name) && (
            <span className="pk-brand">{product.brand_name || product.category_name}</span>
          )}
          <h3 className="pk-name">{product.name}</h3>
        </div>
        <div className="pk-info-action">
          <span className="pk-price">{formatPrice(getMinPrice(product))}</span>
          <span className="pk-arrow" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
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
    <section ref={sectionRef} className="pk-section" aria-label="منتجات مميزة">
      {items.length > 1 && (
        <header className="pk-head">
          <span className="pk-head-count">{activeIdx + 1} / {items.length}</span>
        </header>
      )}

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
