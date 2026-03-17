import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { mergeGuestCart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      await mergeGuestCart?.()
      navigate(from, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'فشل تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="premium-auth">
      <div className="premium-auth-card">
        <h1>تسجيل الدخول</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="premium-auth-error">{error}</div>}
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>{loading ? 'جاري...' : 'دخول'}</button>
        </form>
        <p className="premium-auth-footer">
          ليس لديك حساب؟ <Link to="/register">إنشاء حساب</Link>
        </p>
      </div>
    </div>
  )
}
