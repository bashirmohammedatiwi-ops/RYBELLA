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
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const activeIdxRef = useRef(0)
  const [activeIdx, setActiveIdx] = useState(0)
  const [inView, setInView] = useState(true)

  const scrollToIndex = useCallback((index) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[index]
    if (!card) return
    track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2,
      behavior: 'smooth',
    })
    activeIdxRef.current = index
    setActiveIdx(index)
  }, [])

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track?.children.length) return
    const center = track.scrollLeft + track.clientWidth / 2
    let closest = 0
    let minDist = Infinity
    Array.from(track.children).forEach((child, i) => {
      const d = Math.abs(child.offsetLeft + child.clientWidth / 2 - center)
      if (d < minDist) {
        minDist = d
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
    if (offers.length <= 1 || !inView) return
    const t = setInterval(() => {
      scrollToIndex((activeIdxRef.current + 1) % offers.length)
    }, 6000)
    return () => clearInterval(t)
  }, [offers.length, inView, scrollToIndex])

  if (!offers.length) return null

  return (
    <section ref={sectionRef} className="ho-section" aria-label="العروض">
      <div className="ho-shell">
        <header className="ho-head">
          <h2 className="ho-title">العروض</h2>
          {offers.length > 1 && (
            <div className="ho-head-actions">
              <span className="ho-count">{activeIdx + 1} / {offers.length}</span>
              <div className="ho-nav">
                <button
                  type="button"
                  className="ho-nav-btn"
                  aria-label="العرض السابق"
                  onClick={() => scrollToIndex((activeIdx - 1 + offers.length) % offers.length)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="ho-nav-btn"
                  aria-label="العرض التالي"
                  onClick={() => scrollToIndex((activeIdx + 1) % offers.length)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </header>

        <div className="ho-track" ref={trackRef} onScroll={handleScroll}>
          {offers.map((o, i) => {
            const discount = getDiscountPercent(o)
            const label = o.discount_label || o.title || 'عرض خاص'

            return (
              <Link
                key={o.id}
                to={getOfferLink(o)}
                className={`ho-deal${i === activeIdx ? ' is-active' : ''}`}
              >
                <div className="ho-deal-visual">
                  {o.image ? (
                    <img src={`${IMG_BASE}${o.image}`} alt={label} loading="lazy" draggable={false} />
                  ) : (
                    <span className="ho-deal-fallback" aria-hidden="true" />
                  )}
                  <span className="ho-deal-shade" aria-hidden="true" />

                  {discount != null && (
                    <span className="ho-deal-stamp">
                      <span className="ho-deal-stamp-val">-{formatPercent(discount)}</span>
                      <span className="ho-deal-stamp-label">خصم</span>
                    </span>
                  )}
                </div>

                <div className="ho-deal-ticket">
                  <span className="ho-deal-notch" aria-hidden="true" />
                  <span className="ho-deal-name">{label}</span>
                  <span className="ho-deal-arrow" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        {offers.length > 1 && (
          <div className="ho-dots" role="tablist" aria-label="العروض">
            {offers.map((o, i) => (
              <button
                key={o.id}
                type="button"
                role="tab"
                aria-selected={i === activeIdx}
                className={`ho-dot${i === activeIdx ? ' is-on' : ''}`}
                onClick={() => scrollToIndex(i)}
                aria-label={`عرض ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
