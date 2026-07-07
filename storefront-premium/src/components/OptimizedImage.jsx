import { useState, useMemo, useEffect, useRef } from 'react'
import {
  getCachedImageUrl,
  getApiImageUrl,
  getPresetConfig,
  getOriginalImageUrl,
  getUploadSource,
} from '../utils/imageUrl'
import './OptimizedImage.css'

function buildPrimaryUrl(src, fallbackSrc, config) {
  if (!src) return ''
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
    () => getUploadSource(src, fallbackSrc) || fallbackSrc || null,
    [src, fallbackSrc]
  )

  const secondarySource = useMemo(() => {
    if (!fallbackSrc || fallbackSrc === uploadSource) return null
    return fallbackSrc
  }, [fallbackSrc, uploadSource])

  const [displayUrl, setDisplayUrl] = useState(primaryUrl)
  const stepRef = useRef(0)
  const loadedUrlRef = useRef('')

  useEffect(() => {
    stepRef.current = 0
    loadedUrlRef.current = ''
    setDisplayUrl(primaryUrl)
  }, [primaryUrl])

  if (!src || !enabled || !displayUrl) {
    return <span className={`optimized-img-placeholder ${className}`.trim()} aria-hidden="true" />
  }

  const handleError = (event) => {
    const failedUrl = event.currentTarget?.src || ''
    if (loadedUrlRef.current && loadedUrlRef.current === failedUrl) return
    if (failedUrl !== displayUrl) return

    if (stepRef.current === 0 && uploadSource) {
      stepRef.current = 1
      setDisplayUrl(getApiImageUrl(uploadSource, config))
      return
    }
    if (stepRef.current === 1 && uploadSource) {
      stepRef.current = 2
      setDisplayUrl(getOriginalImageUrl(uploadSource))
      return
    }
    if (stepRef.current === 2 && secondarySource) {
      stepRef.current = 3
      setDisplayUrl(getOriginalImageUrl(secondarySource))
    }
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
        loadedUrlRef.current = event.currentTarget.currentSrc || event.currentTarget.src || displayUrl
        onLoad?.(event)
      }}
      onError={handleError}
      {...rest}
    />
  )
}
