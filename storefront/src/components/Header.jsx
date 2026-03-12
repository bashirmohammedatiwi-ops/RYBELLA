import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Badge,
  Button,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
} from '@mui/icons-material'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const [search, setSearch] = useState('')
  const [anchor, setAnchor] = useState(null)
  const navigate = useNavigate()
  const { totalCount } = useCart()
  const { user, logout } = useAuth()

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: 'white',
        color: 'text.primary',
        boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
      }}
    >
      <Toolbar sx={{ py: 1, gap: 2, flexWrap: 'wrap' }}>
        <IconButton sx={{ display: { xs: 'inline-flex', md: 'none' } }}><MenuIcon /></IconButton>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #6b4fa3 0%, #8b6bb8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.25rem',
            }}
          >
            R
          </Box>
          <Typography variant="h6" fontWeight={800} color="primary.main">Rybella Iraq</Typography>
        </Link>
        <Box component="form" onSubmit={handleSearch} sx={{ flex: 1, minWidth: 200, maxWidth: 420 }}>
          <TextField
            size="small"
            placeholder="ابحث عن منتجات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{
              bgcolor: 'grey.50',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'transparent' } },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton component={Link} to="/cart">
            <Badge badgeContent={totalCount} color="primary">
              <CartIcon />
            </Badge>
          </IconButton>
          {user ? (
            <>
              <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
                <PersonIcon />
              </IconButton>
              <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
                <MenuItem onClick={() => { setAnchor(null); navigate('/orders'); }}>طلباتي</MenuItem>
                <MenuItem onClick={() => { setAnchor(null); navigate('/profile'); }}>حسابي</MenuItem>
                <MenuItem onClick={() => { setAnchor(null); logout(); navigate('/'); }}>تسجيل الخروج</MenuItem>
              </Menu>
            </>
          ) : (
            <Button component={Link} to="/login" variant="outlined" size="small">
              دخول
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}
