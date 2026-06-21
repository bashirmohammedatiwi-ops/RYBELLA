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

function buildSpotlightGroups(products, featured, bestSellers) {
  const seen = new Set()
  const all = [...featured, ...bestSellers, ...products].filter((p) => {
    if (!p?.id || seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  const withGallery = all.filter((p) => getProductImages(p).length >= 2)
  const pool = withGallery.length >= 2 ? withGallery : all.filter((p) => getProductImages(p).length >= 1)
  if (pool.length < 2) return []

  const groups = []

  const featuredPool = pool.filter((p) => isTruthyFlag(p.is_featured))
  if (featuredPool.length >= 2) {
    groups.push({
      id: 'featured',
      tag: 'تشكيلة VIP',
      title: 'لمسة فخامة',
      highlight: 'تستحقينها اليوم',
      subtitle: 'صور إضافية حصرية من منتجاتنا المميزة — اكتشفي كل تفصيل',
      cta: 'تسوقي المميز',
      link: '/explore?featured=1',
      products: featuredPool.slice(0, 4),
      theme: 'rose',
    })
  }

  const bestPool = pool.filter((p) => isTruthyFlag(p.is_best_seller))
  if (bestPool.length >= 2) {
    groups.push({
      id: 'bestseller',
      tag: 'الأكثر طلباً',
      title: 'اختاري الأفضل',
      highlight: 'كالجماليات المحبوبة',
      subtitle: 'مجموعة الأكثر مبيعاً — صور حقيقية من زبائننا ومعرض المنتج',
      cta: 'شاهدي الأكثر مبيعاً',
      link: '/explore',
      products: bestPool.slice(0, 4),
      theme: 'gold',
    })
  }

  const richGallery = [...pool].sort((a, b) => getProductImages(b).length - getProductImages(a).length)
  const gallerySlice = richGallery.slice(0, 4)
  if (gallerySlice.length >= 2 && !groups.some((g) => g.id === 'gallery')) {
    groups.push({
      id: 'gallery',
      tag: 'معرض الصور',
      title: 'كل زاوية',
      highlight: 'تبرز جمالك',
      subtitle: 'معرض صور إضافي لمجموعة مختارة — شاهدي المنتج من كل زاوية',
      cta: 'استكشفي المجموعة',
      link: '/explore',
      products: gallerySlice,
      theme: 'blush',
    })
  }

  if (pool.length >= 3) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 4)
    groups.push({
      id: 'daily-pick',
      tag: 'اختيار اليوم',
      title: 'عرض محدود',
      highlight: 'لفترة قصيرة',
      subtitle: 'تشكيلة متجددة تجمع أفضل المنتجات بصورها الإضافية',
      cta: 'تسوقي الآن',
      link: '/explore',
      products: shuffled,
      theme: 'coral',
    })
  }

  return groups.slice(0, 4)
}

function SpotlightSlide({ group, isActive, heroIdx }) {
  const heroProduct = group.products[0]
  const heroImages = getProductImages(heroProduct)
  const sideProducts = group.products.slice(1)

  return (
    <article
      className={`hsa-slide hsa-slide--${group.theme}${isActive ? ' is-active' : ''}`}
      aria-hidden={!isActive}
    >
      <div className="hsa-slide-bg" aria-hidden="true" />
      <div className="hsa-slide-spark hsa-slide-spark--1" aria-hidden="true" />
      <div className="hsa-slide-spark hsa-slide-spark--2" aria-hidden="true" />

      <div className="hsa-visual">
        <div className="hsa-hero-ring" aria-hidden="true" />
        <div className="hsa-hero-stack">
          {heroImages.map((img, i) => (
            <img
              key={`${group.id}-hero-${i}`}
              src={`${IMG_BASE}${img}`}
              alt=""
              className={`hsa-hero-img${i === heroIdx % heroImages.length ? ' is-visible' : ''}`}
              loading="lazy"
            />
          ))}
        </div>

        <div className="hsa-orbit">
          {sideProducts.map((p, i) => {
            const imgs = getProductImages(p)
            const extra = imgs[1] || imgs[0]
            if (!extra) return null
            return (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className={`hsa-orbit-item hsa-orbit-item--${i + 1}`}
                aria-label={p.name}
              >
                <img src={`${IMG_BASE}${extra}`} alt="" loading="lazy" />
                <span className="hsa-orbit-glow" aria-hidden="true" />
              </Link>
            )
          })}
        </div>

        <Link to={`/products/${heroProduct.id}`} className="hsa-hero-link" aria-label={heroProduct.name}>
          <span className="hsa-hero-price">{formatPrice(getMinPrice(heroProduct))}</span>
        </Link>
      </div>

      <div className="hsa-copy">
        <span className="hsa-tag">{group.tag}</span>
        <h3 className="hsa-title">
          {group.title}
          <em>{group.highlight}</em>
        </h3>
        <p className="hsa-subtitle">{group.subtitle}</p>

        <div className="hsa-chips">
          {group.products.map((p) => {
            const thumb = getProductImages(p)[0]
            return (
              <Link key={p.id} to={`/products/${p.id}`} className="hsa-chip" title={p.name}>
                {thumb ? <img src={`${IMG_BASE}${thumb}`} alt="" loading="lazy" /> : <span>✦</span>}
                <span className="hsa-chip-name">{p.name}</span>
              </Link>
            )
          })}
        </div>

        <Link to={group.link} className="hsa-cta">
          <span>{group.cta}</span>
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
  const [inView, setInView] = useState(false)
  const [groupIdx, setGroupIdx] = useState(0)
  const [heroIdx, setHeroIdx] = useState(0)
  const [fadeKey, setFadeKey] = useState(0)

  const groups = useMemo(
    () => buildSpotlightGroups(products, featured, bestSellers),
    [products, featured, bestSellers]
  )

  const activeGroup = groups[groupIdx]

  const nextGroup = useCallback(() => {
    if (groups.length <= 1) return
    setGroupIdx((i) => (i + 1) % groups.length)
    setHeroIdx(0)
    setFadeKey((k) => k + 1)
  }, [groups.length])

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
    if (!inView || groups.length <= 1) return
    const t = setInterval(nextGroup, 9000)
    return () => clearInterval(t)
  }, [inView, groups.length, nextGroup])

  useEffect(() => {
    if (!inView || !activeGroup) return
    const heroImages = getProductImages(activeGroup.products[0])
    if (heroImages.length <= 1) return
    const t = setInterval(() => setHeroIdx((i) => i + 1), 3800)
    return () => clearInterval(t)
  }, [inView, activeGroup, groupIdx])

  if (!groups.length) return null

  return (
    <section ref={sectionRef} className="hsa-section" aria-label="إعلانات مميزة">
      <div className="hsa-section-head">
        <div>
          <span className="hsa-eyebrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.8 5.7 21l2.3-7-6-4.6h7.6L12 2z" />
            </svg>
            اكتشفي المزيد
          </span>
          <h2 className="hsa-head-title">عروض بصريّة حصرية</h2>
          <p className="hsa-head-desc">مجموعات منتجات متجددة — صور إضافية حقيقية</p>
        </div>
        {groups.length > 1 && (
          <div className="hsa-progress" aria-hidden="true">
            {groups.map((g, i) => (
              <button
                key={g.id}
                type="button"
                className={`hsa-progress-dot${i === groupIdx ? ' is-active' : ''}`}
                onClick={() => { setGroupIdx(i); setHeroIdx(0) }}
                aria-label={`مجموعة ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="hsa-stage" key={fadeKey}>
        {groups.map((group, i) => (
          <SpotlightSlide
            key={group.id}
            group={group}
            isActive={i === groupIdx}
            heroIdx={i === groupIdx ? heroIdx : 0}
          />
        ))}
      </div>

      {groups.length > 1 && (
        <div className="hsa-timer-bar" aria-hidden="true">
          <span className="hsa-timer-fill" key={`${groupIdx}-${fadeKey}`} />
        </div>
      )}
    </section>
  )
}
