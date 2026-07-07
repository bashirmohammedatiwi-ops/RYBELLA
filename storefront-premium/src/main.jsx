import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { RecentlyViewedProvider } from './context/RecentlyViewedContext'
import { startCatalogPrefetch } from './utils/prefetchCatalog'
import './styles/global.css'

startCatalogPrefetch()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <RecentlyViewedProvider>
            <App />
          </RecentlyViewedProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
