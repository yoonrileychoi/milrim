import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { todayStr } from '../lib/date'

interface IncompleteState {
  planId?: string
  planDayId?: string
}

export default function IncompletePage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { planId, planDayId } = (state ?? {}) as IncompleteState

  const [plan, setPlan] = useState<{
    title: string; start_date: string; end_date: string; unit: string
    daily_minutes: number; total_amount: number; distribution_pattern: 'even' | 'front' | 'back'
  } | null>(null)
  const [todayTarget, setTodayTarget] = useState<number>(0)
  const [remainingDays, setRemainingDays] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!planId || !planDayId) { setLoading(false); return }
    const today = todayStr()
    Promise.all([
      supabase.from('milrim_plans').select('title, start_date, end_date, unit, daily_minutes, total_amount, distribution_pattern').eq('id', planId).single(),
      supabase.from('milrim_plan_days').select('target_amount').eq('id', planDayId).single(),
    ]).then(([{ data: planData }, { data: dayData }]) => {
      if (planData) {
        setPlan(planData)
        const diff = Math.max(0, Math.round((new Date(planData.end_date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000))
        setRemainingDays(diff)
      }
      if (dayData) setTodayTarget(dayData.target_amount)
      setLoading(false)
    })
  }, [planId, planDayId])

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF6EE' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E2DCCB', borderTopColor: '#2E5A3A', animation: 'dspin 0.9s linear infinite' }} />
      </div>
    )
  }

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
            <span style={{ fontSize: 14, fontWeight: 700, color: '#2B2A26' }}>
              {plan ? `${todayTarget}${plan.unit}` : '-'}
            </span>
          </div>
          <div style={{ height: 1, background: '#F0EADC', margin: '11px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#847f6f' }}>남은 기간</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#2B2A26' }}>목표일까지 {remainingDays}일</span>
          </div>
        </div>
        {planId && (remainingDays > 0 ? (
          <button
            onClick={() => navigate('/replan', { state: { planId } })}
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
        ) : (
          <>
            <div style={{ fontSize: 13.5, color: '#847f6f', textAlign: 'center', marginTop: 26, lineHeight: 1.6 }}>
              목표일이 오늘이라 재분배할 남은 날이 없어요.<br />기간을 수정해 다시 도전해보세요.
            </div>
            <button
              onClick={() => plan && navigate('/plan/new', { state: {
                planId,
                title: plan.title,
                startDate: plan.start_date,
                endDate: plan.end_date,
                dailyMinutes: plan.daily_minutes,
                unit: plan.unit,
                totalAmount: plan.total_amount,
                distribution: plan.distribution_pattern,
              } })}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                border: 'none', background: '#2E5A3A', color: '#fff',
                fontSize: 15.5, fontWeight: 700, padding: 16, borderRadius: 15,
                fontFamily: 'var(--font)', cursor: 'pointer', marginTop: 14, width: '100%',
              }}
            >
              계획 수정하러 가기
            </button>
          </>
        ))}
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
