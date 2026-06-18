import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { IMG_BASE } from '../services/api'
import { formatPercent } from '../utils/format'
import './HomeOffersSection.css'

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
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    setActiveIdx(index)
  }, [])

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track || !track.children.length) return
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
    setActiveIdx(closest)
  }, [])

  useEffect(() => {
    if (offers.length <= 1) return
    const t = setInterval(() => {
      scrollToIndex((activeIdx + 1) % offers.length)
    }, 6000)
    return () => clearInterval(t)
  }, [offers.length, activeIdx, scrollToIndex])

  if (!offers.length) return null

  return (
    <section className="ho-section" aria-label="عروض حصرية">
      <div className="ho-section-bg" aria-hidden="true" />
      <div className="ho-section-glow ho-section-glow--a" aria-hidden="true" />
      <div className="ho-section-glow ho-section-glow--b" aria-hidden="true" />

      <div className="ho-section-inner">
        <header className="ho-head">
          <div className="ho-head-text">
            <span className="ho-eyebrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l1.8 5.5H19l-4.5 3.3 1.7 5.2L12 14.8 7.8 16l1.7-5.2L5 7.5h5.2L12 2z" />
              </svg>
              عروض محدودة
            </span>
            <h2 className="ho-title">عروض حصرية</h2>
            <span className="ho-accent" aria-hidden="true" />
            <p className="ho-desc">باقات مختارة بأسعار لا تُفوَّت</p>
          </div>
          {offers.length > 1 && (
            <span className="ho-counter" aria-live="polite">
              {activeIdx + 1}
              <span className="ho-counter-sep">/</span>
              {offers.length}
            </span>
          )}
        </header>

        <div className="ho-stage">
          <div className="ho-track-wrap">
            <div
              className="ho-track"
              ref={trackRef}
              onScroll={handleScroll}
            >
              {offers.map((o, i) => {
                const discount = getDiscountPercent(o)
                const label = o.discount_label || o.title
                const showTitle = o.title && o.title !== o.discount_label

                return (
                  <Link
                    key={o.id}
                    to={getOfferLink(o)}
                    className={`ho-card${i === activeIdx ? ' is-active' : ''}`}
                  >
                    <div className="ho-card-visual">
                      {o.image ? (
                        <img src={`${IMG_BASE}${o.image}`} alt={o.title || label} loading="lazy" />
                      ) : (
                        <div className="ho-card-placeholder" aria-hidden="true" />
                      )}
                      <span className="ho-card-tag">حصري</span>
                      {discount != null && (
                        <span className="ho-card-discount">-{formatPercent(discount)}</span>
                      )}
                    </div>

                    <div className="ho-card-body">
                      <span className="ho-card-label">{label}</span>
                      {showTitle && <span className="ho-card-sub">{o.title}</span>}
                      <span className="ho-card-cta">
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
          </div>

          {offers.length > 1 && (
            <div className="ho-controls">
              <div className="ho-progress" aria-hidden="true">
                <span
                  className="ho-progress-fill"
                  style={{ width: `${((activeIdx + 1) / offers.length) * 100}%` }}
                />
              </div>
              <div className="ho-arrows">
                <button
                  type="button"
                  className="ho-arrow"
                  aria-label="العرض السابق"
                  onClick={() => scrollToIndex((activeIdx - 1 + offers.length) % offers.length)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="ho-arrow"
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
