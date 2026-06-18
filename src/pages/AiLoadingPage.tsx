import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface PlanState {
  planId?: string
  title?: string
  startDate?: string
  endDate?: string
  dailyMinutes?: number
  unit?: string
  totalAmount?: number
}

export default function AiLoadingPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { planId, title, startDate, endDate, dailyMinutes, unit, totalAmount } = (state ?? {}) as PlanState
  const called = useRef(false)

  useEffect(() => {
    if (!planId || called.current) return
    called.current = true

    const callApi = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-plan`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              plan_id: planId,
              title,
              start_date: startDate,
              end_date: endDate,
              daily_minutes: dailyMinutes,
              unit,
              total_amount: totalAmount,
            }),
            signal: controller.signal,
          }
        )
      } catch (_) {
        // 타임아웃 또는 오류 — fallback으로 수학적 분배 실행
      } finally {
        clearTimeout(timeoutId)
      }
    }

    const minWait = new Promise<void>(res => setTimeout(res, 2800))

    Promise.all([callApi(), minWait]).then(() => {
      navigate(`/plan/${planId}`, { replace: true })
    })
  }, [planId])

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
        AI가 학습 계획을<br />만들어 드리고 있어요
      </div>
      <div style={{ fontSize: 13.5, color: '#C2E098', marginTop: 14, textAlign: 'center', lineHeight: 1.6 }}>
        기간 · 시간 · 학습량을 분석해서<br />일간 · 주간 · 최소 달성 목표를 만들게요
      </div>
    </div>
  )
}
