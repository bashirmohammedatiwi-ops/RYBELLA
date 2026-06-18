import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'
import { formatPercent } from '../utils/format'
import './HomeOffersSection.css'

const CARD_THEMES = [
  { accent: '#E85D7A', glow: 'rgba(232, 93, 122, 0.35)' },
  { accent: '#A878FF', glow: 'rgba(168, 120, 255, 0.32)' },
  { accent: '#FF9862', glow: 'rgba(255, 152, 98, 0.32)' },
  { accent: '#D14A66', glow: 'rgba(209, 74, 102, 0.34)' },
]

function getOfferLink(offer) {
  return offer.product_ids ? `/offers/${offer.id}` : '/explore'
}

function getDiscountPercent(offer) {
  const n = Number(offer?.discount_percent)
  return Number.isFinite(n) && n > 0 ? n : null
}

export default function HomeOffersSection({ offers = [] }) {
  const trackRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)

  const scrollToIndex = useCallback((index) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[index]
    if (!card) return
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' })
    setActiveIdx(index)
  }, [])

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track || !track.children.length) return
    const trackLeft = track.scrollLeft
    let closest = 0
    let minDist = Infinity
    Array.from(track.children).forEach((child, i) => {
      const dist = Math.abs(child.offsetLeft - track.offsetLeft - trackLeft)
      if (dist < minDist) {
        minDist = dist
        closest = i
      }
    })
    setActiveIdx(closest)
  }, [])

  useEffect(() => {
    if (offers.length <= 1) return
    const t = setInterval(() => {
      const track = trackRef.current
      if (!track || !track.children.length) return
      const trackLeft = track.scrollLeft
      let closest = 0
      let minDist = Infinity
      Array.from(track.children).forEach((child, i) => {
        const dist = Math.abs(child.offsetLeft - track.offsetLeft - trackLeft)
        if (dist < minDist) {
          minDist = dist
          closest = i
        }
      })
      scrollToIndex((closest + 1) % offers.length)
    }, 5500)
    return () => clearInterval(t)
  }, [offers.length, scrollToIndex])

  if (!offers.length) return null

  return (
    <section className="home-offers-section" aria-label="عروض حصرية">
      <div className="home-offers-section-bg" aria-hidden="true" />
      <div className="home-offers-section-glow home-offers-section-glow--a" aria-hidden="true" />
      <div className="home-offers-section-glow home-offers-section-glow--b" aria-hidden="true" />

      <div className="home-offers-section-inner">
        <header className="home-offers-section-head">
          <div className="home-offers-section-head-text">
            <span className="home-offers-eyebrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l1.8 5.5H19l-4.5 3.3 1.7 5.2L12 14.8 7.8 16l1.7-5.2L5 7.5h5.2L12 2z" />
              </svg>
              عروض محدودة
            </span>
            <h2 className="home-offers-section-title">عروض حصرية</h2>
            <span className="home-offers-section-accent" aria-hidden="true" />
            <p className="home-offers-section-desc">خصومات مختارة — لا تفوتي الفرصة</p>
          </div>
          <span className="home-offers-section-count">{offers.length} عروض</span>
        </header>

        <div className="home-offers-track-wrap">
          <div
            className="home-offers-track"
            ref={trackRef}
            onScroll={handleScroll}
          >
            {offers.map((o, i) => {
              const theme = CARD_THEMES[i % CARD_THEMES.length]
              const discount = getDiscountPercent(o)
              const label = o.discount_label || o.title
              const showTitle = o.title && o.title !== o.discount_label

              return (
                <Link
                  key={o.id}
                  to={getOfferLink(o)}
                  className="home-offers-card"
                  style={{ '--offer-accent': theme.accent, '--offer-glow': theme.glow }}
                >
                  <div className="home-offers-card-accent-line" aria-hidden="true" />
                  <div className="home-offers-card-media">
                    {o.image ? (
                      <img src={`${IMG_BASE}${o.image}`} alt={o.title || label} loading="lazy" />
                    ) : (
                      <div className="home-offers-card-placeholder" aria-hidden="true" />
                    )}
                    <div className="home-offers-card-shimmer" aria-hidden="true" />
                    <div className="home-offers-card-gradient" aria-hidden="true" />
                  </div>

                  <span className="home-offers-card-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2l1.8 5.5H19l-4.5 3.3 1.7 5.2L12 14.8 7.8 16l1.7-5.2L5 7.5h5.2L12 2z" />
                    </svg>
                    حصري
                  </span>

                  {discount != null && (
                    <span className="home-offers-card-discount">-{formatPercent(discount)}</span>
                  )}

                  <div className="home-offers-card-body">
                    <span className="home-offers-card-label">{label}</span>
                    {showTitle && <span className="home-offers-card-subtitle">{o.title}</span>}
                    <span className="home-offers-card-cta">
                      اكتشفي العرض
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

          {offers.length > 1 && (
            <div className="home-offers-nav">
              <div className="home-offers-dots" role="tablist" aria-label="تنقل العروض">
                {offers.map((o, i) => (
                  <button
                    key={o.id}
                    type="button"
                    role="tab"
                    aria-selected={i === activeIdx}
                    aria-label={`عرض ${i + 1}`}
                    className={`home-offers-dot${i === activeIdx ? ' active' : ''}`}
                    onClick={() => scrollToIndex(i)}
                  />
                ))}
              </div>
              <div className="home-offers-arrows">
                <button
                  type="button"
                  className="home-offers-arrow"
                  aria-label="العرض السابق"
                  onClick={() => scrollToIndex((activeIdx - 1 + offers.length) % offers.length)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="home-offers-arrow"
                  aria-label="العرض التالي"
                  onClick={() => scrollToIndex((activeIdx + 1) % offers.length)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
