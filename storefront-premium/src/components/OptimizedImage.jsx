import { useState, useMemo, useEffect } from 'react'
import {
  getCachedImageUrl,
  getApiImageUrl,
  getPresetConfig,
  getOriginalImageUrl,
  isDirectImageUrl,
} from '../utils/imageUrl'
import './OptimizedImage.css'

const FAST_PRESETS = new Set(['card', 'thumb', 'icon'])

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
  const fastPreset = FAST_PRESETS.has(preset)

  useEffect(() => {
    setMode('primary')
    setActiveSrc(src)
  }, [src])

  const config = useMemo(() => {
    const base = getPresetConfig(preset)
    return {
      width: width ?? base.width,
      quality: quality ?? base.quality ?? 76,
    }
  }, [preset, width, quality])

  const imgSrc = useMemo(() => {
    if (!activeSrc || !enabled) return ''
    const opts = { width: config.width, quality: config.quality }
    const base = activeSrc

    if (fastPreset || isDirectImageUrl(base)) {
      return getOriginalImageUrl(base)
    }

    if (mode === 'original') return getOriginalImageUrl(fallbackSrc || base)
    if (mode === 'api') return getApiImageUrl(base, opts)
    return getCachedImageUrl(base, opts)
  }, [activeSrc, fallbackSrc, config.width, config.quality, mode, enabled, fastPreset])

  if (!src || !enabled) {
    return <span className={`optimized-img-placeholder ${className}`.trim()} aria-hidden="true" />
  }

  return (
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
        if (fastPreset) {
          const original = fallbackSrc || src
          if (original && activeSrc !== original) {
            setActiveSrc(original)
            return
          }
          return
        }
        setMode((current) => {
          if (current === 'primary') return 'api'
          if (current === 'api') return 'original'
          return current
        })
      }}
      {...rest}
    />
  )
}
