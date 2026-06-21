import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { isValidIraqiPhone, normalizeIraqiPhone, IRAQI_PHONE_HINT } from '../utils/phone'
import './Auth.css'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { mergeGuestCart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const fromState = location.state?.from
  const from = typeof fromState === 'string' ? fromState : fromState?.pathname || '/'

  const handlePhoneChange = (e) => {
    setPhone(normalizeIraqiPhone(e.target.value).slice(0, 11))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const normalizedPhone = normalizeIraqiPhone(phone)
    if (!isValidIraqiPhone(normalizedPhone)) {
      setError(IRAQI_PHONE_HINT)
      return
    }

    setLoading(true)
    try {
      await login(normalizedPhone, password)
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
            type="tel"
            placeholder="رقم الهاتف (07xxxxxxxxx)"
            value={phone}
            onChange={handlePhoneChange}
            inputMode="numeric"
            pattern="07[0-9]{9}"
            maxLength={11}
            required
            autoComplete="tel"
            dir="ltr"
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
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
