import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Profile.css'

export default function Profile() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className="premium-profile">
      <h1>حسابي</h1>
      <div className="premium-profile-card">
        <div className="premium-profile-avatar">
          {(user.name || user.email || '?').charAt(0).toUpperCase()}
        </div>
        <h2>{user.name || 'مستخدم'}</h2>
        <p>{user.email}</p>
      </div>
      <div className="premium-profile-links">
        <Link to="/orders">طلباتي</Link>
        <Link to="/wishlist">المفضلة</Link>
      </div>
      <button className="premium-profile-logout" onClick={logout}>تسجيل الخروج</button>
    </div>
  )
}
