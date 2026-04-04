import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { authAPI } from '../services/api'
import './Auth.css'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuth()
  const { mergeGuestCart } = useCart()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authAPI.register({ name: name.trim(), email: email.trim(), password })
      const { data } = await authAPI.login({ email: email.trim(), password })
      setAuth(data.token, data.user)
      await mergeGuestCart?.()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'فشل إنشاء الحساب')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="premium-auth">
      <div className="premium-auth-card">
        <h1>إنشاء حساب</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="premium-auth-error">{error}</div>}
          <input
            type="text"
            placeholder="الاسم"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
          <button type="submit" disabled={loading}>{loading ? 'جاري...' : 'إنشاء حساب'}</button>
        </form>
        <p className="premium-auth-footer">
          لديك حساب؟ <Link to="/login">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  )
}
