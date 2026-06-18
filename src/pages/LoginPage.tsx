import { useNavigate } from 'react-router-dom'
import { LogoBars } from '../components/Logo'

export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: '#F4F2EA',
    }}>
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <LogoBars size="lg" />
        <div style={{ fontSize: 32, fontWeight: 800, color: '#2B2A26', letterSpacing: '0.03em', marginTop: 22 }}>밀림</div>
        <div style={{ fontSize: 14.5, color: '#847f6f', marginTop: 11, textAlign: 'center', lineHeight: 1.6 }}>
          작은 공부가 모여 숲이 됩니다.<br />오늘도 함께 시작해요.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, width: '100%', marginTop: 40 }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              border: 'none', background: '#FEE500', color: '#191600',
              fontSize: 15.5, fontWeight: 700, padding: 16, borderRadius: 14,
              fontFamily: 'var(--font)', cursor: 'pointer',
            }}
          >
            <span className="ms" style={{ fontSize: 20, fontVariationSettings: "'wght' 400" }}>chat_bubble</span>
            카카오로 시작하기
          </button>
          <button
            onClick={() => navigate('/home')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              border: '1px solid #E2DCCB', background: '#fff', color: '#3A3833',
              fontSize: 15.5, fontWeight: 600, padding: 16, borderRadius: 14,
              fontFamily: 'var(--font)', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 800, color: '#4285F4' }}>G</span>
            Google로 시작하기
          </button>
          <div style={{ textAlign: 'center', fontSize: 11.5, color: '#b3ad9d', marginTop: 8, lineHeight: 1.5 }}>
            로그인 시 이용약관 및 개인정보처리방침에<br />동의하는 것으로 간주합니다.
          </div>
        </div>
      </div>
    </div>
  )
}
