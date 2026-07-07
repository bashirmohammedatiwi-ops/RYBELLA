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
  const [ready, setReady] = useState(false)
  const fastPreset = FAST_PRESETS.has(preset)

  useEffect(() => {
    setMode('primary')
    setReady(false)
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

    // البطاقات: السيرفر يختار الرابط (cache أو أصل) — بدون تخمين من المتصفح
    if (fastPreset || isDirectImageUrl(src)) {
      return getOriginalImageUrl(src)
    }
    return getCachedImageUrl(src, opts)
  }, [src, config.width, config.quality, mode, enabled])

  if (!src || !enabled) {
    return <span className={`optimized-img-placeholder ${className}`.trim()} aria-hidden="true" />
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`${className}${ready ? ' optimized-img--ready' : ' optimized-img--loading'}`.trim()}
      loading={priority || eager ? 'eager' : loading}
      decoding={priority ? 'sync' : decoding}
      fetchPriority={priority ? 'high' : fetchPriority}
      draggable={draggable}
      onClick={onClick}
      onLoad={(e) => {
        setReady(true)
        onLoad?.(e)
      }}
      onError={() => {
        setReady(false)
        setMode((current) => {
          if (current === 'primary') {
            if (fastPreset || isDirectImageUrl(src)) return 'original'
            return 'api'
          }
          if (current === 'api') return 'original'
          return current
        })
      }}
      {...rest}
    />
  )
}
