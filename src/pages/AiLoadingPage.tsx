import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { datesBetween, distributeOverDates } from '../lib/distribute'

// Edge Function을 못 부를 때 브라우저가 직접 균등 분배하는 경로에서 쓰는 코멘트.
// 균등 분배이므로 배분 방식(초반/후반집중)을 주장하지 않는 중립 문구를 쓴다.
const FALLBACK_COMMENT = '매일 비슷한 분량으로 고르게 나눠봤어요. 꾸준함이 가장 큰 힘이 돼요.'

interface PlanState {
  planId?: string
  title?: string
  startDate?: string
  endDate?: string
  dailyMinutes?: number
  unit?: string
  totalAmount?: number
  distribution?: 'even' | 'front' | 'back'
}

export default function AiLoadingPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { planId, title, startDate, endDate, dailyMinutes, unit, totalAmount, distribution } = (state ?? {}) as PlanState
  const called = useRef(false)

  // 이 화면은 계획 정보를 화면 간 전달값(state)으로만 받는다. 새로고침하면 그 값이 사라져
  // 아래 생성 로직이 시작조차 못 하고 스피너만 영원히 돈다. 그럴 땐 계획 화면으로 돌려보낸다.
  // (계획 자체는 이미 DB에 저장돼 있으므로 사용자는 거기서 이어갈 수 있다)
  useEffect(() => {
    if (authLoading || called.current) return
    if (!planId || !startDate || !endDate || !totalAmount) {
      navigate(planId ? `/plan/${planId}` : '/plan', { replace: true })
    }
  }, [authLoading, planId, startDate, endDate, totalAmount, navigate])

  useEffect(() => {
    if (!planId || !startDate || !endDate || !totalAmount || !user || called.current) return
    called.current = true

    const run = async () => {
      const userId = user.id
      let success = false

      // Edge Function 시도 (Solar AI)
      try {
        const { data: { session } } = await supabase.auth.getSession()
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
              distribution_pattern: distribution ?? 'even',
            }),
          }
        )
        if (res.ok) success = true
      } catch (_) {}

      // Edge Function 실패 시 브라우저에서 직접 수학적 분배.
      // Edge Function과 동일하게, 결과가 기록된 날(완료·미완료)은 보존하고
      // 남은 학습량만 빈 날짜에 다시 나눈다 — 계획을 수정해도 완료 기록이 사라지지 않도록.
      if (!success) {
        const { data: existing } = await supabase
          .from('milrim_plan_days')
          .select('date, status, actual_amount')
          .eq('plan_id', planId)
          .neq('status', 'pending')

        const kept = existing ?? []
        const keptDates = new Set(kept.map(d => d.date))
        const completedAmount = kept
          .filter(d => d.status === 'complete')
          .reduce((sum, d) => sum + (d.actual_amount ?? 0), 0)
        const remaining = Math.max(0, totalAmount - completedAmount)
        const openDates = datesBetween(startDate, endDate).filter(d => !keptDates.has(d))

        await supabase.from('milrim_plan_days').delete().eq('plan_id', planId).eq('status', 'pending')
        const rows = distributeOverDates(openDates, remaining).map(d => ({
          ...d, plan_id: planId, user_id: userId, study_seconds: 0,
        }))
        if (rows.length > 0) await supabase.from('milrim_plan_days').insert(rows)
        // 코멘트도 함께 채운다 — 비워두면 "AI 메이트의 한 마디" 카드가 사라지고,
        // 재생성인 경우엔 예전 코멘트가 새 숫자 위에 그대로 남는다.
        // 이 경로는 균등 분배라 배분 방식을 주장하지 않는 문구를 쓰고, 배지는 숨긴다.
        await supabase.from('milrim_plans').update({
          generated_by: 'fallback',
          ai_strategy: FALLBACK_COMMENT,
          ai_comment_by: 'fallback',
        }).eq('id', planId)
      }
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
        AI가 학습 계획을<br />만들어 드리고 있어요
      </div>
      <div style={{ fontSize: 13.5, color: '#C2E098', marginTop: 14, textAlign: 'center', lineHeight: 1.6 }}>
        기간 · 시간 · 학습량을 분석해서<br />일간 · 주간 · 최소 달성 목표를 만들게요
      </div>
      <div style={{
        position: 'fixed', bottom: 28, left: 0, right: 0, textAlign: 'center',
        fontSize: 11.5, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.4,
      }}>
        Powered by Solar
      </div>
    </div>
  )
}
