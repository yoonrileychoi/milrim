import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Highlighter from '../components/Highlighter'

export default function SplashPage() {
  const navigate = useNavigate()
  useEffect(() => {
    const t = setTimeout(() => navigate('/login'), 2200)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, background: 'var(--color-pigment)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          MILRIM
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--color-ink-70)', lineHeight: 1.6 }}>
          <Highlighter delay={400}>밀려도 괜찮은</Highlighter>
          <br />AI 생성 학습 플래너
        </p>
      </div>
      <div style={{ position: 'absolute', bottom: 48, display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: i === 0 ? 20 : 6, height: 6, borderRadius: 3,
            background: i === 0 ? 'var(--color-pigment)' : 'var(--color-wash)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>
    </div>
  )
}
