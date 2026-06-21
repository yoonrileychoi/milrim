import { useNavigate, useLocation } from 'react-router-dom'
import { LogoBars } from './Logo'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { path: '/home', icon: 'home', label: '홈' },
  { path: '/plan', icon: 'event_note', label: '계획 세우기' },
  { path: '/stats', icon: 'monitoring', label: '통계' },
  { path: '/my', icon: 'person', label: '마이 페이지' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const isAdmin = user?.app_metadata?.milrim_role === 'admin'
  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || '사용자'

  return (
    <div style={{
      width: 252, flexShrink: 0,
      background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '28px 18px 20px',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 10px 4px' }}>
        <LogoBars size="md" />
        <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--ink)', letterSpacing: '0.02em' }}>밀림</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-30)', padding: '0 10px', marginTop: 2 }}>밀려도 괜찮은 학습 플래너</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 34 }}>
        {[...navItems, ...(isAdmin ? [{ path: '/admin', icon: 'admin_panel_settings', label: '관리자' }] : [])].map(item => {
          const active = pathname === item.path || (item.path !== '/home' && pathname.startsWith(item.path))
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px',
                borderRadius: 13, cursor: 'pointer',
                background: active ? 'var(--primary-tint)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--ink-70)',
              }}
            >
              <span className="ms" style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 14.5, fontWeight: active ? 700 : 400, fontFamily: 'var(--font)' }}>{item.label}</span>
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={() => navigate('/replan')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          border: 'none', background: 'var(--primary)', color: '#fff',
          fontSize: 14, fontWeight: 700, padding: 13, borderRadius: 13,
          fontFamily: 'var(--font)', cursor: 'pointer', marginBottom: 10,
        }}
      >
        <span className="ms" style={{ fontSize: 20 }}>autorenew</span>
        계획 재생성
      </button>

      <div
        onClick={() => navigate('/my')}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          borderRadius: 13, background: 'var(--paper)', border: '1px solid var(--border)',
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-tint2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0,
        }}>
          <span className="ms" style={{ fontSize: 17 }}>eco</span>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
      </div>
    </div>
  )
}
