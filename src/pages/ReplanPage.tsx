import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { todayStr, addDaysStr } from '../lib/date'
import { distributeDays } from '../lib/distribute'

interface ReplanState {
  planId?: string
}

export default function ReplanPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { planId } = (state ?? {}) as ReplanState
  const { user } = useAuth()
  const called = useRef(false)

  useEffect(() => {
    if (!planId || !user || called.current) return
    called.current = true

    const run = async () => {
      const today = todayStr()
      const tomorrowStr = addDaysStr(today, 1)
      let success = false

      // Edge Function 시도 (Solar AI 재계획)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/milrim-replan`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ plan_id: planId, tomorrow_date: tomorrowStr }),
          }
        )
        if (res.ok) success = true
      } catch (_) {}

      // Edge Function 실패 시 브라우저에서 직접 수학적 분배 (기존 방식)
      if (!success) {
        const [{ data: plan }, { data: allDays }] = await Promise.all([
          supabase.from('milrim_plans').select('end_date, total_amount, replan_count').eq('id', planId).single(),
          supabase.from('milrim_plan_days').select('actual_amount, status').eq('plan_id', planId),
        ])
        if (!plan || !allDays) return
        if (today > plan.end_date) return

        const completedAmount = allDays
          .filter(d => d.status === 'complete')
          .reduce((sum, d) => sum + (d.actual_amount ?? 0), 0)
        const remainingAmount = Math.max(0, plan.total_amount - completedAmount)
        if (remainingAmount <= 0) return
        if (tomorrowStr > plan.end_date) return

        const rows = distributeDays(tomorrowStr, plan.end_date, remainingAmount).map(d => ({
          ...d, plan_id: planId, user_id: user.id, study_seconds: 0,
        }))

        await supabase.from('milrim_plan_days').delete().eq('plan_id', planId).gte('date', tomorrowStr)
        await Promise.all([
          rows.length > 0 ? supabase.from('milrim_plan_days').insert(rows) : Promise.resolve(),
          supabase.from('milrim_plans').update({
            replan_count: (plan.replan_count ?? 0) + 1,
            generated_by: 'fallback',
            ai_strategy: null,
          }).eq('id', planId),
        ])
      }
    }

    const minWait = new Promise<void>(res => setTimeout(res, 1500))
    Promise.all([run(), minWait]).then(() => {
      navigate(`/plan/${planId}`, { replace: true })
    })
  }, [planId, user])

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
        밀린 학습량을 남은 기간에<br />다시 배분하는 중이에요
      </div>
    </div>
  )
}
