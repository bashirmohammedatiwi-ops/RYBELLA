import { useMemo } from 'react'
import './TrustBadges.css'

export default function TrustBadges({ settings }) {
  const badges = useMemo(() => {
    const fromSettings = Array.isArray(settings?.trust_badges) ? settings.trust_badges : []
    if (fromSettings.length > 0) return fromSettings
    const threshold = settings?.free_shipping_threshold || '50000'
    return [
      { icon: 'truck', text: `توصيل مجاني للطلبات فوق ${Number(threshold).toLocaleString('ar-IQ')} د.ع` },
      { icon: 'refresh', text: 'استرجاع سهل حتى 14 يوماً' },
      { icon: 'shield', text: 'دفع آمن ومحمي' },
    ]
  }, [settings])

  const iconMap = {
    truck: '🚚',
    shield: '🛡️',
    gift: '🎁',
    refresh: '↻',
  }

  return (
    <div className="rybella-trust-badges">
      {badges.map((b, i) => (
        <div key={i} className="rybella-trust-item">
          <span className="rybella-trust-icon">{iconMap[b.icon] || '✓'}</span>
          <span className="rybella-trust-text">{b.text}</span>
        </div>
      ))}
    </div>
  )
}
