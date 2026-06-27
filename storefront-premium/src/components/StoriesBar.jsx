import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { storiesAPI, IMG_BASE } from '../services/api'
import './StoriesBar.css'

const SWIPE_THRESHOLD = 50
const HOLD_TO_PAUSE_MS = 150
const VIEWED_KEY = 'rybella_stories_viewed_v2'

function StoryCircle({ item, viewed, isHighlight, onClick }) {
  const label = isHighlight ? item.title : (item.publisher_name || 'يومية')
  const cover = item.cover || item.avatar
  return (
    <button
      type="button"
      className={`story-circle ${viewed && !isHighlight ? 'viewed' : ''} ${isHighlight ? 'highlight' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      <div className="story-circle-ring">
        {cover ? (
          <img src={`${IMG_BASE}${cover}`} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="story-circle-placeholder" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}
      </div>
      <span className="story-circle-name">{label}</span>
    </button>
  )
}

function StoryViewer({
  groups,
  groupIndex,
  slideIndex,
  onClose,
  onNext,
  onPrev,
  isHighlight,
  headerTitle,
  headerAvatar,
}) {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const preloadRef = useRef(null)
  const holdTimerRef = useRef(null)
  const touchStart = useRef({ x: 0, y: 0 })
  const rafRef = useRef(null)

  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const currentGroup = groups[groupIndex]
  const slides = currentGroup?.slides || []
  const currentSlide = slides[slideIndex]
  const hasPrev = slideIndex > 0 || groupIndex > 0
  const hasNext = slideIndex < slides.length - 1 || groupIndex < groups.length - 1

  const nextSlide = slideIndex < slides.length - 1
    ? slides[slideIndex + 1]
    : groups[groupIndex + 1]?.slides?.[0]

  const resetProgress = useCallback(() => {
    setProgress(0)
    setIsLoading(true)
  }, [])

  useEffect(() => {
    resetProgress()
  }, [groupIndex, slideIndex, resetProgress])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !currentSlide) return

    if (isPaused) {
      v.pause()
      return
    }

    v.play().catch(() => {})
  }, [isPaused, currentSlide, groupIndex, slideIndex])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const onLoaded = () => {
      setIsLoading(false)
      if (!isPaused) v.play().catch(() => {})
    }
    const onEnded = () => { if (!isPaused) onNext() }

    v.addEventListener('loadeddata', onLoaded)
    v.addEventListener('ended', onEnded)
    return () => {
      v.removeEventListener('loadeddata', onLoaded)
      v.removeEventListener('ended', onEnded)
    }
  }, [currentSlide, isPaused, onNext, groupIndex, slideIndex])

  useEffect(() => {
    if (isPaused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    const tick = () => {
      const v = videoRef.current
      if (v && v.duration > 0 && !v.paused) {
        setProgress((v.currentTime / v.duration) * 100)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPaused, groupIndex, slideIndex])

  useEffect(() => {
    if (!currentSlide) return
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') onPrev()
      else if (e.key === 'ArrowLeft') onNext()
      else if (e.key === 'Escape') onClose()
      else if (e.key === ' ') { e.preventDefault(); setIsPaused((p) => !p) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentSlide, onNext, onPrev, onClose])

  const handlePointerDown = (e) => {
    touchStart.current = {
      x: e.clientX ?? e.touches?.[0]?.clientX,
      y: e.clientY ?? e.touches?.[0]?.clientY,
    }
    holdTimerRef.current = setTimeout(() => setIsPaused(true), HOLD_TO_PAUSE_MS)
  }

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    setIsPaused(false)
  }

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const dx = endX - touchStart.current.x
    const dy = endY - touchStart.current.y
    if (dy > SWIPE_THRESHOLD) onClose()
    else if (dy < -SWIPE_THRESHOLD && currentSlide?.link_url) {
      navigate(currentSlide.link_url)
      onClose()
    } else if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dy) < 40) {
      if (dx > 0) onPrev()
      else onNext()
    } else if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = endX - rect.left
      if (x < rect.width * 0.33) onPrev()
      else if (x > rect.width * 0.66) onNext()
    }
  }

  if (!currentSlide) return null

  const videoSrc = `${IMG_BASE}${currentSlide.video || currentSlide.image}`

  return (
    <div className="story-viewer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="story-viewer"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; handlePointerDown(e) }}
        onTouchEnd={(e) => { handleTouchEnd(e); handlePointerUp() }}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
      >
        <div className="story-viewer-top">
          <div className="story-viewer-progress">
            {slides.map((_, i) => (
              <div key={i} className="story-viewer-progress-track">
                <div
                  className="story-viewer-progress-fill"
                  style={{
                    width: i < slideIndex ? '100%' : i === slideIndex ? `${progress}%` : '0%',
                    transition: i === slideIndex && !isPaused ? 'none' : 'width 0.15s ease',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="story-viewer-header">
            {(headerAvatar || currentGroup?.avatar) && (
              <img
                src={`${IMG_BASE}${headerAvatar || currentGroup.avatar}`}
                alt=""
                className="story-viewer-avatar"
              />
            )}
            <span className="story-viewer-title">
              {headerTitle || currentGroup?.publisher_name || currentGroup?.title || ''}
            </span>
            {isHighlight && <span className="story-viewer-badge">هايلايت</span>}
          </div>
        </div>

        <div className="story-viewer-content">
          <button type="button" className="story-viewer-nav story-viewer-prev" onClick={onPrev} aria-label="السابق" tabIndex={-1} />
          <div className="story-viewer-media">
            {isLoading && <div className="story-viewer-loader" aria-hidden="true" />}
            <video
              key={videoSrc}
              ref={videoRef}
              className={`story-viewer-video ${isLoading ? 'loading' : ''}`}
              src={videoSrc}
              playsInline
              muted
              preload="auto"
            />
            {nextSlide && (
              <video
                ref={preloadRef}
                src={`${IMG_BASE}${nextSlide.video || nextSlide.image}`}
                preload="auto"
                muted
                playsInline
                className="story-viewer-preload"
                aria-hidden="true"
              />
            )}
          </div>
          <button type="button" className="story-viewer-nav story-viewer-next" onClick={onNext} aria-label="التالي" tabIndex={-1} />
        </div>

        {isPaused && (
          <div className="story-viewer-paused" aria-live="polite">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </div>
        )}

        {currentSlide.link_url && (
          <Link to={currentSlide.link_url} className="story-viewer-link-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            عرض التفاصيل
          </Link>
        )}

        <button type="button" className="story-viewer-close" onClick={onClose} aria-label="إغلاق">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function StoriesBar() {
  const [highlights, setHighlights] = useState([])
  const [storyGroups, setStoryGroups] = useState([])
  const [viewer, setViewer] = useState(null)
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      const s = localStorage.getItem(VIEWED_KEY)
      return s ? new Set(JSON.parse(s)) : new Set()
    } catch { return new Set() }
  })

  useEffect(() => {
    storiesAPI.getAll().then((r) => {
      const data = r?.data ?? r
      if (Array.isArray(data)) {
        setStoryGroups(data)
        setHighlights([])
      } else {
        setStoryGroups(Array.isArray(data?.stories) ? data.stories : [])
        setHighlights(Array.isArray(data?.highlights) ? data.highlights : [])
      }
    }).catch(() => {
      setStoryGroups([])
      setHighlights([])
    })
  }, [])

  const saveViewed = useCallback((id) => {
    setViewedIds((prev) => {
      const next = new Set(prev)
      next.add(String(id))
      try { localStorage.setItem(VIEWED_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }, [])

  const openViewer = (type, groupIdx) => {
    const groups = type === 'highlight' ? highlights : storyGroups
    setViewer({ type, groupIdx, slideIdx: 0 })
    if (type === 'story') saveViewed(groups[groupIdx]?.id)
  }

  const closeViewer = () => setViewer(null)

  const navigateViewer = useCallback((direction) => {
    if (!viewer) return
    const groups = viewer.type === 'highlight' ? highlights : storyGroups
    const group = groups[viewer.groupIdx]
    const slideCount = group?.slides?.length || 0

    if (direction === 'next') {
      if (viewer.slideIdx < slideCount - 1) {
        setViewer((v) => ({ ...v, slideIdx: v.slideIdx + 1 }))
      } else if (viewer.groupIdx < groups.length - 1) {
        const nextIdx = viewer.groupIdx + 1
        setViewer({ ...viewer, groupIdx: nextIdx, slideIdx: 0 })
        if (viewer.type === 'story') saveViewed(groups[nextIdx]?.id)
      } else {
        closeViewer()
      }
    } else {
      if (viewer.slideIdx > 0) {
        setViewer((v) => ({ ...v, slideIdx: v.slideIdx - 1 }))
      } else if (viewer.groupIdx > 0) {
        const prevIdx = viewer.groupIdx - 1
        const prevSlides = groups[prevIdx]?.slides?.length || 1
        setViewer({ ...viewer, groupIdx: prevIdx, slideIdx: prevSlides - 1 })
      }
    }
  }, [viewer, highlights, storyGroups, saveViewed])

  if (highlights.length === 0 && storyGroups.length === 0) return null

  const activeGroups = viewer?.type === 'highlight' ? highlights : storyGroups

  return (
    <>
      <section className="stories-bar">
        {highlights.length > 0 && (
          <div className="stories-bar-section">
            <div className="stories-bar-scroll">
              {highlights.map((h, i) => (
                <StoryCircle
                  key={`hl-${h.id}`}
                  item={h}
                  isHighlight
                  viewed={false}
                  onClick={() => openViewer('highlight', i)}
                />
              ))}
            </div>
          </div>
        )}
        {storyGroups.length > 0 && (
          <div className="stories-bar-section">
            <div className="stories-bar-scroll">
              {storyGroups.map((g, i) => (
                <StoryCircle
                  key={g.id}
                  item={g}
                  viewed={viewedIds.has(String(g.id))}
                  onClick={() => openViewer('story', i)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {viewer && activeGroups[viewer.groupIdx] && (
        <StoryViewer
          groups={activeGroups}
          groupIndex={viewer.groupIdx}
          slideIndex={viewer.slideIdx}
          isHighlight={viewer.type === 'highlight'}
          headerTitle={
            viewer.type === 'highlight'
              ? activeGroups[viewer.groupIdx]?.title
              : activeGroups[viewer.groupIdx]?.publisher_name
          }
          headerAvatar={activeGroups[viewer.groupIdx]?.cover || activeGroups[viewer.groupIdx]?.avatar}
          onClose={closeViewer}
          onNext={() => navigateViewer('next')}
          onPrev={() => navigateViewer('prev')}
        />
      )}
    </>
  )
}
