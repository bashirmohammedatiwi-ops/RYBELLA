import './BarcodeScanner.css'

export default function BarcodeScanButton({ onClick, className = '', label = 'مسح الباركود بالكاميرا' }) {
  return (
    <button
      type="button"
      className={`barcode-scan-btn ${className}`.trim()}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 5V3h4M3 19v2h4M17 3h4v2M17 21h4v-2" />
        <path d="M7 8h1M7 12h1M7 16h1M11 8h6M11 12h6M11 16h4" />
      </svg>
    </button>
  )
}
