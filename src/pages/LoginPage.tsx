import { useState } from 'react'
import { LogoBars } from '../components/Logo'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devEmail, setDevEmail] = useState('')
  const [devPassword, setDevPassword] = useState('')
  const [devError, setDevError] = useState('')
  const [devLoading, setDevLoading] = useState(false)

  const handleKakaoLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.origin + '/milrim/',
      },
    })
    if (error) {
      setError('로그인에 실패했어요. 다시 시도해주세요.')
      setLoading(false)
    }
  }

  // 개발 전용 테스트 로그인 — import.meta.env.DEV 가드로 프로덕션 빌드에는 포함되지 않음
  const handleDevLogin = async () => {
    setDevLoading(true)
    setDevError('')
    const { error } = await supabase.auth.signInWithPassword({ email: devEmail, password: devPassword })
    if (error) {
      setDevError(error.message)
      setDevLoading(false)
    }
  }

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
            onClick={handleKakaoLogin}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              border: 'none', background: loading ? '#f5d800' : '#FEE500', color: '#191600',
              fontSize: 15.5, fontWeight: 700, padding: 16, borderRadius: 14,
              fontFamily: 'var(--font)', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
            }}
          >
            <span className="ms" style={{ fontSize: 20, fontVariationSettings: "'wght' 400" }}>chat_bubble</span>
            {loading ? '로그인 중...' : '카카오로 시작하기'}
          </button>
{error && (
            <div style={{ textAlign: 'center', fontSize: 13, color: '#B5524A', marginTop: 4 }}>{error}</div>
          )}
          <div style={{ textAlign: 'center', fontSize: 11.5, color: '#b3ad9d', marginTop: 8, lineHeight: 1.5 }}>
            로그인 시 이용약관 및 개인정보처리방침에<br />동의하는 것으로 간주합니다.
          </div>
          {import.meta.env.DEV && (
            <div style={{ marginTop: 24, padding: 14, border: '1px dashed #b3ad9d', borderRadius: 12 }}>
              <div style={{ fontSize: 11.5, color: '#b3ad9d', marginBottom: 8, textAlign: 'center' }}>
                개발 전용 테스트 로그인 (배포본에는 보이지 않음)
              </div>
              <input
                type="email"
                placeholder="test@test.com"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid #ddd', marginBottom: 6, fontSize: 14 }}
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={devPassword}
                onChange={(e) => setDevPassword(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid #ddd', marginBottom: 6, fontSize: 14 }}
              />
              <button
                onClick={handleDevLogin}
                disabled={devLoading}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: '#2B2A26', color: '#fff', fontSize: 14, cursor: devLoading ? 'not-allowed' : 'pointer' }}
              >
                {devLoading ? '로그인 중...' : '테스트 로그인'}
              </button>
              {devError && (
                <div style={{ textAlign: 'center', fontSize: 12, color: '#B5524A', marginTop: 6 }}>{devError}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
