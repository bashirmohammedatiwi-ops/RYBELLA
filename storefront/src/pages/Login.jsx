import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Box, TextField, Button, Typography, Paper } from '@mui/material'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

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
      const { data } = await authAPI.login({ email, password })
      login(data.user, data.token)
      await mergeGuestCart()
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Paper sx={{ p: 4, maxWidth: 420, width: '100%', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3, textAlign: 'center' }}>تسجيل الدخول</Typography>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="البريد الإلكتروني" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2 }} />
          <TextField fullWidth label="كلمة المرور" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 3 }} />
          <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ py: 1.5 }}>{loading ? 'جاري...' : 'دخول'}</Button>
        </form>
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          <Link to="/register">إنشاء حساب</Link>
        </Typography>
      </Paper>
    </Box>
  )
}
