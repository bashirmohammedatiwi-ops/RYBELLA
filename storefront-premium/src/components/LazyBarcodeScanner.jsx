import { lazy, Suspense } from 'react'

const BarcodeScanner = lazy(() => import('./BarcodeScanner'))

export default function LazyBarcodeScanner(props) {
  if (!props.open) return null
  return (
    <Suspense fallback={null}>
      <BarcodeScanner {...props} />
    </Suspense>
  )
}
