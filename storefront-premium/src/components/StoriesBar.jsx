import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { storiesAPI, IMG_BASE } from '../services/api'
import './StoriesBar.css'

const SWIPE_THRESHOLD = 50
const HOLD_TO_PAUSE_MS = 150
const VIEWED_KEY = 'rybella_stories_viewed'

export default function StoriesBar() {
  const touchStart = useRef({ x: 0, y: 0 })
  const videoRef = useRef(null)
  const holdTimerRef = useRef(null)
  const navigate = useNavigate()
  const [storyGroups, setStoryGroups] = useState([])
  const [viewerOpen, setViewerOpen] = useState(false)
  const [storyIndex, setStoryIndex] = useState(0)
  const [slideIndex, setSlideIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [videoRemainingSec, setVideoRemainingSec] = useState(5)
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      const s = localStorage.getItem(VIEWED_KEY)
      return s ? new Set(JSON.parse(s)) : new Set()
    } catch { return new Set() }
  })

  useEffect(() => {
    storiesAPI.getAll().then((r) => {
      const arr = Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : [])
      setStoryGroups(arr)
    }).catch(() => setStoryGroups([]))
  }, [])

  const saveViewed = useCallback((id) => {
    setViewedIds((prev) => {
      const next = new Set(prev)
      next.add(String(id))
      try { localStorage.setItem(VIEWED_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }, [])

  const currentGroup = storyGroups[storyIndex]
  const currentSlide = currentGroup?.slides?.[slideIndex]
  const allSlides = useMemo(() => storyGroups.flatMap((g) => g.slides || []), [storyGroups])
  const currentSegmentIndex = useMemo(() => {
    let idx = 0
    for (let i = 0; i < storyIndex; i++) idx += (storyGroups[i]?.slides?.length || 0)
    return idx + slideIndex
  }, [storyGroups, storyIndex, slideIndex])

  const hasNextSlide = currentGroup && slideIndex < (currentGroup.slides?.length || 0) - 1
  const hasNextStory = storyIndex < storyGroups.length - 1
  const hasPrevSlide = slideIndex > 0
  const hasPrevStory = storyIndex > 0

  const openViewer = (groupIdx) => {
    setStoryIndex(groupIdx)
    setSlideIndex(0)
    setProgress(0)
    setElapsedSeconds(0)
    setIsPaused(false)
    setVideoRemainingSec(storyGroups[groupIdx]?.duration_seconds ?? 5)
    setViewerOpen(true)
    saveViewed(storyGroups[groupIdx]?.id)
  }

  const closeViewer = useCallback(() => {
    setViewerOpen(false)
    setIsPaused(false)
  }, [])

  const goNext = useCallback(() => {
    setElapsedSeconds(0)
    setIsPaused(false)
    const nextGroup = hasNextSlide ? currentGroup : storyGroups[storyIndex + 1]
    setVideoRemainingSec(nextGroup?.duration_seconds ?? 5)
    if (hasNextSlide) {
      setSlideIndex((i) => i + 1)
      setProgress(0)
    } else if (hasNextStory) {
      setStoryIndex((i) => i + 1)
      setSlideIndex(0)
      setProgress(0)
      saveViewed(storyGroups[storyIndex + 1]?.id)
    } else {
      closeViewer()
    }
  }, [hasNextSlide, hasNextStory, closeViewer, currentGroup, storyGroups, storyIndex, saveViewed])

  const goPrev = useCallback(() => {
    setElapsedSeconds(0)
    setIsPaused(false)
    const prevGroup = hasPrevSlide ? currentGroup : storyGroups[storyIndex - 1]
    setVideoRemainingSec(prevGroup?.duration_seconds ?? 5)
    if (hasPrevSlide) {
      setSlideIndex((i) => i - 1)
      setProgress(0)
    } else if (hasPrevStory) {
      setStoryIndex((i) => i - 1)
      const prevSlides = storyGroups[storyIndex - 1]?.slides || []
      setSlideIndex(prevSlides.length - 1)
      setProgress(0)
    }
  }, [hasPrevSlide, hasPrevStory, storyIndex, storyGroups, currentGroup])

  const isVideo = currentSlide?.media_type === 'video'
  const storyDuration = (currentGroup?.duration_seconds ?? 5) * 1000
  const durationSec = currentGroup?.duration_seconds ?? 5
  const displaySeconds = isVideo ? videoRemainingSec : Math.max(0, durationSec - elapsedSeconds)

  const handleProgress = useCallback(() => {
    if (isPaused) return
    setProgress((p) => {
      const step = p + 2
      if (step >= 100) {
        goNext()
        return 0
      }
      return step
    })
    setElapsedSeconds((s) => s + 0.1)
  }, [goNext, isPaused])

  useEffect(() => {
    if (!viewerOpen || !isVideo) return
    const v = videoRef.current
    if (v) {
      if (isPaused) v.pause()
      else v.play().catch(() => {})
    }
  }, [isPaused, viewerOpen, isVideo])

  useEffect(() => {
    if (!viewerOpen || !currentSlide) return
    if (isVideo) {
      const v = videoRef.current
      if (!v) return
      const onLoadedMetadata = () => { if (v.duration > 0) setVideoRemainingSec(v.duration) }
      const onTimeUpdate = () => {
        if (isPaused) return
        if (v.duration > 0) {
          setProgress((v.currentTime / v.duration) * 100)
          setVideoRemainingSec(Math.max(0, v.duration - v.currentTime))
        }
      }
      const onEnded = () => { if (!isPaused) { setProgress(100); goNext() } }
      v.addEventListener('loadedmetadata', onLoadedMetadata)
      v.addEventListener('timeupdate', onTimeUpdate)
      v.addEventListener('ended', onEnded)
      return () => {
        v.removeEventListener('loadedmetadata', onLoadedMetadata)
        v.removeEventListener('timeupdate', onTimeUpdate)
        v.removeEventListener('ended', onEnded)
      }
    }
    const t = setInterval(handleProgress, storyDuration / 50)
    return () => clearInterval(t)
  }, [viewerOpen, currentSlide, storyIndex, slideIndex, handleProgress, isVideo, goNext, storyDuration, isPaused])

  const handlePointerDown = (e) => {
    touchStart.current = { x: e.clientX ?? e.touches?.[0]?.clientX, y: e.clientY ?? e.touches?.[0]?.clientY }
    holdTimerRef.current = setTimeout(() => setIsPaused(true), HOLD_TO_PAUSE_MS)
  }
  const handlePointerUp = (e) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    setIsPaused(false)
  }
  const handlePointerMove = (e) => {
    if (holdTimerRef.current) {
      const x = e.clientX ?? e.touches?.[0]?.clientX
      const y = e.clientY ?? e.touches?.[0]?.clientY
      if (Math.abs(x - touchStart.current.x) > 20 || Math.abs(y - touchStart.current.y) > 20) {
        clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }
    }
  }

  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const dx = endX - touchStart.current.x
    const dy = endY - touchStart.current.y
    if (dy > SWIPE_THRESHOLD) closeViewer()
    else if (dy < -SWIPE_THRESHOLD && currentSlide?.link_url) {
      navigate(currentSlide.link_url)
      closeViewer()
    } else if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dy) < 40) {
      if (dx > 0) goPrev()
      else goNext()
    } else if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      const rect = e.target.closest('.story-viewer')?.getBoundingClientRect()
      if (rect) {
        const x = endX - rect.left
        if (x < rect.width * 0.33) goPrev()
        else if (x > rect.width * 0.66) goNext()
      }
    }
  }

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const w = rect.width
    if (x < w * 0.33) goPrev()
    else if (x > w * 0.66) goNext()
  }

  useEffect(() => {
    if (!viewerOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goPrev()
      else if (e.key === 'ArrowLeft') goNext()
      else if (e.key === 'Escape') closeViewer()
      else if (e.key === ' ') { e.preventDefault(); setIsPaused((p) => !p) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewerOpen, goNext, goPrev, closeViewer])

  if (storyGroups.length === 0) return null

  return (
    <>
      <section className="stories-bar">
        <div className="stories-bar-scroll">
          {storyGroups.map((g, i) => {
            const viewed = viewedIds.has(String(g.id))
            return (
              <button
                key={g.id}
                type="button"
                className={`story-circle ${viewed ? 'viewed' : ''}`}
                onClick={() => openViewer(i)}
                aria-label={g.publisher_name || `يومية ${i + 1}`}
              >
                <div className="story-circle-ring">
                  {(g.avatar || (g.cover && g.cover_media_type !== 'video')) ? (
                    <img src={`${IMG_BASE}${g.avatar || g.cover}`} alt={g.publisher_name || ''} />
                  ) : (
                    <span className="story-circle-placeholder" title="فيديو">▶</span>
                  )}
                </div>
                {g.publisher_name && <span className="story-circle-name">{g.publisher_name}</span>}
              </button>
            )
          })}
        </div>
      </section>

      {viewerOpen && currentSlide && (
        <div className="story-viewer-overlay" onClick={closeViewer}>
          <div
            className="story-viewer"
            onClick={(e) => { e.stopPropagation(); handleClick(e) }}
            onTouchStart={(e) => { handleTouchStart(e); handlePointerDown(e) }}
            onTouchEnd={(e) => { handleTouchEnd(e); handlePointerUp(e) }}
            onTouchMove={handlePointerMove}
            onMouseDown={handlePointerDown}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
          >
            {isPaused && <div className="story-viewer-paused">مُوقَف</div>}
            <div className="story-viewer-top">
              <div className="story-viewer-progress">
                {allSlides.map((_, i) => (
                  <div key={i} className="story-viewer-progress-track">
                    <div
                      className="story-viewer-progress-fill"
                      style={{
                        width: i < currentSegmentIndex ? '100%' : i === currentSegmentIndex ? `${progress}%` : '0%',
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="story-viewer-header">
                {(currentGroup?.avatar || (currentGroup?.cover && currentGroup?.cover_media_type !== 'video')) && (
                  <img src={`${IMG_BASE}${currentGroup.avatar || currentGroup.cover}`} alt="" className="story-viewer-avatar" />
                )}
                {currentGroup?.publisher_name && <span>{currentGroup.publisher_name}</span>}
                <span className="story-viewer-timer">{Math.ceil(displaySeconds)} ث</span>
              </div>
            </div>
            <div className="story-viewer-content">
              <button
                type="button"
                className="story-viewer-nav story-viewer-prev"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                aria-label="السابق"
                style={{ visibility: hasPrevSlide || hasPrevStory ? 'visible' : 'hidden' }}
              />
              <div className="story-viewer-media">
                <div className="story-viewer-image-wrap">
                  {currentSlide.media_type === 'video' ? (
                    <video key={`${storyIndex}-${slideIndex}`} ref={videoRef} src={`${IMG_BASE}${currentSlide.image}`} autoPlay muted playsInline loop={false} onEnded={goNext} />
                  ) : (
                    <img src={`${IMG_BASE}${currentSlide.image}`} alt="" />
                  )}
                </div>
                {currentSlide.link_url && (
                  <>
                    <div className="story-swipe-up-hint">
                      <span>اسحب للأعلى</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    </div>
                    <Link to={currentSlide.link_url} className="story-viewer-link-btn" onClick={closeViewer}>
                      عرض المنتج / القسم
                    </Link>
                  </>
                )}
              </div>
              <button
                type="button"
                className="story-viewer-nav story-viewer-next"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                aria-label="التالي"
              />
            </div>
            <button
              type="button"
              className="story-viewer-close"
              onClick={(e) => { e.stopPropagation(); closeViewer() }}
              aria-label="إغلاق"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
