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

function ProductSlide({ product, isActive, inView }) {
  const images = getProductImages(product)
  const galleryRef = useRef(null)
  const [imgIdx, setImgIdx] = useState(0)
  const imgIdxRef = useRef(0)

  const syncGalleryScroll = useCallback(() => {
    const track = galleryRef.current
    if (!track || !track.clientWidth) return
    const idx = Math.round(track.scrollLeft / track.clientWidth)
    if (idx !== imgIdxRef.current) {
      imgIdxRef.current = idx
      setImgIdx(idx)
    }
  }, [])

  const scrollToImage = useCallback((idx) => {
    const track = galleryRef.current
    if (!track) return
    track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' })
    imgIdxRef.current = idx
    setImgIdx(idx)
  }, [])

  useEffect(() => {
    imgIdxRef.current = 0
    setImgIdx(0)
    const track = galleryRef.current
    if (track) track.scrollLeft = 0
  }, [product.id])

  useEffect(() => {
    if (!isActive || !inView || images.length <= 1) return
    const t = setInterval(() => {
      const next = (imgIdxRef.current + 1) % images.length
      scrollToImage(next)
    }, 4000)
    return () => clearInterval(t)
  }, [isActive, inView, images.length, product.id, scrollToImage])

  return (
    <article className={`bx-slide${isActive ? ' is-active' : ''}`}>
      <div className="bx-slide-glow" aria-hidden="true" />

      <div className="bx-gallery-wrap">
        <div
          className="bx-gallery-track"
          ref={galleryRef}
          onScroll={syncGalleryScroll}
        >
          {images.map((src, i) => (
            <div key={src} className="bx-gallery-pane">
              <img src={`${IMG_BASE}${src}`} alt="" loading={i === 0 ? 'eager' : 'lazy'} draggable={false} />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <div className="bx-gallery-dots">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={`bx-gallery-dot${i === imgIdx ? ' is-on' : ''}`}
                  onClick={() => scrollToImage(i)}
                  aria-label={`صورة ${i + 1}`}
                />
              ))}
            </div>
            <span className="bx-swipe-hint" aria-hidden="true">← اسحبي →</span>
          </>
        )}
      </div>

      <div className="bx-slide-body">
        <div className="bx-slide-meta">
          {isTruthyFlag(product.is_featured) && <span className="bx-pill">مميز</span>}
          {isTruthyFlag(product.is_best_seller) && <span className="bx-pill bx-pill--hot">الأكثر مبيعاً</span>}
          {(product.brand_name || product.category_name) && (
            <span className="bx-brand">{product.brand_name || product.category_name}</span>
          )}
        </div>

        <h3 className="bx-name">{product.name}</h3>
        <p className="bx-price">{formatPrice(getMinPrice(product))}</p>

        <Link to={`/products/${product.id}`} className="bx-cta">
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
  const userScrollingRef = useRef(false)
  const scrollPauseRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [inView, setInView] = useState(false)

  const items = useMemo(
    () => buildSpotlightProducts(products, featured, bestSellers),
    [products, featured, bestSellers]
  )

  const scrollToProduct = useCallback((index) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[index]
    if (!card) return
    const targetLeft = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2
    track.scrollTo({ left: targetLeft, behavior: 'smooth' })
    activeIdxRef.current = index
    setActiveIdx(index)
  }, [])

  const handleTrackScroll = useCallback(() => {
    const track = trackRef.current
    if (!track?.children.length) return

    userScrollingRef.current = true
    if (scrollPauseRef.current) clearTimeout(scrollPauseRef.current)
    scrollPauseRef.current = window.setTimeout(() => {
      userScrollingRef.current = false
    }, 8000)

    const center = track.scrollLeft + track.clientWidth / 2
    let closest = 0
    let minDist = Infinity
    Array.from(track.children).forEach((child, i) => {
      const childCenter = child.offsetLeft + child.clientWidth / 2
      const dist = Math.abs(childCenter - center)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    })
    activeIdxRef.current = closest
    setActiveIdx(closest)
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || items.length <= 1) return
    const t = setInterval(() => {
      if (userScrollingRef.current) return
      scrollToProduct((activeIdxRef.current + 1) % items.length)
    }, 8500)
    return () => clearInterval(t)
  }, [inView, items.length, scrollToProduct])

  useEffect(() => () => {
    if (scrollPauseRef.current) clearTimeout(scrollPauseRef.current)
  }, [])

  if (!items.length) return null

  return (
    <section ref={sectionRef} className="bx-section" aria-label="منتج مميز">
      <div className="bx-mesh" aria-hidden="true" />

      <header className="bx-head">
        <div className="bx-head-row">
          <div>
            <span className="bx-kicker">✦ Rybella Pick</span>
            <h2 className="bx-title">لمسة واحدة <em>تغيّر يومك</em></h2>
          </div>
          {items.length > 1 && (
            <span className="bx-counter">
              {String(activeIdx + 1).padStart(2, '0')}
              <span className="bx-counter-sep">/</span>
              {String(items.length).padStart(2, '0')}
            </span>
          )}
        </div>

        {items.length > 1 && (
          <div className="bx-story-bars" aria-hidden="true">
            {items.map((p, i) => (
              <span
                key={p.id}
                className={`bx-story-bar${i === activeIdx ? ' is-active' : ''}${i < activeIdx ? ' is-done' : ''}`}
              />
            ))}
          </div>
        )}

        {items.length > 1 && (
          <p className="bx-swipe-tip">اسحبي يميناً ويساراً للتنقل بين المنتجات</p>
        )}
      </header>

      <div className="bx-stage">
        <div className="bx-track" ref={trackRef} onScroll={handleTrackScroll}>
          {items.map((p, i) => (
            <ProductSlide
              key={p.id}
              product={p}
              isActive={i === activeIdx}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
