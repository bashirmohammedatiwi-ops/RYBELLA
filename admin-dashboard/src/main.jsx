import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AuthProvider } from './context/AuthContext'
import App from './App'

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#E85D7A',
      light: '#F08FA6',
      dark: '#C94A66',
    },
    secondary: {
      main: '#E8B4A8',
    },
    background: {
      default: '#f5f6f8',
      paper: '#FFFFFF',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Tajawal", "Roboto", "Arial", sans-serif',
    h1: { fontFamily: '"Tajawal", sans-serif' },
    h2: { fontFamily: '"Tajawal", sans-serif' },
    h3: { fontFamily: '"Tajawal", sans-serif' },
    h4: { fontFamily: '"Tajawal", sans-serif' },
    h5: { fontFamily: '"Tajawal", sans-serif' },
    h6: { fontFamily: '"Tajawal", sans-serif' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          borderRadius: 16,
        },
      },
    },
        MuiTable: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            backgroundColor: 'rgba(232, 93, 122, 0.08)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: '0 2px 8px rgba(232, 93, 122, 0.35)',
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
