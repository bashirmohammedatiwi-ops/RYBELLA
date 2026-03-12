import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      if (data.user.role !== 'admin') {
        setError('الدخول للمسؤولين فقط');
        return;
      }
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        direction: 'rtl',
        p: 2,
      }}
    >
      <Paper
        sx={{
          p: 4,
          maxWidth: 420,
          width: '100%',
          borderRadius: 4,
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #5e35b1 0%, #7e57c2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.5rem',
            }}
          >
            R
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700 }}>
              Rybella Iraq
            </Typography>
            <Typography variant="body2" color="text.secondary">لوحة تحكم المسؤول</Typography>
          </Box>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
