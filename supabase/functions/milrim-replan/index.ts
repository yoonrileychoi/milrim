import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Deno 환경이라 src/lib/*를 import할 수 없어 분배 로직을 이 파일에 복제한다
// (generate-plan/index.ts의 addDaysStr·fallbackDays와 동일 알고리즘)
function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

function fallbackDays(
  startDate: string, endDate: string, totalAmount: number
): { date: string; target_amount: number; min_amount: number }[] {
  const totalDays = Math.round(
    (new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000
  ) + 1
  if (totalDays <= 0 || totalAmount <= 0) return []

  const base = Math.floor(totalAmount / totalDays)
  const extra = totalAmount % totalDays
  const days: { date: string; target_amount: number; min_amount: number }[] = []
  for (let i = 0; i < totalDays; i++) {
    const target = base + (i < extra ? 1 : 0)
    if (target <= 0) continue
    days.push({
      date: addDaysStr(startDate, i),
      target_amount: target,
      min_amount: Math.max(1, Math.ceil(target * 0.2)),
    })
  }
  return days
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    // tomorrow_date: 클라이언트가 로컬(KST) 기준으로 계산해 전달 — Deno 서버는 UTC라 "오늘"을
    // 서버에서 직접 계산하면 PLAN-fix-timezone-dates에서 고친 것과 같은 버그가 재발한다.
    const { plan_id, tomorrow_date } = await req.json()

    if (!plan_id || !tomorrow_date) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, headers: corsHeaders })
    }

    // plan_id 소유권 확인 (사용자 JWT + RLS: 본인 플랜이 아니면 조회되지 않음)
    const { data: plan, error: planError } = await supabase
      .from('milrim_plans')
      .select('id, title, unit, daily_minutes, end_date, total_amount, replan_count')
      .eq('id', plan_id)
      .maybeSingle()
    if (planError) throw planError
    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404, headers: corsHeaders })
    }

    if (tomorrow_date > plan.end_date) {
      return new Response(JSON.stringify({ success: true, days_count: 0, skipped: 'no_remaining_days' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: allDays, error: daysError } = await supabase
      .from('milrim_plan_days')
      .select('date, target_amount, status, actual_amount')
      .eq('plan_id', plan_id)
    if (daysError) throw daysError

    const pastDays = (allDays ?? []).filter((d) => d.date < tomorrow_date)
    const completedDays = pastDays.filter((d) => d.status === 'complete')
    const incompleteDays = pastDays.filter((d) => d.status === 'incomplete')
    const completedAmount = (allDays ?? [])
      .filter((d) => d.status === 'complete')
      .reduce((sum, d) => sum + (d.actual_amount ?? 0), 0)
    const remainingAmount = Math.max(0, plan.total_amount - completedAmount)

    if (remainingAmount <= 0) {
      return new Response(JSON.stringify({ success: true, days_count: 0, skipped: 'nothing_remaining' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const totalDays = Math.round(
      (new Date(plan.end_date + 'T00:00:00').getTime() - new Date(tomorrow_date + 'T00:00:00').getTime()) / 86400000
    ) + 1

    const expectedDates: string[] = []
    for (let i = 0; i < totalDays; i++) {
      expectedDates.push(addDaysStr(tomorrow_date, i))
    }

    const pastTarget = pastDays.reduce((sum, d) => sum + d.target_amount, 0)
    const paceRate = pastTarget > 0 ? Math.round((completedAmount / pastTarget) * 100) : null

    let days: { date: string; target_amount: number; min_amount: number }[] | undefined
    let aiComment: string | null = null

    const solarKey = Deno.env.get('SOLAR_API_KEY')

    if (solarKey) {
      const solarController = new AbortController()
      const solarTimeout = setTimeout(() => solarController.abort(), 4000)
      try {
        const res = await fetch('https://api.upstage.ai/v1/solar/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${solarKey}`,
            'Content-Type': 'application/json',
          },
          signal: solarController.signal,
          body: JSON.stringify({
            model: 'solar-mini',
            messages: [
              {
                role: 'system',
                content: '학습 플래너 AI 코치입니다. 요청한 JSON 형식으로만 응답합니다. 설명 없이 JSON만 출력하세요.',
              },
              {
                role: 'user',
                content: `사용자가 계획대로 학습을 진행하지 못해 재계획을 요청했습니다. 목표일은 그대로 두고
남은 기간에 남은 학습량을 다시 배분하고, 사용자에게 보여줄 격려·코칭 한 줄을 작성해주세요.

목표: ${plan.title}
학습 단위: ${plan.unit}
하루 학습 가능 시간: ${plan.daily_minutes}분
지금까지 완료한 날: ${completedDays.length}일, 밀린(미완료) 날: ${incompleteDays.length}일
${paceRate !== null ? `지금까지 목표량 대비 실제 달성률: 약 ${paceRate}%` : '아직 완료 이력 없음'}
지난 재계획 횟수: ${plan.replan_count ?? 0}회
재분배 기간: ${tomorrow_date} ~ ${plan.end_date} (총 ${totalDays}일)
재분배할 남은 학습량: ${remainingAmount}${plan.unit}

조건:
- ${tomorrow_date}부터 ${plan.end_date}까지 총 ${totalDays}개의 날짜를 모두 포함
- target_amount의 합이 정확히 ${remainingAmount}
- min_amount = max(1, ceil(target_amount × 0.2))
- 최근 달성률이 낮으면 초반은 조금 가볍게, 달성률이 높으면 균등하게 배분
- 정수만 사용
- comment는 사용자에게 보여줄 한국어 한 문장(20~40자, 존댓말, 비난 없이 격려)

응답 형식(JSON만):
{"days":[{"date":"YYYY-MM-DD","target_amount":숫자,"min_amount":숫자}],"comment":"한 줄 코멘트"}`,
              },
            ],
            temperature: 0.3,
          }),
        })

        if (res.ok) {
          const json = await res.json()
          const content = json.choices?.[0]?.message?.content ?? ''
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            const candidate = parsed.days
            if (
              Array.isArray(candidate) &&
              candidate.length === totalDays &&
              candidate.every((d: any, i: number) =>
                d.date === expectedDates[i] &&
                Number.isInteger(d.target_amount) && d.target_amount >= 0
              ) &&
              candidate.reduce((s: number, d: any) => s + d.target_amount, 0) === remainingAmount
            ) {
              days = candidate
                .filter((d: any) => d.target_amount > 0)
                .map((d: any) => ({
                  date: d.date,
                  target_amount: d.target_amount,
                  min_amount: Math.max(1, Math.ceil(d.target_amount * 0.2)),
                }))
              if (typeof parsed.comment === 'string' && parsed.comment.trim().length > 0) {
                aiComment = parsed.comment.trim().slice(0, 80)
              }
            }
          }
        }
      } catch (_) {
        // Solar 호출 실패 시 fallback
      } finally {
        clearTimeout(solarTimeout)
      }
    }

    const generatedBy = days ? 'solar' : 'fallback'

    if (!days) {
      days = fallbackDays(tomorrow_date, plan.end_date, remainingAmount)
      aiComment = null
    }

    const rows = days.map((d) => ({
      plan_id,
      user_id: user.id,
      date: d.date,
      target_amount: d.target_amount,
      min_amount: d.min_amount,
    }))

    // 내일 이후 기존 행 삭제 후 재삽입 (RLS로 본인 행만 대상)
    const { error: deleteError } = await supabase
      .from('milrim_plan_days')
      .delete()
      .eq('plan_id', plan_id)
      .gte('date', tomorrow_date)
    if (deleteError) throw deleteError

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from('milrim_plan_days')
        .insert(rows)
      if (insertError) throw insertError
    }

    const { error: updateError } = await supabase
      .from('milrim_plans')
      .update({
        replan_count: (plan.replan_count ?? 0) + 1,
        ai_strategy: aiComment,
        generated_by: generatedBy,
      })
      .eq('id', plan_id)
    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, days_count: rows.length, ai_strategy: aiComment, generated_by: generatedBy }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
