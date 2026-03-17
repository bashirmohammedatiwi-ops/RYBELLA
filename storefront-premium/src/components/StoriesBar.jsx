import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { storiesAPI, IMG_BASE } from '../services/api'
import './StoriesBar.css'

const STORY_DURATION = 5000
const SWIPE_THRESHOLD = 50

export default function StoriesBar() {
  const touchStartX = useRef(0)
  const videoRef = useRef(null)
  const [storyGroups, setStoryGroups] = useState([])
  const [viewerOpen, setViewerOpen] = useState(false)
  const [storyIndex, setStoryIndex] = useState(0)
  const [slideIndex, setSlideIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    storiesAPI.getAll().then((r) => {
      const arr = Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : [])
      setStoryGroups(arr)
    }).catch(() => setStoryGroups([]))
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
    setViewerOpen(true)
  }

  const closeViewer = useCallback(() => {
    setViewerOpen(false)
  }, [])

  const goNext = useCallback(() => {
    if (hasNextSlide) {
      setSlideIndex((i) => i + 1)
      setProgress(0)
    } else if (hasNextStory) {
      setStoryIndex((i) => i + 1)
      setSlideIndex(0)
      setProgress(0)
    } else {
      closeViewer()
    }
  }, [hasNextSlide, hasNextStory, closeViewer])

  const goPrev = useCallback(() => {
    if (hasPrevSlide) {
      setSlideIndex((i) => i - 1)
      setProgress(0)
    } else if (hasPrevStory) {
      setStoryIndex((i) => i - 1)
      const prevSlides = storyGroups[storyIndex - 1]?.slides || []
      setSlideIndex(prevSlides.length - 1)
      setProgress(0)
    }
  }, [hasPrevSlide, hasPrevStory, storyIndex, storyGroups])

  const isVideo = currentSlide?.media_type === 'video'

  const handleProgress = useCallback(() => {
    setProgress((p) => {
      const step = p + 50
      if (step >= 100) {
        goNext()
        return 0
      }
      return step
    })
  }, [goNext])

  useEffect(() => {
    if (!viewerOpen || !currentSlide) return
    if (isVideo) {
      const v = videoRef.current
      if (!v) return
      const onTimeUpdate = () => { if (v.duration > 0) setProgress((v.currentTime / v.duration) * 100) }
      const onEnded = () => { setProgress(100); goNext() }
      v.addEventListener('timeupdate', onTimeUpdate)
      v.addEventListener('ended', onEnded)
      return () => {
        v.removeEventListener('timeupdate', onTimeUpdate)
        v.removeEventListener('ended', onEnded)
      }
    }
    const t = setInterval(handleProgress, STORY_DURATION / 20)
    return () => clearInterval(t)
  }, [viewerOpen, currentSlide, storyIndex, slideIndex, handleProgress, isVideo, goNext])

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > SWIPE_THRESHOLD) goPrev()
    else if (dx < -SWIPE_THRESHOLD) goNext()
  }

  useEffect(() => {
    if (!viewerOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goPrev()
      else if (e.key === 'ArrowLeft') goNext()
      else if (e.key === 'Escape') closeViewer()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewerOpen, goNext, goPrev, closeViewer])

  if (storyGroups.length === 0) return null

  return (
    <>
      <section className="stories-bar">
        <div className="stories-bar-scroll">
          {storyGroups.map((g, i) => (
            <button
              key={g.id}
              type="button"
              className="story-circle"
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
          ))}
        </div>
      </section>

      {viewerOpen && currentSlide && (
        <div className="story-viewer-overlay" onClick={closeViewer}>
          <div
            className="story-viewer"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
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
              {(currentGroup?.avatar || currentGroup?.publisher_name) && (
                <div className="story-viewer-header">
                  {(currentGroup.avatar || (currentGroup.cover && currentGroup.cover_media_type !== 'video')) && (
                    <img src={`${IMG_BASE}${currentGroup.avatar || currentGroup.cover}`} alt="" className="story-viewer-avatar" />
                  )}
                  {currentGroup.publisher_name && <span>{currentGroup.publisher_name}</span>}
                </div>
              )}
            </div>
            <div className="story-viewer-content">
              <button
                type="button"
                className="story-viewer-nav story-viewer-prev"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                aria-label="السابق"
                style={{ visibility: hasPrevSlide || hasPrevStory ? 'visible' : 'hidden' }}
              />
              <div className="story-viewer-image-wrap">
                {currentSlide.media_type === 'video' ? (
                  <video key={`${storyIndex}-${slideIndex}`} ref={videoRef} src={`${IMG_BASE}${currentSlide.image}`} autoPlay muted playsInline loop={false} onEnded={goNext} />
                ) : currentSlide.link_url ? (
                  <Link to={currentSlide.link_url} className="story-viewer-link" onClick={closeViewer}>
                    <img src={`${IMG_BASE}${currentSlide.image}`} alt="" />
                  </Link>
                ) : (
                  <img src={`${IMG_BASE}${currentSlide.image}`} alt="" />
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
              onClick={closeViewer}
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
