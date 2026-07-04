import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import './BarcodeScanner.css'

export default function BarcodeScanner({ open, onClose, onDetected }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const detectedRef = useRef(false)
  const onDetectedRef = useRef(onDetected)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  useEffect(() => {
    if (!open) return undefined

    detectedRef.current = false
    setError('')
    setStarting(true)

    const reader = new BrowserMultiFormatReader()
    let cancelled = false

    const stop = () => {
      controlsRef.current?.stop()
      controlsRef.current = null
      const stream = videoRef.current?.srcObject
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }

    const start = async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        const backCamera = devices.find((d) => /back|rear|environment/i.test(d.label))
        const deviceId = backCamera?.deviceId || devices[0]?.deviceId

        if (!deviceId) {
          setError('لم يتم العثور على كاميرا على هذا الجهاز.')
          setStarting(false)
          return
        }

        if (cancelled) return

        controlsRef.current = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {
            if (cancelled || detectedRef.current) return
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
          },
        )
        setStarting(false)
      } catch (e) {
        if (cancelled) return
        const name = e?.name || ''
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setError('يُرجى السماح بالوصول إلى الكاميرا لمسح الباركود.')
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setError('لا توجد كاميرا متاحة على هذا الجهاز.')
        } else {
          setError('تعذّر تشغيل الكاميرا. حاولي مرة أخرى.')
        }
        setStarting(false)
      }
    }

    start()

    return () => {
      cancelled = true
      stop()
    }
  }, [open])

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

        {error && <p className="barcode-scanner-error">{error}</p>}

        <button type="button" className="barcode-scanner-cancel" onClick={onClose}>
          إلغاء
        </button>
      </div>
    </div>
  )
}
