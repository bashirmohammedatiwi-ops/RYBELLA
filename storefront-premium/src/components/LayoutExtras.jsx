import { lazy, Suspense, useEffect, useState } from 'react'

const BackToTop = lazy(() => import('./BackToTop'))
const FloatingContact = lazy(() => import('./FloatingContact'))
const PushPermissionPrompt = lazy(() => import('./PushPermissionPrompt'))

function DeferredMount({ children, delayMs = 1500 }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setShow(true), { timeout: delayMs })
      return () => window.cancelIdleCallback(id)
    }
    const t = window.setTimeout(() => setShow(true), delayMs)
    return () => window.clearTimeout(t)
  }, [delayMs])

  if (!show) return null
  return children
}

export default function LayoutExtras({ settings }) {
  const whatsapp = settings?.whatsapp_number
  const showBackToTop = !settings || settings.show_back_to_top !== '0'
  const showContact = !settings || settings.show_contact_float !== '0'

  return (
    <DeferredMount>
      <Suspense fallback={null}>
        {showBackToTop && <BackToTop />}
        {showContact && <FloatingContact whatsappNumber={whatsapp} />}
        <PushPermissionPrompt />
      </Suspense>
    </DeferredMount>
  )
}
