import { useState, useMemo } from 'react'
import {
  getOptimizedImageUrl,
  getImageSrcSet,
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
  sizes,
  widths,
  quality = 82,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  eager = false,
  enabled = true,
  draggable,
  onClick,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false)
  const [useOriginal, setUseOriginal] = useState(false)

  const config = useMemo(() => {
    const base = getPresetConfig(preset)
    return {
      width: width ?? base.width,
      sizes: sizes ?? base.sizes,
      widths: widths ?? base.widths,
    }
  }, [preset, width, sizes, widths])

  const optimizedSrc = useMemo(
    () => (useOriginal ? getOriginalImageUrl(src) : getOptimizedImageUrl(src, { width: config.width, quality })),
    [src, config.width, quality, useOriginal]
  )

  const srcSet = useMemo(
    () => (useOriginal ? undefined : getImageSrcSet(src, config.widths, quality)),
    [src, config.widths, quality, useOriginal]
  )

  if (!src || !enabled) {
    return <span className={`optimized-img-placeholder ${className}`.trim()} aria-hidden="true" />
  }

  return (
    <img
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={srcSet ? config.sizes : undefined}
      alt={alt}
      className={`optimized-img${loaded ? ' is-loaded' : ''}${className ? ` ${className}` : ''}`}
      loading={eager ? 'eager' : loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      draggable={draggable}
      onClick={onClick}
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (!useOriginal) setUseOriginal(true)
      }}
      {...rest}
    />
  )
}
