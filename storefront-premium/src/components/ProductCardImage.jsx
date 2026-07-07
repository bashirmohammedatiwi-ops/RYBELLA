import { useState, useEffect, useRef, useMemo } from 'react'
import {
  getProductCardImageUrl,
  getApiImageUrl,
  getOriginalImageUrl,
  IMAGE_PRESETS,
  imageUrlsMatch,
} from '../utils/imageUrl'

const CARD = IMAGE_PRESETS.card

export default function ProductCardImage({
  mainImage,
  variantImage,
  alt = '',
  className = '',
  priority = false,
}) {
  const uploadSource = mainImage || variantImage
  const secondarySource = variantImage && variantImage !== mainImage ? variantImage : null

  const primaryUrl = useMemo(() => {
    if (!uploadSource) return ''
    return getProductCardImageUrl(mainImage || variantImage, uploadSource)
  }, [mainImage, variantImage, uploadSource])

  const [displayUrl, setDisplayUrl] = useState(primaryUrl)
  const stepRef = useRef(0)
  const loadedUrlRef = useRef('')

  useEffect(() => {
    stepRef.current = 0
    loadedUrlRef.current = ''
    setDisplayUrl(primaryUrl)
  }, [primaryUrl])

  if (!uploadSource || !displayUrl) return null

  const handleError = (event) => {
    const failedUrl = event.currentTarget?.src || ''
    if (loadedUrlRef.current && imageUrlsMatch(loadedUrlRef.current, failedUrl)) return
    if (!imageUrlsMatch(failedUrl, displayUrl)) return

    if (stepRef.current === 0 && uploadSource) {
      stepRef.current = 1
      setDisplayUrl(getApiImageUrl(uploadSource, CARD))
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
      width={200}
      height={200}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      onLoad={(event) => {
        loadedUrlRef.current = event.currentTarget.currentSrc || event.currentTarget.src || displayUrl
      }}
      onError={handleError}
    />
  )
}
