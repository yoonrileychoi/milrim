import { useNavigate, useLocation } from 'react-router-dom'
import { LogoBars } from './Logo'

const navItems = [
  { path: '/home', icon: 'home', label: '홈' },
  { path: '/plan', icon: 'event_note', label: '전체 계획' },
  { path: '/stats', icon: 'monitoring', label: '통계' },
  { path: '/my', icon: 'person', label: '마이페이지' },
  { path: '/admin', icon: 'admin_panel_settings', label: '관리자' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div style={{
      width: 252, flexShrink: 0, background: '#fff', borderRight: '1px solid #ECE7DA',
      display: 'flex', flexDirection: 'column', padding: '28px 18px 20px',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 10px 4px' }}>
        <LogoBars size="md" />
        <div style={{ fontSize: 21, fontWeight: 800, color: '#2B2A26', letterSpacing: '0.02em' }}>밀림</div>
      </div>
      <div style={{ fontSize: 11, color: '#b3ad9d', padding: '0 10px', marginTop: 2 }}>밀려도 괜찮은 학습 플래너</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 34 }}>
        {navItems.map(item => {
          const active = pathname === item.path || (item.path !== '/home' && pathname.startsWith(item.path))
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px',
                borderRadius: 13, cursor: 'pointer',
                background: active ? '#F0F5E6' : 'transparent',
                color: active ? '#2E5A3A' : '#6B6757',
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
          border: 'none', background: '#2E5A3A', color: '#fff',
          fontSize: 14, fontWeight: 700, padding: 13, borderRadius: 13,
          fontFamily: 'var(--font)', cursor: 'pointer', marginBottom: 12,
        }}
      >
        <span className="ms" style={{ fontSize: 20 }}>autorenew</span>
        계획 재생성
      </button>

      <div
        onClick={() => navigate('/my')}
        style={{
          display: 'flex', alignItems: 'center', gap: 11, padding: 12,
          borderRadius: 14, background: '#FAF6EE', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: '50%', background: '#DDE8CE',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E5A3A', flexShrink: 0,
        }}>
          <span className="ms" style={{ fontSize: 20 }}>eco</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26' }}>사용자</div>
          <div style={{ fontSize: 11, color: '#9a9482', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>user@milrim.app</div>
        </div>
      </div>
    </div>
  )
}
