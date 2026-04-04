import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './context/AuthContext'

import Home from './pages/Home'
import Explore from './pages/Explore'
import Categories from './pages/Categories'
import Brands from './pages/Brands'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Wishlist from './pages/Wishlist'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
        <Route path="/wishlist" element={<Wishlist />} />
      </Routes>
    </Layout>
  )
}
