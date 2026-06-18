import { useNavigate } from 'react-router-dom'

export default function RestPage() {
  const navigate = useNavigate()

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(170deg, #2E5A3A 0%, #25492F 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40,
    }}>
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span className="ms" style={{ fontSize: 48, color: '#C2E098', marginBottom: 20 }}>bedtime</span>
        <div style={{ fontSize: 23, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.4 }}>잠시 쉬어도 괜찮아요</div>
        <div style={{ fontSize: 14.5, color: '#C2E098', textAlign: 'center', lineHeight: 1.65, marginTop: 14 }}>
          공부는 멈출 수 있지만,<br />당신의 목표는 사라지지 않아요.
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '14px 20px', marginTop: 28, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
          지금까지 집중한 시간 · <b style={{ color: '#fff' }}>13:42</b>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, width: '100%', marginTop: 38 }}>
          <button
            onClick={() => navigate('/timer')}
            style={{ border: 'none', background: '#fff', color: '#2E5A3A', fontSize: 15.5, fontWeight: 700, padding: 16, borderRadius: 15, fontFamily: 'var(--font)', cursor: 'pointer' }}
          >
            계속 공부하기
          </button>
          <button
            onClick={() => navigate('/home')}
            style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontSize: 15.5, fontWeight: 600, padding: 16, borderRadius: 15, fontFamily: 'var(--font)', cursor: 'pointer' }}
          >
            끝내기
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 22, textAlign: 'center' }}>
          다시 돌아오기만 하면 됩니다.
        </div>
      </div>
    </div>
  )
}
