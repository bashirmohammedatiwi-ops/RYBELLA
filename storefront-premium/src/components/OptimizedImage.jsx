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

function buildPrimaryUrl(src, fallbackSrc, config) {
  if (!src) return ''
  if (isDirectImageUrl(src)) return getOriginalImageUrl(src)
  const uploadSource = getUploadSource(src, fallbackSrc)
  if (uploadSource) return getCachedImageUrl(uploadSource, config)
  return getOriginalImageUrl(src)
}

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
  const config = useMemo(() => {
    const base = getPresetConfig(preset)
    return {
      width: width ?? base.width,
      quality: quality ?? base.quality ?? 72,
    }
  }, [preset, width, quality])

  const primaryUrl = useMemo(
    () => buildPrimaryUrl(src, fallbackSrc, config),
    [src, fallbackSrc, config]
  )

  const uploadSource = useMemo(
    () => getUploadSource(src, fallbackSrc),
    [src, fallbackSrc]
  )

  const [displayUrl, setDisplayUrl] = useState(primaryUrl)
  const loadedRef = useRef(false)
  const stepRef = useRef(0)

  useEffect(() => {
    loadedRef.current = false
    stepRef.current = 0
    setDisplayUrl(primaryUrl)
  }, [primaryUrl])

  if (!src || !enabled || !displayUrl) {
    return <span className={`optimized-img-placeholder ${className}`.trim()} aria-hidden="true" />
  }

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={className}
      loading={priority || eager ? 'eager' : loading}
      decoding={decoding}
      fetchPriority={priority ? 'high' : fetchPriority}
      draggable={draggable}
      onClick={onClick}
      onLoad={(event) => {
        loadedRef.current = true
        onLoad?.(event)
      }}
      onError={() => {
        if (loadedRef.current) return

        if (stepRef.current === 0 && uploadSource) {
          stepRef.current = 1
          setDisplayUrl(getApiImageUrl(uploadSource, config))
          return
        }

        if (stepRef.current <= 1 && uploadSource) {
          stepRef.current = 2
          setDisplayUrl(getOriginalImageUrl(uploadSource))
          return
        }

        if (stepRef.current <= 2 && fallbackSrc && fallbackSrc !== uploadSource) {
          stepRef.current = 3
          setDisplayUrl(getOriginalImageUrl(fallbackSrc))
        }
      }}
      {...rest}
    />
  )
}
