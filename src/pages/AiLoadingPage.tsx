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

function generateDays(startDate: string, endDate: string, totalAmount: number, planId: string, userId: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  const rows = []
  let remaining = totalAmount

  for (let i = 0; i < totalDays; i++) {
    const daysLeft = totalDays - i
    const target = i === totalDays - 1 ? remaining : Math.ceil(remaining / daysLeft)
    const minAmount = Math.max(1, Math.ceil(target * 0.2))
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    rows.push({
      plan_id: planId,
      user_id: userId,
      date: d.toISOString().split('T')[0],
      target_amount: target,
      min_amount: minAmount,
    })
    remaining -= target
  }
  return rows
}

export default function AiLoadingPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { planId, title, startDate, endDate, dailyMinutes, unit, totalAmount } = (state ?? {}) as PlanState
  const called = useRef(false)

  useEffect(() => {
    if (!planId || !startDate || !endDate || !totalAmount || called.current) return
    called.current = true

    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) return

      let success = false

      // Edge Function 시도 (Solar AI)
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-plan`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              plan_id: planId, title,
              start_date: startDate, end_date: endDate,
              daily_minutes: dailyMinutes, unit, total_amount: totalAmount,
            }),
          }
        )
        if (res.ok) success = true
      } catch (_) {}

      // Edge Function 실패 시 브라우저에서 직접 수학적 분배
      if (!success) {
        const rows = generateDays(startDate, endDate, totalAmount, planId, userId)
        await supabase.from('milrim_plan_days').insert(rows)
      }
    }

    const minWait = new Promise<void>(res => setTimeout(res, 2800))
    Promise.all([run(), minWait]).then(() => {
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
