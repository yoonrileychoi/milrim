import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ReplanPage() {
  const navigate = useNavigate()
  useEffect(() => {
    const t = setTimeout(() => navigate('/plan/result', { replace: true }), 2800)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(165deg, #2E5A3A 0%, #25492F 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#C2E098',
        animation: 'dspin 0.9s linear infinite', marginBottom: 30,
      }} />
      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.5 }}>
        목표일은 그대로,<br />계획만 다시 짜고 있어요
      </div>
      <div style={{ fontSize: 13.5, color: '#C2E098', marginTop: 14, textAlign: 'center', lineHeight: 1.6 }}>
        밀린 9p를 남은 12일에<br />다시 배분하는 중이에요
      </div>
    </div>
  )
}
