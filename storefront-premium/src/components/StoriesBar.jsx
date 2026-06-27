import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { storiesAPI, IMG_BASE } from '../services/api'
import './StoriesBar.css'

const SWIPE_THRESHOLD = 50
const SWIPE_GROUP_THRESHOLD = 55
const TAP_MOVE_TOLERANCE = 14
const HOLD_TO_PAUSE_MS = 150
const VIEWED_KEY = 'rybella_stories_viewed_v2'

function storyViewKey(g) {
  return `${g.id}_${g.published_at || g.created_at || ''}`
}

function playVideoWithSound(video) {
  if (!video) return
  video.muted = false
  video.volume = 1
  video.play().catch(() => {
    video.muted = true
    video.play().catch(() => {})
  })
}

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
  onNextSlide,
  onPrevSlide,
  onNextGroup,
  onPrevGroup,
  isHighlight,
  headerTitle,
  headerAvatar,
}) {
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const preloadRef = useRef(null)
  const holdTimerRef = useRef(null)
  const wasHoldRef = useRef(false)
  const touchStart = useRef({ x: 0, y: 0, time: 0 })
  const rafRef = useRef(null)
  const viewerRef = useRef(null)

  const [transitionDir, setTransitionDir] = useState(null)

  const imageTimerRef = useRef(null)
  const imageStartRef = useRef(0)
  const imageElapsedRef = useRef(0)

  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMuted, setIsMuted] = useState(false)

  const currentGroup = groups[groupIndex]
  const slides = currentGroup?.slides || []
  const currentSlide = slides[slideIndex]
  const isVideo = currentSlide?.media_type === 'video'
  const imageDurationMs = (currentGroup?.duration_seconds ?? 5) * 1000
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
    setIsMuted(false)
    setTransitionDir(null)
  }, [groupIndex, slideIndex, resetProgress])

  useEffect(() => {
    setTransitionDir(null)
  }, [groupIndex])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !currentSlide || !isVideo) return

    if (isPaused) {
      v.pause()
      return
    }

    if (!isMuted) playVideoWithSound(v)
    else v.play().catch(() => {})
  }, [isPaused, currentSlide, isVideo, groupIndex, slideIndex, isMuted])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !isVideo) return
    v.muted = isMuted
    if (!isMuted) v.volume = 1

    const onLoaded = () => {
      setIsLoading(false)
      if (!isPaused) {
        if (!isMuted) playVideoWithSound(v)
        else v.play().catch(() => {})
      }
    }
    const onEnded = () => { if (!isPaused) onNextSlide() }

    v.addEventListener('loadeddata', onLoaded)
    v.addEventListener('ended', onEnded)
    return () => {
      v.removeEventListener('loadeddata', onLoaded)
      v.removeEventListener('ended', onEnded)
    }
  }, [currentSlide, isPaused, onNextSlide, groupIndex, slideIndex, isVideo, isMuted])

  useEffect(() => {
    if (!isVideo || isPaused) {
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
  }, [isPaused, groupIndex, slideIndex, isVideo])

  useEffect(() => {
    if (!currentSlide || isVideo) return
    setIsLoading(true)
    imageElapsedRef.current = 0
    imageStartRef.current = 0
  }, [currentSlide, groupIndex, slideIndex, isVideo])

  useEffect(() => {
    if (!currentSlide || isVideo || isPaused) {
      if (imageTimerRef.current) cancelAnimationFrame(imageTimerRef.current)
      return
    }
    imageStartRef.current = performance.now() - imageElapsedRef.current
    const tick = (now) => {
      imageElapsedRef.current = now - imageStartRef.current
      const pct = Math.min(100, (imageElapsedRef.current / imageDurationMs) * 100)
      setProgress(pct)
      if (pct >= 100) {
        onNextSlide()
        return
      }
      imageTimerRef.current = requestAnimationFrame(tick)
    }
    imageTimerRef.current = requestAnimationFrame(tick)
    return () => {
      if (imageTimerRef.current) cancelAnimationFrame(imageTimerRef.current)
    }
  }, [currentSlide, isVideo, isPaused, imageDurationMs, onNextSlide, groupIndex, slideIndex])

  useEffect(() => {
    if (!currentSlide) return
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') onNextSlide()
      else if (e.key === 'ArrowRight') onPrevSlide()
      else if (e.key === 'Escape') onClose()
      else if (e.key === ' ') { e.preventDefault(); setIsPaused((p) => !p) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentSlide, onNextSlide, onPrevSlide, onClose])

  const handlePointerDown = (e) => {
    if (e.target.closest('button, a, .story-viewer-top')) return
    const x = e.clientX ?? e.touches?.[0]?.clientX
    const y = e.clientY ?? e.touches?.[0]?.clientY
    touchStart.current = { x, y, time: Date.now() }
    wasHoldRef.current = false
    holdTimerRef.current = setTimeout(() => {
      wasHoldRef.current = true
      setIsPaused(true)
    }, HOLD_TO_PAUSE_MS)
  }

  const handlePointerMove = (e) => {
    const x = e.clientX ?? e.touches?.[0]?.clientX
    const y = e.clientY ?? e.touches?.[0]?.clientY
    if (x == null || y == null) return
    const dx = Math.abs(x - touchStart.current.x)
    const dy = Math.abs(y - touchStart.current.y)
    if (dx > TAP_MOVE_TOLERANCE || dy > TAP_MOVE_TOLERANCE) {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }
    }
  }

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (wasHoldRef.current) {
      wasHoldRef.current = false
      setIsPaused(false)
    }
  }

  const handleTapZone = (side, e) => {
    e.stopPropagation()
    if (wasHoldRef.current) return
    if (side === 'left') onNextSlide()
    else onPrevSlide()
  }

  const finishGesture = (clientX, clientY, target) => {
    if (target?.closest('.story-viewer-nav, .story-viewer-close, .story-viewer-mute, .story-viewer-link-btn, .story-viewer-top')) {
      if (wasHoldRef.current) {
        wasHoldRef.current = false
        setIsPaused(false)
      }
      return
    }
    if (wasHoldRef.current) {
      wasHoldRef.current = false
      setIsPaused(false)
      return
    }

    const dx = clientX - touchStart.current.x
    const dy = clientY - touchStart.current.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (dy > SWIPE_THRESHOLD && absDy > absDx) {
      onClose()
      return
    }
    if (dy < -SWIPE_THRESHOLD && absDy > absDx && currentSlide?.link_url) {
      navigate(currentSlide.link_url)
      onClose()
      return
    }

    if (absDx >= SWIPE_GROUP_THRESHOLD && absDx > absDy * 1.2) {
      if (dx < 0) {
        setTransitionDir('next')
        onNextGroup()
      } else {
        setTransitionDir('prev')
        onPrevGroup()
      }
    }
  }

  const handleTouchEnd = (e) => {
    const t = e.changedTouches[0]
    finishGesture(t.clientX, t.clientY, e.target)
    handlePointerUp()
  }

  const handleMouseUp = (e) => {
    if (e.button !== 0) return
    finishGesture(e.clientX, e.clientY, e.target)
    handlePointerUp()
  }

  if (!currentSlide) return null

  const mediaSrc = `${IMG_BASE}${currentSlide.video || currentSlide.image}`
  const nextIsVideo = nextSlide?.media_type === 'video'

  return (
    <div className="story-viewer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        ref={viewerRef}
        className="story-viewer"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handleMouseUp}
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
          <button
            type="button"
            className="story-viewer-nav story-viewer-tap-next"
            onClick={(e) => handleTapZone('left', e)}
            onTouchEnd={(e) => e.stopPropagation()}
            aria-label="التالي"
            tabIndex={-1}
          />
          <div className={`story-viewer-media ${transitionDir ? `story-enter-${transitionDir}` : ''}`}>
            {isLoading && <div className="story-viewer-loader" aria-hidden="true" />}
            {isVideo ? (
              <>
                <video
                  key={mediaSrc}
                  ref={videoRef}
                  className={`story-viewer-video ${isLoading ? 'loading' : ''}`}
                  src={mediaSrc}
                  playsInline
                  preload="auto"
                />
                {nextSlide && nextIsVideo && (
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
              </>
            ) : (
              <img
                key={mediaSrc}
                className={`story-viewer-image ${isLoading ? 'loading' : ''}`}
                src={mediaSrc}
                alt=""
                onLoad={() => setIsLoading(false)}
              />
            )}
          </div>
          <button
            type="button"
            className="story-viewer-nav story-viewer-tap-prev"
            onClick={(e) => handleTapZone('right', e)}
            onTouchEnd={(e) => e.stopPropagation()}
            aria-label="السابق"
            tabIndex={-1}
          />
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

        {isVideo && (
          <button
            type="button"
            className="story-viewer-mute"
            onClick={(e) => {
              e.stopPropagation()
              setIsMuted((m) => {
                const next = !m
                const v = videoRef.current
                if (v) {
                  v.muted = next
                  if (!next) {
                    v.volume = 1
                    v.play().catch(() => {})
                  }
                }
                return next
              })
            }}
            aria-label={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
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

  const saveViewed = useCallback((group) => {
    if (!group) return
    const key = storyViewKey(group)
    setViewedIds((prev) => {
      const next = new Set(prev)
      next.add(key)
      try { localStorage.setItem(VIEWED_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }, [])

  const openViewer = (type, groupIdx) => {
    const groups = type === 'highlight' ? highlights : storyGroups
    setViewer({ type, groupIdx, slideIdx: 0 })
    if (type === 'story') saveViewed(groups[groupIdx])
  }

  const closeViewer = () => setViewer(null)

  const navigateSlide = useCallback((direction) => {
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
        if (viewer.type === 'story') saveViewed(groups[nextIdx])
      } else {
        closeViewer()
      }
    } else if (viewer.slideIdx > 0) {
      setViewer((v) => ({ ...v, slideIdx: v.slideIdx - 1 }))
    } else if (viewer.groupIdx > 0) {
      const prevIdx = viewer.groupIdx - 1
      const prevSlides = groups[prevIdx]?.slides?.length || 1
      setViewer({ ...viewer, groupIdx: prevIdx, slideIdx: prevSlides - 1 })
    }
  }, [viewer, highlights, storyGroups, saveViewed])

  const navigateGroup = useCallback((direction) => {
    if (!viewer) return
    const groups = viewer.type === 'highlight' ? highlights : storyGroups

    if (direction === 'next') {
      if (viewer.groupIdx < groups.length - 1) {
        const nextIdx = viewer.groupIdx + 1
        setViewer({ ...viewer, groupIdx: nextIdx, slideIdx: 0 })
        if (viewer.type === 'story') saveViewed(groups[nextIdx])
      } else {
        closeViewer()
      }
    } else if (viewer.groupIdx > 0) {
      const prevIdx = viewer.groupIdx - 1
      setViewer({ ...viewer, groupIdx: prevIdx, slideIdx: 0 })
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
                  viewed={viewedIds.has(storyViewKey(g))}
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
          onNextSlide={() => navigateSlide('next')}
          onPrevSlide={() => navigateSlide('prev')}
          onNextGroup={() => navigateGroup('next')}
          onPrevGroup={() => navigateGroup('prev')}
        />
      )}
    </>
  )
}
