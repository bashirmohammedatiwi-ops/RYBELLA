import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { authAPI } from '../services/api'
import { isValidIraqiPhone, normalizeIraqiPhone, IRAQI_PHONE_HINT } from '../utils/phone'
import './Auth.css'

export default function Register() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuth()
  const { mergeGuestCart } = useCart()
  const navigate = useNavigate()

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
    if (!password.trim()) {
      setError('كلمة المرور مطلوبة')
      return
    }

    setLoading(true)
    try {
      const { data } = await authAPI.register({ name: name.trim(), phone: normalizedPhone, password })
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
            autoComplete="name"
          />
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
            autoComplete="new-password"
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
