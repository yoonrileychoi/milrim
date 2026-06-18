import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface RestState {
  planId?: string
  planDayId?: string
  title?: string
  target?: number
  unit?: string
  dailyMinutes?: number
  seconds?: number
}

export default function RestPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user } = useAuth()
  const { planId, planDayId, title, target, unit, dailyMinutes, seconds = 0 } = (state ?? {}) as RestState
  const [quitting, setQuitting] = useState(false)

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  const handleResume = () => {
    navigate('/timer', { state: { planId, planDayId, title, target, unit, dailyMinutes, initialSeconds: seconds } })
  }

  const handleQuit = async () => {
    setQuitting(true)
    if (planDayId && planId && user) {
      await Promise.all([
        supabase.from('milrim_plan_days').update({
          status: 'incomplete',
          actual_amount: 0,
          study_seconds: seconds,
        }).eq('id', planDayId),
        supabase.from('milrim_study_sessions').insert({
          user_id: user.id,
          plan_id: planId,
          plan_day_id: planDayId,
          duration_seconds: seconds,
          ended_at: new Date().toISOString(),
        }),
      ])
    }
    navigate('/incomplete', { replace: true, state: { planId, planDayId } })
  }

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
          지금까지 집중한 시간 · <b style={{ color: '#fff' }}>{mins}:{secs}</b>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, width: '100%', marginTop: 38 }}>
          <button
            onClick={handleResume}
            style={{ border: 'none', background: '#fff', color: '#2E5A3A', fontSize: 15.5, fontWeight: 700, padding: 16, borderRadius: 15, fontFamily: 'var(--font)', cursor: 'pointer' }}
          >
            계속 공부하기
          </button>
          <button
            onClick={handleQuit}
            disabled={quitting}
            style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontSize: 15.5, fontWeight: 600, padding: 16, borderRadius: 15, fontFamily: 'var(--font)', cursor: quitting ? 'not-allowed' : 'pointer', opacity: quitting ? 0.7 : 1 }}
          >
            {quitting ? '저장 중...' : '끝내기'}
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 22, textAlign: 'center' }}>
          다시 돌아오기만 하면 됩니다.
        </div>
      </div>
    </div>
  )
}
