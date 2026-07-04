import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import './BarcodeScanner.css'

const CAMERA_CONSTRAINTS = [
  { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
  { video: { facingMode: 'environment' } },
  { video: { facingMode: { ideal: 'user' } } },
  { video: true },
]

function mapCameraError(error) {
  const name = error?.name || ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'يُرجى السماح بالوصول إلى الكاميرا من إعدادات المتصفح ثم أعيدي المحاولة.'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') {
    return 'لا توجد كاميرا متاحة على هذا الجهاز.'
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'الكاميرا مستخدمة من تطبيق آخر. أغلقيه ثم أعيدي المحاولة.'
  }
  if (!window.isSecureContext) {
    return 'الكاميرا تعمل فقط عبر HTTPS. افتحي الموقع من rybellairaq.com'
  }
  return 'تعذّر تشغيل الكاميرا. أعيدي المحاولة أو أدخلي الباركود يدوياً.'
}

export default function BarcodeScanner({ open, onClose, onDetected }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const readerRef = useRef(null)
  const detectedRef = useRef(false)
  const onDetectedRef = useRef(onDetected)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  const stop = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
    const stream = videoRef.current?.srcObject
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop())
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(mapCameraError({ name: 'NotFoundError' }))
      setStarting(false)
      return
    }

    if (!window.isSecureContext) {
      setError(mapCameraError({ name: 'SecurityError' }))
      setStarting(false)
      return
    }

    detectedRef.current = false
    setError('')
    setStarting(true)
    stop()

    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    const onResult = (result, err) => {
      if (detectedRef.current) return
      if (result) {
        detectedRef.current = true
        const code = result.getText()?.trim()
        if (code) {
          stop()
          onDetectedRef.current?.(code)
        }
        return
      }
      if (err && err.name !== 'NotFoundException') {
        /* ignore frame misses */
      }
    }

    let lastError = null

    for (const constraints of CAMERA_CONSTRAINTS) {
      try {
        controlsRef.current = await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          onResult,
        )
        setStarting(false)
        return
      } catch (e) {
        lastError = e
      }
    }

    try {
      controlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        onResult,
      )
      setStarting(false)
      return
    } catch (e) {
      lastError = e
    }

    setError(mapCameraError(lastError))
    setStarting(false)
  }, [stop])

  useEffect(() => {
    if (!open) {
      stop()
      return undefined
    }

    startCamera()

    return () => {
      stop()
    }
  }, [open, attempt, startCamera, stop])

  if (!open) return null

  return (
    <div className="barcode-scanner-overlay" role="dialog" aria-modal="true" aria-label="مسح الباركود">
      <div className="barcode-scanner-panel">
        <div className="barcode-scanner-header">
          <h2>مسح الباركود</h2>
          <button type="button" className="barcode-scanner-close" onClick={onClose} aria-label="إغلاق">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="barcode-scanner-hint">وجّهي الكاميرا نحو الباركود على المنتج</p>

        <div className="barcode-scanner-viewport">
          <video ref={videoRef} className="barcode-scanner-video" muted playsInline autoPlay />
          <div className="barcode-scanner-frame" aria-hidden="true">
            <span className="barcode-scanner-corner tl" />
            <span className="barcode-scanner-corner tr" />
            <span className="barcode-scanner-corner bl" />
            <span className="barcode-scanner-corner br" />
            <span className="barcode-scanner-line" />
          </div>
          {starting && <div className="barcode-scanner-loading">جاري تشغيل الكاميرا...</div>}
        </div>

        {error && (
          <div className="barcode-scanner-error-wrap">
            <p className="barcode-scanner-error">{error}</p>
            <button type="button" className="barcode-scanner-retry" onClick={() => setAttempt((n) => n + 1)}>
              إعادة المحاولة
            </button>
          </div>
        )}

        <button type="button" className="barcode-scanner-cancel" onClick={onClose}>
          إلغاء
        </button>
      </div>
    </div>
  )
}
