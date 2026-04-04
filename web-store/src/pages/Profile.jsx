import { useAuth } from '../context/AuthContext'
import './Profile.css'

export default function Profile() {
  const { user, logout } = useAuth()

  if (!user) return <p className="empty-msg">يرجى تسجيل الدخول</p>

  return (
    <div className="profile-page">
      <h2>حسابي</h2>
      <div className="profile-card">
        <div className="profile-avatar">{user.name?.[0] || '?'}</div>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        {user.phone && <p>{user.phone}</p>}
      </div>
    </div>
  )
}
