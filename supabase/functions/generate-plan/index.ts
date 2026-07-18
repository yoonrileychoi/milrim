import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Deno 환경이라 src/lib/*를 import할 수 없어 분배 로직을 이 파일에 복제한다
// (src/lib/date.ts의 addDaysStr, src/lib/distribute.ts의 distributeDays와 동일 알고리즘)
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

/**
 * startDate~endDate에 totalAmount를 균등 분배한다.
 * - base + extra 방식: 합계가 정확히 totalAmount
 * - totalAmount < 일수인 경우: 앞에서부터 1씩 배정하고, 배정량이 0인 날은
 *   행을 생성하지 않는다 (DB CHECK target_amount > 0 위반 방지).
 */
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
    if (target <= 0) continue // 학습량 < 일수: 배정 없는 날은 생략(휴식일)
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

    const { plan_id, title, start_date, end_date, daily_minutes, unit, total_amount } = await req.json()

    if (!plan_id || !start_date || !end_date || !total_amount || total_amount <= 0 || end_date < start_date) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, headers: corsHeaders })
    }

    // plan_id 소유권 확인 (사용자 JWT + RLS: 본인 플랜이 아니면 조회되지 않음)
    const { data: ownedPlan, error: planError } = await supabase
      .from('milrim_plans')
      .select('id')
      .eq('id', plan_id)
      .maybeSingle()
    if (planError) throw planError
    if (!ownedPlan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404, headers: corsHeaders })
    }

    const totalDays = Math.round(
      (new Date(end_date + 'T00:00:00').getTime() - new Date(start_date + 'T00:00:00').getTime()) / 86400000
    ) + 1

    // start_date부터 totalDays개의 기대 날짜열 (Solar 응답 검증용)
    const expectedDates: string[] = []
    for (let i = 0; i < totalDays; i++) {
      expectedDates.push(addDaysStr(start_date, i))
    }

    let days: { date: string; target_amount: number; min_amount: number }[] | undefined

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
                content: '학습 플래너 AI입니다. 요청한 JSON 형식으로만 응답합니다. 설명 없이 JSON만 출력하세요.',
              },
              {
                role: 'user',
                content: `다음 학습 목표의 일별 계획을 생성해주세요.

목표: ${title}
기간: ${start_date} ~ ${end_date} (총 ${totalDays}일)
하루 학습 가능 시간: ${daily_minutes}분
학습 단위: ${unit}
전체 학습량: ${total_amount}${unit}

조건:
- ${start_date}부터 ${end_date}까지 총 ${totalDays}개의 날짜를 모두 포함
- target_amount의 합이 정확히 ${total_amount}
- min_amount = max(1, ceil(target_amount × 0.2))
- 학습 가능 시간(${daily_minutes}분)에 비례해 분배 (짧은 날은 적게)
- 정수만 사용

응답 형식(JSON만):
{"days":[{"date":"YYYY-MM-DD","target_amount":숫자,"min_amount":숫자}]}`,
              },
            ],
            temperature: 0.2,
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
                d.date === expectedDates[i] &&                      // 날짜열이 start~end와 정확히 일치
                Number.isInteger(d.target_amount) && d.target_amount >= 0
              ) &&
              candidate.reduce((s: number, d: any) => s + d.target_amount, 0) === total_amount
            ) {
              // min_amount는 신뢰하지 않고 서버에서 재계산, 0-target 날은 생략
              days = candidate
                .filter((d: any) => d.target_amount > 0)
                .map((d: any) => ({
                  date: d.date,
                  target_amount: d.target_amount,
                  min_amount: Math.max(1, Math.ceil(d.target_amount * 0.2)),
                }))
            }
          }
        }
      } catch (_) {
        // Solar 호출 실패 시 fallback
      } finally {
        clearTimeout(solarTimeout)
      }
    }

    // Solar 실패 또는 키 없을 때 수학적 분배로 fallback
    const generatedBy = days ? 'solar' : 'fallback'
    if (!days) {
      days = fallbackDays(start_date, end_date, total_amount)
    }

    const rows = days.map((d) => ({
      plan_id,
      user_id: user.id,
      date: d.date,
      target_amount: d.target_amount,
      min_amount: d.min_amount,
    }))

    // 재생성 시 UNIQUE(plan_id, date) 위반 방지: 기존 행을 먼저 삭제
    // (anon + 사용자 JWT 클라이언트이므로 RLS에 의해 본인 행만 삭제된다)
    const { error: deleteError } = await supabase
      .from('milrim_plan_days')
      .delete()
      .eq('plan_id', plan_id)
    if (deleteError) throw deleteError

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from('milrim_plan_days')
        .insert(rows)

      if (insertError) throw insertError
    }

    // 무엇으로 생성됐는지 기록 (실패해도 계획 생성 자체는 성공이므로 throw하지 않음
    // — 여기서 500을 내면 브라우저 fallback이 Solar 분배 결과를 지우고 재분배해버림)
    const { error: markError } = await supabase
      .from('milrim_plans')
      .update({ generated_by: generatedBy })
      .eq('id', plan_id)
    if (markError) console.error('generated_by update failed:', markError)

    return new Response(
      JSON.stringify({ success: true, days_count: rows.length, generated_by: generatedBy }),
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
