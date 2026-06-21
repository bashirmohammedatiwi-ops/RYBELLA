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

function collectGroupImages(products, limit = 6) {
  const out = []
  products.forEach((p) => {
    getProductImages(p).forEach((src) => {
      if (out.length < limit && !out.some((x) => x.src === src)) {
        out.push({ src, product: p })
      }
    })
  })
  return out
}

function buildLookbookGroups(products, featured, bestSellers) {
  const seen = new Set()
  const all = [...featured, ...bestSellers, ...products].filter((p) => {
    if (!p?.id || seen.has(p.id)) return false
    seen.add(p.id)
    return getProductImages(p).length >= 1
  })
  if (all.length < 2) return []

  const groups = []

  const featuredPool = all.filter((p) => isTruthyFlag(p.is_featured))
  if (featuredPool.length >= 2) {
    groups.push({
      id: 'featured',
      label: '01 — VIP',
      headline: 'تشكيلة النجوم',
      hook: 'منتجاتنا الأكثر تميزاً — شاهديها من كل زاوية',
      cta: 'تسوقي التشكيلة',
      link: '/explore?featured=1',
      products: featuredPool.slice(0, 5),
      tone: 'noir',
    })
  }

  const bestPool = all.filter((p) => isTruthyFlag(p.is_best_seller))
  if (bestPool.length >= 2) {
    groups.push({
      id: 'bestseller',
      label: '02 — TRENDING',
      headline: 'الأكثر مبيعاً',
      hook: 'ما تختاره آلاف العميلات — صور حقيقية من المعرض',
      cta: 'اكتشفي الأكثر طلباً',
      link: '/explore',
      products: bestPool.slice(0, 5),
      tone: 'wine',
    })
  }

  const rich = [...all].sort((a, b) => getProductImages(b).length - getProductImages(a).length)
  const galleryPool = rich.filter((p) => getProductImages(p).length >= 2).slice(0, 5)
  if (galleryPool.length >= 2) {
    groups.push({
      id: 'gallery',
      label: '03 — LOOKBOOK',
      headline: 'معرض الصور',
      hook: 'كل لقطة تكشف تفصيلاً جديداً — مجموعة متجدّدة',
      cta: 'استكشفي المعرض',
      link: '/explore',
      products: galleryPool,
      tone: 'blush',
    })
  }

  if (all.length >= 3) {
    const pick = [...all].sort(() => Math.random() - 0.5).slice(0, 5)
    groups.push({
      id: 'fresh',
      label: '04 — NEW DROP',
      headline: 'اختيار اللحظة',
      hook: 'تشكيلة جديدة تتغيّر — لا تفوّتي الفرصة',
      cta: 'تسوقي الآن',
      link: '/explore',
      products: pick,
      tone: 'rose',
    })
  }

  return groups.slice(0, 4)
}

function LookbookBoard({ group, isActive, focusIdx }) {
  const tiles = collectGroupImages(group.products, 6)
  const heroProduct = group.products[0]

  return (
    <article className={`hl-board hl-board--${group.tone}${isActive ? ' is-active' : ''}`}>
      <div className="hl-board-mosaic" aria-hidden={!isActive}>
        {tiles.map((tile, i) => (
          <div
            key={`${tile.src}-${i}`}
            className={`hl-tile hl-tile--${i}${i === focusIdx % Math.max(tiles.length, 1) ? ' is-focused' : ''}`}
          >
            <img src={`${IMG_BASE}${tile.src}`} alt="" loading="lazy" />
            <span className="hl-tile-shine" />
          </div>
        ))}
        {tiles.length < 6 &&
          Array.from({ length: 6 - tiles.length }).map((_, i) => (
            <div key={`ph-${i}`} className={`hl-tile hl-tile--${tiles.length + i} hl-tile--ghost`} aria-hidden="true" />
          ))}
      </div>

      <div className="hl-board-veil" aria-hidden="true" />

      <div className="hl-board-content">
        <span className="hl-board-label">{group.label}</span>
        <h3 className="hl-board-headline">{group.headline}</h3>
        <p className="hl-board-hook">{group.hook}</p>

        <div className="hl-board-products">
          {group.products.slice(0, 4).map((p) => {
            const thumb = getProductImages(p)[0]
            return (
              <Link key={p.id} to={`/products/${p.id}`} className="hl-board-product" title={p.name}>
                {thumb ? <img src={`${IMG_BASE}${thumb}`} alt="" loading="lazy" /> : <span>✦</span>}
                <span className="hl-board-product-meta">
                  <strong>{p.name}</strong>
                  <em>{formatPrice(getMinPrice(p))}</em>
                </span>
              </Link>
            )
          })}
        </div>

        <Link to={group.link} className="hl-board-cta">
          <span>{group.cta}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>

        {heroProduct && (
          <Link to={`/products/${heroProduct.id}`} className="hl-board-featured-tag">
            {heroProduct.name}
          </Link>
        )}
      </div>
    </article>
  )
}

export default function HomeSpotlightAdsSection({ products = [], featured = [], bestSellers = [] }) {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const activeIdxRef = useRef(0)
  const [activeIdx, setActiveIdx] = useState(0)
  const [focusIdx, setFocusIdx] = useState(0)
  const [inView, setInView] = useState(false)

  const groups = useMemo(
    () => buildLookbookGroups(products, featured, bestSellers),
    [products, featured, bestSellers]
  )

  const scrollToIndex = useCallback((index) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[index]
    if (!card) return
    const targetLeft = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2
    track.scrollTo({ left: targetLeft, behavior: 'smooth' })
    activeIdxRef.current = index
    setActiveIdx(index)
    setFocusIdx(0)
  }, [])

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track?.children.length) return
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
    if (!inView || groups.length <= 1) return
    const t = setInterval(() => {
      scrollToIndex((activeIdxRef.current + 1) % groups.length)
    }, 7500)
    return () => clearInterval(t)
  }, [inView, groups.length, scrollToIndex])

  useEffect(() => {
    if (!inView) return
    const t = setInterval(() => setFocusIdx((i) => i + 1), 3200)
    return () => clearInterval(t)
  }, [inView, activeIdx])

  if (!groups.length) return null

  return (
    <section ref={sectionRef} className="hl-section" aria-label="تشكيلات Rybella">
      <div className="hl-section-glow" aria-hidden="true" />

      <header className="hl-head">
        <div className="hl-head-main">
          <span className="hl-eyebrow">Rybella Curated</span>
          <h2 className="hl-title">تشكيلات تُلهمك</h2>
          <p className="hl-desc">معرض صور حيّ · مجموعات منتجات تتجدّد تلقائياً</p>
        </div>
        {groups.length > 1 && (
          <div className="hl-head-nav">
            <span className="hl-counter">
              {String(activeIdx + 1).padStart(2, '0')}
              <span className="hl-counter-sep">/</span>
              {String(groups.length).padStart(2, '0')}
            </span>
            <div className="hl-dots">
              {groups.map((g, i) => (
                <button
                  key={g.id}
                  type="button"
                  className={`hl-dot${i === activeIdx ? ' is-active' : ''}`}
                  onClick={() => scrollToIndex(i)}
                  aria-label={`تشكيلة ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="hl-stage">
        <div className="hl-track" ref={trackRef} onScroll={handleScroll}>
          {groups.map((group, i) => (
            <LookbookBoard
              key={group.id}
              group={group}
              isActive={i === activeIdx}
              focusIdx={i === activeIdx ? focusIdx : 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
