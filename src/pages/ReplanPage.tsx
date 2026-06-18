import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      const [{ data: plan }, { data: allDays }] = await Promise.all([
        supabase.from('milrim_plans').select('end_date, total_amount, unit, replan_count').eq('id', planId).single(),
        supabase.from('milrim_plan_days').select('date, actual_amount, status').eq('plan_id', planId),
      ])

      if (!plan || !allDays) return

      const completedAmount = allDays
        .filter(d => d.status === 'complete')
        .reduce((sum, d) => sum + (d.actual_amount ?? 0), 0)
      const remainingAmount = Math.max(0, plan.total_amount - completedAmount)

      if (tomorrowStr > plan.end_date || remainingAmount <= 0) return

      // 내일 이후 pending 삭제 후 재분배
      await supabase.from('milrim_plan_days').delete().eq('plan_id', planId).gte('date', tomorrowStr)

      const start = new Date(tomorrowStr)
      const end = new Date(plan.end_date)
      const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
      const rows = []
      let remaining = remainingAmount

      for (let i = 0; i < totalDays; i++) {
        const daysLeft = totalDays - i
        const target = i === totalDays - 1 ? remaining : Math.ceil(remaining / daysLeft)
        const d = new Date(start)
        d.setDate(d.getDate() + i)
        rows.push({
          plan_id: planId,
          user_id: user.id,
          date: d.toISOString().split('T')[0],
          target_amount: target,
          min_amount: Math.max(1, Math.ceil(target * 0.2)),
          study_seconds: 0,
        })
        remaining -= target
      }

      await Promise.all([
        supabase.from('milrim_plan_days').insert(rows),
        supabase.from('milrim_plans').update({ replan_count: (plan.replan_count ?? 0) + 1 }).eq('id', planId),
      ])
    }

    const minWait = new Promise<void>(res => setTimeout(res, 2800))
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
