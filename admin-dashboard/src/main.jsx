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
      main: '#C2185B',
      light: '#F48FB1',
      dark: '#880E4F',
    },
    secondary: {
      main: '#7B1FA2',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Tajawal", "Roboto", "Arial", sans-serif',
    h1: { fontFamily: '"Tajawal", sans-serif' },
    h2: { fontFamily: '"Tajawal", sans-serif' },
    h3: { fontFamily: '"Tajawal", sans-serif' },
    h4: { fontFamily: '"Tajawal", sans-serif' },
    h5: { fontFamily: '"Tajawal", sans-serif' },
    h6: { fontFamily: '"Tajawal", sans-serif' },
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
