import { getCategoryIconUrl, getCategoryNamedIcon } from '../utils/categoryIcon'

export default function CategoryIconVisual({ category, className = '', fallbackLetter }) {
  const iconUrl = getCategoryIconUrl(category)
  const namedIcon = getCategoryNamedIcon(category)
  const letter = fallbackLetter || category?.name?.slice(0, 1) || 'R'

  return (
    <span className={`cat-icon-visual ${className}`.trim()}>
      {iconUrl ? (
        <img src={iconUrl} alt="" loading="lazy" draggable={false} />
      ) : namedIcon ? (
        namedIcon
      ) : (
        <span className="cat-icon-visual-letter">{letter}</span>
      )}
    </span>
  )
}
