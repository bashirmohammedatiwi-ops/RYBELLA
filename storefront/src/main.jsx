import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import App from './App'

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: { main: '#6b4fa3', light: '#8b6bb8', dark: '#4a3575' },
    secondary: { main: '#e8a87c' },
    background: { default: '#fafafa', paper: '#ffffff' },
    success: { main: '#4caf50' },
    warning: { main: '#ff9800' },
  },
  typography: {
    fontFamily: '"Tajawal", "Roboto", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: { borderRadius: 12, textTransform: 'none', fontWeight: 600 },
        outlined: { borderRadius: 12, textTransform: 'none' },
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
