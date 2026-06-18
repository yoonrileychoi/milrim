import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface TimerState {
  planId?: string
  planDayId?: string
  title?: string
  target?: number
  unit?: string
  dailyMinutes?: number
}

export default function TimerPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user } = useAuth()
  const { planId, planDayId, title, target, unit, dailyMinutes } = (state ?? {}) as TimerState

  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(true)
  const [showEndModal, setShowEndModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  const maxSec = (dailyMinutes ?? 25) * 60
  const pct = Math.min(seconds / maxSec, 1)
  const r = 112, circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  const saveSession = async (status: 'complete' | 'incomplete') => {
    if (!planDayId || !planId || !user) return
    setSaving(true)
    await Promise.all([
      supabase.from('milrim_plan_days').update({
        status,
        actual_amount: status === 'complete' ? (target ?? 0) : 0,
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
    setSaving(false)
  }

  const handleComplete = async () => {
    setRunning(false)
    await saveSession('complete')
    navigate('/complete', { replace: true, state: { seconds, target, unit, planId } })
  }

  const handleIncomplete = async () => {
    setRunning(false)
    await saveSession('incomplete')
    navigate('/incomplete', { replace: true, state: { planId, planDayId } })
  }

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(170deg, #FAF6EE 0%, #EFEFE0 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', height: '100%', padding: '22px 24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            onClick={() => navigate('/home')}
            style={{ width: 38, height: 38, borderRadius: 11, background: '#fff', border: '1px solid #E7E1D3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6757', cursor: 'pointer' }}
          >
            <span className="ms" style={{ fontSize: 22 }}>arrow_back</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#847f6f' }}>학습 중</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 12, color: '#9a9482', fontWeight: 600 }}>{title ?? '학습'}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#2B2A26', marginTop: 6 }}>
            오늘 목표: {target}{unit}
          </div>
          <div style={{ position: 'relative', width: 250, height: 250, margin: '30px 0' }}>
            <svg width="250" height="250" viewBox="0 0 250 250">
              <circle cx="125" cy="125" r={r} fill="none" stroke="#E6E0CF" strokeWidth="14" />
              <circle cx="125" cy="125" r={r} fill="none" stroke="#2E5A3A" strokeWidth="14"
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                transform="rotate(-90 125 125)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: '#2B2A26', fontVariantNumeric: 'tabular-nums' }}>{mins}:{secs}</div>
              <div style={{ fontSize: 13, color: '#9a9482', marginTop: 4 }}>
                {dailyMinutes ? `목표 ${dailyMinutes}분` : '집중하는 중'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 11 }}>
          <button
            onClick={() => { setRunning(false); navigate('/rest', { state: { planId, planDayId, title, target, unit, dailyMinutes, seconds } }) }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: '1px solid #DDD7C6', background: '#fff', color: '#6B6757', fontSize: 15.5, fontWeight: 700, padding: 16, borderRadius: 15, fontFamily: 'var(--font)', cursor: 'pointer' }}
          >
            <span className="ms" style={{ fontSize: 20, fontVariationSettings: "'wght' 400" }}>pause</span>
            일시정지
          </button>
          <button
            onClick={() => { setRunning(false); setShowEndModal(true) }}
            style={{ flex: 1, border: 'none', background: '#2E5A3A', color: '#fff', fontSize: 15.5, fontWeight: 700, padding: 16, borderRadius: 15, fontFamily: 'var(--font)', cursor: 'pointer' }}
          >
            종료
          </button>
        </div>
      </div>

      {showEndModal && (
        <div
          onClick={() => { setShowEndModal(false); setRunning(true) }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(43,42,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="pop-in"
            style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 22, padding: '26px 24px 22px' }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: '#2B2A26', textAlign: 'center' }}>오늘 학습을 마칠까요?</div>
            <div style={{ fontSize: 13, color: '#847f6f', textAlign: 'center', marginTop: 7 }}>{mins}:{secs} 동안 집중했어요</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
              <button
                onClick={handleComplete}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, border: 'none', background: saving ? '#6E9E4E' : '#2E5A3A', color: '#fff', fontSize: 15, fontWeight: 700, padding: 15, borderRadius: 14, fontFamily: 'var(--font)', cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                <span className="ms" style={{ fontSize: 18, fontVariationSettings: "'wght' 400" }}>check</span>
                {saving ? '저장 중...' : '계획을 모두 마쳤어요'}
              </button>
              <button
                onClick={handleIncomplete}
                disabled={saving}
                style={{ border: '1px solid #E2DCCB', background: '#fff', color: '#6B6757', fontSize: 15, fontWeight: 600, padding: 15, borderRadius: 14, fontFamily: 'var(--font)', cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                아직 다 못 했어요
              </button>
              <button
                onClick={() => { setShowEndModal(false); setRunning(true) }}
                style={{ border: 'none', background: 'transparent', color: '#b3ad9d', fontSize: 13.5, fontWeight: 500, padding: 6, fontFamily: 'var(--font)', cursor: 'pointer' }}
              >
                계속 공부하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
