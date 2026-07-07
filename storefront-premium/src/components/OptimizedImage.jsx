import { useState, useMemo, useEffect, useRef } from 'react'
import {
  getCachedImageUrl,
  getApiImageUrl,
  getPresetConfig,
  getOriginalImageUrl,
  getUploadSource,
  isDirectImageUrl,
} from '../utils/imageUrl'
import './OptimizedImage.css'

export default function OptimizedImage({
  src,
  fallbackSrc,
  alt = '',
  className = '',
  preset = 'card',
  width,
  quality,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  eager = false,
  priority = false,
  enabled = true,
  draggable,
  onClick,
  onLoad,
  ...rest
}) {
  const [mode, setMode] = useState('primary')
  const [activeSrc, setActiveSrc] = useState(src)
  const [inView, setInView] = useState(Boolean(priority || eager))
  const rootRef = useRef(null)

  useEffect(() => {
    setMode('primary')
    setActiveSrc(src)
  }, [src])

  useEffect(() => {
    if (priority || eager || !enabled) {
      setInView(true)
      return undefined
    }

    const node = rootRef.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '180px 0px', threshold: 0.01 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [priority, eager, enabled, src])

  const config = useMemo(() => {
    const base = getPresetConfig(preset)
    return {
      width: width ?? base.width,
      quality: quality ?? base.quality ?? 72,
    }
  }, [preset, width, quality])

  const uploadSource = useMemo(
    () => getUploadSource(activeSrc, fallbackSrc),
    [activeSrc, fallbackSrc]
  )

  const imgSrc = useMemo(() => {
    if (!activeSrc || !enabled || !inView) return ''
    const opts = { width: config.width, quality: config.quality }

    if (mode === 'original') {
      return uploadSource ? getOriginalImageUrl(uploadSource) : getOriginalImageUrl(activeSrc)
    }
    if (mode === 'api') {
      return uploadSource ? getApiImageUrl(uploadSource, opts) : getOriginalImageUrl(activeSrc)
    }
    if (isDirectImageUrl(activeSrc)) {
      return getOriginalImageUrl(activeSrc)
    }
    if (uploadSource) {
      return getCachedImageUrl(uploadSource, opts)
    }
    return getOriginalImageUrl(activeSrc)
  }, [activeSrc, uploadSource, config.width, config.quality, mode, enabled, inView])

  if (!src || !enabled) {
    return <span className={`optimized-img-placeholder ${className}`.trim()} aria-hidden="true" />
  }

  return (
    <span ref={rootRef} className="optimized-img-root">
      {inView && imgSrc ? (
        <img
          key={imgSrc}
          src={imgSrc}
          alt={alt}
          className={className}
          loading={priority || eager ? 'eager' : loading}
          decoding={decoding}
          fetchPriority={priority ? 'high' : fetchPriority}
          draggable={draggable}
          onClick={onClick}
          onLoad={onLoad}
          onError={() => {
            setMode((current) => {
              if (current === 'primary') return 'api'
              if (current === 'api') return 'original'
              return current
            })
          }}
          {...rest}
        />
      ) : (
        <span className={`optimized-img-placeholder ${className}`.trim()} aria-hidden="true" />
      )}
    </span>
  )
}
