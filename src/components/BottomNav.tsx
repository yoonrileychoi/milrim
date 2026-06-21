import { NavLink, useNavigate } from 'react-router-dom'

export default function BottomNav() {
  const navigate = useNavigate()
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 66, background: '#fff', borderTop: '1px solid #EFEADD',
      display: 'flex', alignItems: 'flex-start', padding: '9px 12px 0',
      zIndex: 100,
    }}>
      <NavLink to="/home" style={{ flex: 1, textDecoration: 'none' }}>
        {({ isActive }) => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', color: isActive ? '#2E5A3A' : '#9a9482' }}>
            <span className="ms" style={{ fontSize: 23 }}>home</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, fontFamily: 'var(--font)' }}>홈</span>
          </div>
        )}
      </NavLink>
      <NavLink to="/plan" style={{ flex: 1, textDecoration: 'none' }}>
        {({ isActive }) => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', color: isActive ? '#2E5A3A' : '#9a9482' }}>
            <span className="ms" style={{ fontSize: 23 }}>event_note</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, fontFamily: 'var(--font)' }}>계획 세우기</span>
          </div>
        )}
      </NavLink>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/plan')}>
        <div style={{
          width: 54, height: 54, borderRadius: '50%', background: '#2E5A3A', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: -22, boxShadow: '0 6px 18px rgba(46,90,58,0.45)', border: '3px solid #fff',
        }}>
          <span className="ms" style={{ fontSize: 28 }}>autorenew</span>
        </div>
        <span style={{ fontSize: 11, color: '#2E5A3A', fontWeight: 800, marginTop: 4, fontFamily: 'var(--font)' }}>AI 계획 수정</span>
      </div>
      <NavLink to="/stats" style={{ flex: 1, textDecoration: 'none' }}>
        {({ isActive }) => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', color: isActive ? '#2E5A3A' : '#9a9482' }}>
            <span className="ms" style={{ fontSize: 23 }}>monitoring</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, fontFamily: 'var(--font)' }}>통계</span>
          </div>
        )}
      </NavLink>
      <NavLink to="/my" style={{ flex: 1, textDecoration: 'none' }}>
        {({ isActive }) => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', color: isActive ? '#2E5A3A' : '#9a9482' }}>
            <span className="ms" style={{ fontSize: 23 }}>person</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, fontFamily: 'var(--font)' }}>MY</span>
          </div>
        )}
      </NavLink>
    </nav>
  )
}
