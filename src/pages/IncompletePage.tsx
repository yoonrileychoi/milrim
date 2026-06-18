import { useNavigate } from 'react-router-dom'

export default function IncompletePage() {
  const navigate = useNavigate()

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, background: '#FAF6EE',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40,
    }}>
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span className="ms" style={{ fontSize: 50, color: '#9CC36B', marginBottom: 18 }}>eco</span>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#2B2A26', textAlign: 'center', lineHeight: 1.4 }}>
          오늘 다 끝내지<br />못해도 괜찮아요
        </div>
        <div style={{ fontSize: 14.5, color: '#847f6f', textAlign: 'center', lineHeight: 1.65, marginTop: 14 }}>
          제가 목표일에 끝낼 수 있도록<br />도와드릴게요.
        </div>
        <div style={{ background: '#fff', border: '1px solid #EFEADD', borderRadius: 16, padding: '16px 18px', marginTop: 26, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#847f6f' }}>오늘 학습량</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#2B2A26' }}>뷰와 트리거 9p</span>
          </div>
          <div style={{ height: 1, background: '#F0EADC', margin: '11px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#847f6f' }}>남은 기간</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#2B2A26' }}>목표일까지 12일</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/replan')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            border: 'none', background: '#2E5A3A', color: '#fff',
            fontSize: 15.5, fontWeight: 700, padding: 16, borderRadius: 15,
            fontFamily: 'var(--font)', cursor: 'pointer', marginTop: 30, width: '100%',
          }}
        >
          <span className="ms" style={{ fontSize: 20 }}>auto_awesome</span>
          AI로 계획 다시 시작
        </button>
        <button
          onClick={() => navigate('/home')}
          style={{ border: 'none', background: 'transparent', color: '#b3ad9d', fontSize: 13.5, fontWeight: 500, padding: 12, fontFamily: 'var(--font)', cursor: 'pointer', marginTop: 6 }}
        >
          나중에 할게요
        </button>
      </div>
    </div>
  )
}
