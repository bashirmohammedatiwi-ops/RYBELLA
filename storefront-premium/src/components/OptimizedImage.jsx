import { useState, useMemo, useRef, useEffect } from 'react'
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
  quality,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  eager = false,
  priority = false,
  enabled = true,
  observe = true,
  draggable,
  onClick,
  onLoad,
  ...rest
}) {
  const rootRef = useRef(null)
  const [visible, setVisible] = useState(Boolean(priority || eager || !observe))
  const [loaded, setLoaded] = useState(false)
  const [useOriginal, setUseOriginal] = useState(false)

  const config = useMemo(() => {
    const base = getPresetConfig(preset)
    return {
      width: width ?? base.width,
      sizes: sizes ?? base.sizes,
      widths: widths ?? base.widths,
      single: base.single !== false,
      quality: quality ?? base.quality ?? 76,
    }
  }, [preset, width, sizes, widths, quality])

  useEffect(() => {
    if (!observe || priority || eager || visible) return undefined
    const node = rootRef.current
    if (!node) return undefined

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '320px 0px', threshold: 0.01 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [observe, priority, eager, visible, src])

  useEffect(() => {
    setLoaded(false)
    setUseOriginal(false)
    if (!priority && !eager && observe) {
      setVisible(false)
    }
  }, [src])

  const optimizedSrc = useMemo(() => {
    if (!visible) return undefined
    return useOriginal
      ? getOriginalImageUrl(src)
      : getOptimizedImageUrl(src, { width: config.width, quality: config.quality })
  }, [src, config.width, config.quality, useOriginal, visible])

  const srcSet = useMemo(() => {
    if (!visible || useOriginal || config.single) return undefined
    return getImageSrcSet(src, config.widths, config.quality)
  }, [src, config.widths, config.quality, useOriginal, visible, config.single])

  if (!src || !enabled) {
    return <span ref={rootRef} className={`optimized-img-placeholder ${className}`.trim()} aria-hidden="true" />
  }

  return (
    <span ref={rootRef} className={`optimized-img-wrap${className ? ` ${className}-wrap` : ''}`}>
      {!loaded && <span className={`optimized-img-placeholder ${className}`.trim()} aria-hidden="true" />}
      {visible && optimizedSrc && (
        <img
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={srcSet ? config.sizes : undefined}
          alt={alt}
          className={`optimized-img${loaded ? ' is-loaded' : ''}${className ? ` ${className}` : ''}`}
          loading={priority || eager ? 'eager' : loading}
          decoding={decoding}
          fetchPriority={priority ? 'high' : fetchPriority}
          draggable={draggable}
          onClick={onClick}
          onLoad={(e) => {
            setLoaded(true)
            onLoad?.(e)
          }}
          onError={() => {
            if (!useOriginal) setUseOriginal(true)
          }}
          {...rest}
        />
      )}
    </span>
  )
}
