import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { storiesAPI, IMG_BASE } from '../services/api'
import './StoriesBar.css'

const STORY_DURATION = 5000

export default function StoriesBar() {
  const [stories, setStories] = useState([])
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    storiesAPI.getAll().then((r) => {
      const arr = Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : [])
      setStories(arr)
    }).catch(() => setStories([]))
  }, [])

  const currentStory = stories[currentIndex]
  const hasNext = currentIndex < stories.length - 1
  const hasPrev = currentIndex > 0

  const openViewer = (index) => {
    setCurrentIndex(index)
    setProgress(0)
    setViewerOpen(true)
  }

  const closeViewer = useCallback(() => {
    setViewerOpen(false)
  }, [])

  const goNext = useCallback(() => {
    if (hasNext) {
      setCurrentIndex((i) => i + 1)
      setProgress(0)
    } else {
      closeViewer()
    }
  }, [hasNext, closeViewer])

  const goPrev = useCallback(() => {
    if (hasPrev) {
      setCurrentIndex((i) => i - 1)
      setProgress(0)
    }
  }, [hasPrev])

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
    if (!viewerOpen || !currentStory) return
    const t = setInterval(handleProgress, STORY_DURATION / 20)
    return () => clearInterval(t)
  }, [viewerOpen, currentStory, currentIndex, handleProgress])

  if (stories.length === 0) return null

  return (
    <>
      <section className="stories-bar">
        <div className="stories-bar-scroll">
          {stories.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="story-circle"
              onClick={() => openViewer(i)}
              aria-label={`يومية ${i + 1}`}
            >
              <div className="story-circle-ring">
                <img src={`${IMG_BASE}${s.image}`} alt="" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {viewerOpen && currentStory && (
        <div className="story-viewer-overlay" onClick={closeViewer}>
          <div className="story-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="story-viewer-progress">
              {stories.map((_, i) => (
                <div key={i} className="story-viewer-progress-track">
                  <div
                    className="story-viewer-progress-fill"
                    style={{
                      width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="story-viewer-content">
              <button
                type="button"
                className="story-viewer-nav story-viewer-prev"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                aria-label="السابق"
                style={{ visibility: hasPrev ? 'visible' : 'hidden' }}
              />
              <div className="story-viewer-image-wrap">
                {currentStory.link_url ? (
                  <Link
                    to={currentStory.link_url}
                    className="story-viewer-link"
                    onClick={closeViewer}
                  >
                    <img src={`${IMG_BASE}${currentStory.image}`} alt="" />
                  </Link>
                ) : (
                  <img src={`${IMG_BASE}${currentStory.image}`} alt="" />
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
