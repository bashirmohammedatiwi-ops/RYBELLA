import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import RouteFallback from './components/RouteFallback'
import { useAuth } from './context/AuthContext'

import Home from './pages/Home'

const Explore = lazy(() => import('./pages/Explore'))
const Categories = lazy(() => import('./pages/Categories'))
const Brands = lazy(() => import('./pages/Brands'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const OfferDetail = lazy(() => import('./pages/OfferDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const Orders = lazy(() => import('./pages/Orders'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const Notifications = lazy(() => import('./pages/Notifications'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <RouteFallback />
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/offers/:id" element={<OfferDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
