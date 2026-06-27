import { IMG_BASE } from '../services/api'

export const CATEGORY_RING_TONES = [
  ['#c31477', '#e85d7a'],
  ['#bd0f72', '#f08fa6'],
  ['#a70e64', '#ff9ec0'],
  ['#c31477', '#ffb3c6'],
]

export const CATEGORY_ICON_SVG = {
  'face-woman-outline': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  ),
  'eye-outline': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  lipstick: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 22c-2 0-3-1-3-2 0-1 1-2 3-2s3 1 3 2c0 1-1 2-3 2z" />
      <path d="M9 18c-2 0-3-1-3-2V4c0-1 1-2 3-2s3 1 3 2v12c0 1-1 2-3 2z" />
    </svg>
  ),
  brush: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9.06 11.9L2 19l2.5-2.5 5.06-5.06" />
      <path d="M12 8l4-4 4 4-4 4" />
    </svg>
  ),
  'tag-outline': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    </svg>
  ),
  'view-grid-outline': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
}

export function isCategoryIconImage(icon) {
  if (!icon || typeof icon !== 'string') return false
  return icon.startsWith('/') || icon.startsWith('http') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(icon)
}

export function getCategoryIconUrl(category) {
  const icon = category?.icon
  if (!isCategoryIconImage(icon)) return null
  if (icon.startsWith('http')) return icon
  return `${IMG_BASE}${icon}`
}

export function getCategoryNamedIcon(category) {
  const icon = category?.icon?.trim()
  if (!icon || isCategoryIconImage(icon)) return null
  return CATEGORY_ICON_SVG[icon] || CATEGORY_ICON_SVG['tag-outline']
}
