import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'
import { formatPrice } from '../utils/format'
import './HomeSpotlightAdsSection.css'

const STACK_LAYOUT = [
  { rot: 0, x: 0, y: 0, scale: 1, shape: 'round' },
  { rot: -11, x: -28, y: 14, scale: 0.88, shape: 'circle' },
  { rot: 9, x: 30, y: 18, scale: 0.84, shape: 'round' },
  { rot: -16, x: -18, y: 28, scale: 0.78, shape: 'circle' },
  { rot: 14, x: 22, y: 32, scale: 0.72, shape: 'round' },
]

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

function getStackCards(images, frontIdx) {
  const n = images.length
  return images.map((src, i) => {
    const depth = (i - frontIdx + n) % n
    const layout = STACK_LAYOUT[depth] || STACK_LAYOUT[STACK_LAYOUT.length - 1]
    return { src, i, depth, layout }
  }).sort((a, b) => b.depth - a.depth)
}

function ImageStack({ images, frontIdx, onChange, isActive, inView }) {
  const touchRef = useRef({ x: 0, y: 0 })
  const cards = getStackCards(images, frontIdx)

  const go = useCallback((delta) => {
    onChange(((frontIdx + delta) % images.length + images.length) % images.length)
  }, [frontIdx, images.length, onChange])

  useEffect(() => {
    if (!isActive || !inView || images.length <= 1) return
    const t = setInterval(() => go(1), 3500)
    return () => clearInterval(t)
  }, [isActive, inView, images.length, go])

  const onTouchStart = (e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const onTouchEnd = (e) => {
    if (images.length <= 1) return
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy)) return
    go(dx < 0 ? 1 : -1)
  }

  return (
    <div
      className={`pk-stack${isActive ? ' is-live' : ''}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="pk-stack-shadow" aria-hidden="true" />

      {cards.map(({ src, i, depth, layout }) => (
        <div
          key={`${src}-${depth}`}
          className={`pk-card pk-card--${layout.shape}${depth === 0 ? ' is-front' : ''}`}
          style={{
            '--pk-rot': `${layout.rot}deg`,
            '--pk-x': `${layout.x}px`,
            '--pk-y': `${layout.y}px`,
            '--pk-scale': layout.scale,
            zIndex: 10 - depth,
          }}
        >
          <img src={`${IMG_BASE}${src}`} alt="" loading={depth === 0 ? 'eager' : 'lazy'} draggable={false} />
          <span className="pk-card-shine" aria-hidden="true" />
        </div>
      ))}

      {images.length > 1 && (
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

      <div className="pk-body">
        <div className="pk-meta">
          {isTruthyFlag(product.is_featured) && <span className="pk-pill">مميز</span>}
          {isTruthyFlag(product.is_best_seller) && <span className="pk-pill pk-pill--hot">الأكثر مبيعاً</span>}
          {images.length > 1 && (
            <span className="pk-count">{images.length} صور</span>
          )}
        </div>

        {(product.brand_name || product.category_name) && (
          <span className="pk-brand">{product.brand_name || product.category_name}</span>
        )}

        <h3 className="pk-name">{product.name}</h3>
        <p className="pk-price">{formatPrice(getMinPrice(product))}</p>

        <Link to={`/products/${product.id}`} className="pk-cta">
          <span>تسوقي الآن</span>
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
    <section ref={sectionRef} className="pk-section" aria-label="منتج مميز">
      <header className="pk-head">
        <span className="pk-label">Gallery Pick</span>
        <h2 className="pk-title">معرض <em>الصور</em></h2>
        {items.length > 1 && <p className="pk-hint">← اسحبي بين المنتجات · اسحبي الصور →</p>}
      </header>

      <div className="pk-track" ref={trackRef} onScroll={onTrackScroll}>
        {items.map((p, i) => (
          <ProductSlide key={p.id} product={p} isActive={i === activeIdx} inView={inView} />
        ))}
      </div>

      {items.length > 1 && (
        <div className="pk-footer">
          <div className="pk-footer-dots">
            {items.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`pk-footer-dot${i === activeIdx ? ' is-on' : ''}`}
                onClick={() => scrollTo(i)}
                aria-label={`منتج ${i + 1}`}
              />
            ))}
          </div>
          <span className="pk-footer-count">{activeIdx + 1} / {items.length}</span>
        </div>
      )}
    </section>
  )
}
