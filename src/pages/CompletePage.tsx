import { useNavigate } from 'react-router-dom'

export default function CompletePage() {
  const navigate = useNavigate()

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, background: '#FAF6EE',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40,
    }}>
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="pop-in" style={{
          width: 96, height: 96, borderRadius: '50%', background: '#F0F5E6',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E5A3A', marginBottom: 26,
        }}>
          <span className="ms" style={{ fontSize: 48, fontVariationSettings: "'wght' 400" }}>check</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#2B2A26', textAlign: 'center' }}>오늘 계획 완료!</div>
        <div style={{ fontSize: 14.5, color: '#847f6f', textAlign: 'center', lineHeight: 1.6, marginTop: 12 }}>
          이 작은 한 걸음이 쌓여갑니다.<br />꾸준히 해줘서 고마워요.
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
          <div style={{ background: '#fff', border: '1px solid #EFEADD', borderRadius: 16, padding: '14px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 11.5, color: '#9a9482' }}>오늘 학습</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#2B2A26', marginTop: 3 }}>25:00</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #EFEADD', borderRadius: 16, padding: '14px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 11.5, color: '#9a9482' }}>진행률</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#2E5A3A', marginTop: 3 }}>87%</div>
          </div>
        </div>
        <button
          onClick={() => navigate('/home')}
          style={{ border: 'none', background: '#2E5A3A', color: '#fff', fontSize: 15.5, fontWeight: 700, padding: '16px 50px', borderRadius: 15, fontFamily: 'var(--font)', cursor: 'pointer', marginTop: 38 }}
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}
