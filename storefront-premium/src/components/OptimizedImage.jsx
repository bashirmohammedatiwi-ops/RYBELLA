import { useState, useMemo, useEffect } from 'react'
import {
  getCachedImageUrl,
  getApiImageUrl,
  getPresetConfig,
  getOriginalImageUrl,
} from '../utils/imageUrl'
import './OptimizedImage.css'

export default function OptimizedImage({
  src,
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
  const [mode, setMode] = useState('cache')

  useEffect(() => {
    setMode('cache')
  }, [src])

  const config = useMemo(() => {
    const base = getPresetConfig(preset)
    return {
      width: width ?? base.width,
      quality: quality ?? base.quality ?? 76,
    }
  }, [preset, width, quality])

  const imgSrc = useMemo(() => {
    if (!src || !enabled) return ''
    const opts = { width: config.width, quality: config.quality }
    if (mode === 'original') return getOriginalImageUrl(src)
    if (mode === 'api') return getApiImageUrl(src, opts)
    return getCachedImageUrl(src, opts)
  }, [src, config.width, config.quality, mode, enabled])

  if (!src || !enabled) {
    return <span className={`optimized-img-placeholder ${className}`.trim()} aria-hidden="true" />
  }

  return (
    <img
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
          if (current === 'cache') return 'api'
          if (current === 'api') return 'original'
          return current
        })
      }}
      {...rest}
    />
  )
}
