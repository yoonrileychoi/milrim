import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Day = { date: string; target_amount: number; min_amount: number }
type Pattern = 'front' | 'back' | 'even'

// Deno 환경이라 src/lib/*를 import할 수 없어 날짜·분배 유틸을 이 파일에 복제한다.
// generate-plan/index.ts와 동일한 알고리즘 — 한쪽을 고치면 다른 쪽도 같이 고칠 것.
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

const minAmountOf = (target: number) => Math.max(1, Math.ceil(target * 0.2))

/**
 * '고르게(even)' 분배: base를 모든 날에 깔고, 나머지(extra)를 한 칸씩 걸러 배치한다.
 * 예) 80을 6일에 → 13·14·13·14·13·13
 */
function evenAmounts(totalDays: number, total: number): number[] {
  const base = Math.floor(total / totalDays)
  const extra = total % totalDays
  const amounts = new Array(totalDays).fill(base)
  const slots: number[] = []
  for (let i = 1; i < totalDays && slots.length < extra; i += 2) slots.push(i)
  for (let i = 2; i < totalDays && slots.length < extra; i += 2) slots.push(i)
  for (const i of slots) amounts[i] += 1
  return amounts
}

/** 주어진 기울기 s로 선형 분배를 만든다. 합계는 정확히 total, 모든 날 정수. */
function rampWith(totalDays: number, total: number, direction: 'front' | 'back', s: number): number[] {
  const mean = total / totalDays
  const real: number[] = []
  for (let i = 0; i < totalDays; i++) {
    const t = (2 * i) / (totalDays - 1) - 1 // -1 → +1
    const w = direction === 'front' ? 1 - s * t : 1 + s * t
    real.push(mean * w)
  }
  const floors = real.map((r) => Math.floor(r))
  let deficit = total - floors.reduce((a, b) => a + b, 0)
  const amounts = [...floors]
  if (direction === 'front') {
    for (let i = 0; i < totalDays && deficit > 0; i++, deficit--) amounts[i] += 1
  } else {
    for (let i = totalDays - 1; i >= 0 && deficit > 0; i--, deficit--) amounts[i] += 1
  }
  return amounts
}

/** 가드: 모든 날 1 이상 + 최대 ≤ 최소의 2.5배(특정 날 몰빵 방지). */
function withinGuard(amounts: number[]): boolean {
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  return min >= 1 && max <= min * 2.5
}

/** 방향(앞이 무겁게/뒤가 무겁게)이 끝까지 유지되는지. */
function isMonotone(amounts: number[], direction: 'front' | 'back'): boolean {
  return direction === 'front'
    ? amounts.every((v, i) => i === 0 || v <= amounts[i - 1])
    : amounts.every((v, i) => i === 0 || v >= amounts[i - 1])
}

/**
 * 초반집중·후반집중 분배. 기울기 0.4(3일 이하는 0.25)에서 시작해 가드에 걸리면 0.05씩 낮춰
 * 다시 계산한다. 최소 기울기로도 안 되면 null — 호출부가 '고르게'로 처리한다.
 */
function rampAmounts(totalDays: number, total: number, direction: 'front' | 'back'): number[] | null {
  const mean = total / totalDays
  if (totalDays <= 1 || mean < 3) return null
  const start = totalDays <= 3 ? 0.25 : 0.4
  for (let s = start; s >= 0.05 - 1e-9; s -= 0.05) {
    const amounts = rampWith(totalDays, total, direction, s)
    if (withinGuard(amounts) && isMonotone(amounts, direction)) return amounts
  }
  return null
}

/**
 * 주어진 날짜 목록에 패턴대로 확정 분배를 만든다.
 * 초반/후반집중을 어떤 기울기로도 적용할 수 없으면 '고르게'로 내려가고 pattern도 'even'을 돌려준다.
 */
function buildDistribution(
  dates: string[], total: number, pattern: Pattern
): { days: Day[]; pattern: Pattern } {
  const totalDays = dates.length
  if (totalDays <= 0 || total <= 0) return { days: [], pattern }

  let amounts: number[] | null = null
  if (pattern === 'front' || pattern === 'back') amounts = rampAmounts(totalDays, total, pattern)
  const effective: Pattern = amounts ? pattern : 'even'
  if (!amounts) amounts = evenAmounts(totalDays, total)

  const days: Day[] = []
  for (let i = 0; i < totalDays; i++) {
    const target = amounts[i]
    if (target <= 0) continue // 남은 학습량 < 날짜 수: 배정 없는 날 생략
    days.push({ date: dates[i], target_amount: target, min_amount: minAmountOf(target) })
  }
  return { days, pattern: effective }
}

/** Solar가 다듬은 분배가 패턴/가드를 지키는지 검증. 어기면 원래(base) 분배를 유지한다. */
function isValidAdjustment(candidate: any, base: Day[], total: number, pattern: Pattern): boolean {
  if (!Array.isArray(candidate) || candidate.length !== base.length) return false
  const baseDates = base.map((d) => d.date)
  const amounts: number[] = []
  for (let i = 0; i < candidate.length; i++) {
    const c = candidate[i]
    if (!c || c.date !== baseDates[i]) return false
    if (!Number.isInteger(c.target_amount) || c.target_amount < 1) return false
    amounts.push(c.target_amount)
  }
  if (amounts.reduce((a, b) => a + b, 0) !== total) return false
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  if (max > min * 2.5) return false
  if (pattern === 'even') return max - min <= 1
  return isMonotone(amounts, pattern)
}

const PATTERN_LABEL: Record<Pattern, string> = {
  even: '고르게 — 매일 비슷한 분량(날짜 간 차이 최소)',
  front: '초반집중 — 앞쪽 날짜를 더 무겁게, 뒤로 갈수록 가볍게',
  back: '후반집중 — 앞쪽을 가볍게 시작해 뒤로 갈수록 무겁게',
}

/** Solar에게 줄 패턴별 규칙 — 지켜야 할 형태·틀린 예·자기 점검 방법을 함께 준다. */
function patternRuleFor(p: Pattern): { rule: string; selfCheck: string } {
  if (p === 'front') {
    return {
      rule: '값이 첫날부터 마지막 날까지 계속 줄어들거나 같아야 한다. 바로 앞 날보다 큰 날이 하나라도 있으면 안 된다.\n  (틀린 예: 6, 5, 5, 4, 3, 3, 4 — 마지막 날이 바로 앞 날보다 크다)\n  (맞는 예: 6, 6, 5, 4, 3, 3, 3)',
      selfCheck: '이웃한 날을 앞에서부터 순서대로 비교해, 뒤 날이 앞 날보다 큰 곳이 한 군데도 없는지 확인',
    }
  }
  if (p === 'back') {
    return {
      rule: '값이 첫날부터 마지막 날까지 계속 늘어나거나 같아야 한다. 바로 앞 날보다 작은 날이 하나라도 있으면 안 된다.\n  (틀린 예: 3, 3, 4, 4, 5, 6, 5 — 마지막 날이 바로 앞 날보다 작다)\n  (맞는 예: 3, 3, 3, 4, 5, 6, 6)',
      selfCheck: '이웃한 날을 앞에서부터 순서대로 비교해, 뒤 날이 앞 날보다 작은 곳이 한 군데도 없는지 확인',
    }
  }
  return {
    rule: '모든 날의 값이 거의 같아야 한다. 가장 큰 값과 가장 작은 값의 차이가 1을 넘으면 안 된다.',
    selfCheck: '가장 큰 값에서 가장 작은 값을 뺀 결과가 1 이하인지 확인',
  }
}

// Solar 코멘트를 못 받았을 때 쓰는 정적 문구(배분 방식별). AI 배지 없이 표시된다.
// 계획 생성(generate-plan)과 같은 구조이되, 문구는 "밀린 뒤 다시 나눈다"는 재계획 맥락에 맞췄다.
const STATIC_COMMENT: Record<Pattern, string> = {
  even: '목표일은 그대로 두고, 남은 학습량을 매일 비슷하게 다시 나눴어요.',
  front: '남은 학습량을 앞쪽에 조금 더 실어 다시 나눴어요. 여유가 있을 때 당겨두면 뒤가 편해져요.',
  back: '남은 학습량을 뒤로 갈수록 늘어나게 다시 나눴어요. 가볍게 다시 시작해봐요.',
}

// 고른 배분 방식을 어떤 기울기로도 적용할 수 없어 '고르게'로 내려간 경우.
const COLLAPSED_COMMENT =
  '남은 분량으로는 선택하신 방식대로 나누기 어려워, 이번엔 매일 비슷하게 나눴어요.'

const SOLAR_SYSTEM = '학습 플래너 AI 코치입니다. 요청한 JSON 형식으로만 응답합니다. 설명 없이 JSON만 출력하세요.'

/** Solar chat 1회 호출. 실패 시 null. 응답 안의 JSON 객체를 파싱해 반환. */
async function solarChat(key: string, userPrompt: string, timeoutMs: number): Promise<any | null> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('https://api.upstage.ai/v1/solar/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'solar-mini',
        messages: [
          { role: 'system', content: SOLAR_SYSTEM },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    const content: string = json.choices?.[0]?.message?.content ?? ''
    const m = content.match(/\{[\s\S]*\}/)
    if (!m) return null
    return JSON.parse(m[0])
  } catch (_) {
    return null
  } finally {
    clearTimeout(t)
  }
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
      .select('id, title, unit, daily_minutes, end_date, total_amount, replan_count, distribution_pattern')
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

    // 계획 생성 때 사용자가 고른 배분 방식을 재계획에도 그대로 적용한다.
    // (재계획이 이 값을 덮어쓰지는 않는다 — 사용자의 선택은 계획의 속성이므로 보존)
    const rawPattern = plan.distribution_pattern
    const pattern: Pattern = ['front', 'back', 'even'].includes(rawPattern) ? rawPattern : 'even'

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

    // 재분배 대상 날짜 = 내일 ~ 목표일. 단 이미 결과가 기록된 날(미리 완료 처리한 날 등)은 건너뛴다.
    const keptFutureDates = new Set(
      (allDays ?? []).filter((d) => d.date >= tomorrow_date && d.status !== 'pending').map((d) => d.date)
    )
    const totalDays = Math.round(
      (new Date(plan.end_date + 'T00:00:00').getTime() - new Date(tomorrow_date + 'T00:00:00').getTime()) / 86400000
    ) + 1
    const openDates: string[] = []
    for (let i = 0; i < totalDays; i++) {
      const d = addDaysStr(tomorrow_date, i)
      if (!keptFutureDates.has(d)) openDates.push(d)
    }

    const pastTarget = pastDays.reduce((sum, d) => sum + d.target_amount, 0)
    const paceRate = pastTarget > 0 ? Math.round((completedAmount / pastTarget) * 100) : null

    // 1) 수학으로 분배 확정 — 항상 유효한 base
    const built = buildDistribution(openDates, remainingAmount, pattern)
    const base = built.days
    const effectivePattern = built.pattern
    const collapsed = effectivePattern !== pattern

    let days: Day[] = base
    let aiComment: string | null = null
    let generatedBy: 'solar' | 'fallback' = 'fallback'
    let commentBy: 'solar' | 'fallback' = 'fallback'

    const solarKey = Deno.env.get('SOLAR_API_KEY')

    console.log('milrim-replan input:', {
      requestedPattern: pattern, effectivePattern, collapsed,
      completedDays: completedDays.length, incompleteDays: incompleteDays.length,
      completedAmount, remainingAmount, openDates: openDates.length, paceRate,
    })

    // 2) [분배 다듬기] 고르게는 정답이 산수로 하나라 Solar를 부르지 않는다.
    //    초반/후반집중만 Solar에게 규칙과 함께 보정을 맡기고, 우리가 다시 검증한다.
    if (effectivePattern === 'even') {
      console.log('milrim-replan adjust: even 패턴이라 Solar 다듬기 생략')
    } else if (solarKey && base.length > 0) {
      const draftLines = base.map((d) => `${d.date}: ${d.target_amount}${plan.unit}`).join('\n')
      const { rule, selfCheck } = patternRuleFor(effectivePattern)
      const adjustPrompt = `아래는 계획이 밀린 사용자를 위해 다시 만든 학습 계획 초안입니다. 부자연스럽게 튀는 날만 자연스럽게 다듬어주세요.

목표: ${plan.title}
재분배 기간: ${tomorrow_date} ~ ${plan.end_date} (총 ${openDates.length}일)
하루 학습 가능 시간: ${plan.daily_minutes}분 (모든 날짜에 동일)
학습 단위: ${plan.unit}
분배 방식: ${PATTERN_LABEL[effectivePattern]}
지금까지 완료한 날: ${completedDays.length}일, 밀린 날: ${incompleteDays.length}일${paceRate !== null ? ` (목표량 대비 달성률 약 ${paceRate}%)` : ''}

계획 초안:
${draftLines}

규칙(하나라도 어기면 그 답은 폐기됩니다):
1. 날짜 목록과 순서는 초안과 완전히 동일해야 한다 (${base.length}개, 날짜를 추가·삭제·변경 금지)
2. target_amount를 전부 더한 값이 정확히 ${remainingAmount}이어야 한다
3. 모든 값은 1 이상의 정수여야 한다
4. ${rule}
5. 가장 큰 값이 가장 작은 값의 2.5배를 넘으면 안 된다
6. 초안에서 크게 벗어나지 말 것. 명백히 이상한 날만 소폭 조정하고, 이상이 없으면 초안을 그대로 반환한다

제출 전에 아래를 직접 확인하세요:
- 값을 전부 더해 ${remainingAmount}인지 계산해볼 것
- ${selfCheck}
- 확인 결과 하나라도 어긋나면, 억지로 고치지 말고 **초안을 그대로 반환**할 것

응답 형식(JSON만):
{"days":[{"date":"YYYY-MM-DD","target_amount":숫자}]}`

      const parsed = await solarChat(solarKey, adjustPrompt, 5000)
      const adjusted = parsed && isValidAdjustment(parsed.days, base, remainingAmount, effectivePattern)
      if (adjusted) {
        days = parsed.days.map((d: any) => ({
          date: d.date, target_amount: d.target_amount, min_amount: minAmountOf(d.target_amount),
        }))
        generatedBy = 'solar'
      }
      console.log('milrim-replan adjust:', {
        effectivePattern, generatedBy,
        baseAmounts: base.map((d) => d.target_amount),
        solarAmounts: Array.isArray(parsed?.days) ? parsed.days.map((d: any) => d?.target_amount) : null,
        solarAccepted: !!adjusted,
        finalAmounts: days.map((d) => d.target_amount),
      })
    }

    // 3) [코멘트] 확정된 숫자를 기준으로 Solar에게 격려 코멘트를 별도 요청. 실패 시 1회 재시도.
    //    재계획은 밀린 뒤 상황이라 진행 이력을 언급해도 된다(사실이므로). 대신 압박 표현을 금지한다.
    //    코멘트는 항상 존재해야 한다 — 못 받으면 정적 문구를 쓰고 배지를 숨긴다.
    if (collapsed) {
      aiComment = COLLAPSED_COMMENT
      commentBy = 'fallback'
      console.log('milrim-replan comment: collapsed → 고정 안내 문구 사용')
    } else if (solarKey && days.length > 0) {
      const finalLines = days.map((d) => `${d.date}: ${d.target_amount}${plan.unit}`).join('\n')
      const commentPrompt = `아래는 계획이 밀린 사용자를 위해 다시 나눈 학습 계획입니다. 이 계획을 설명하고 격려하는 코멘트를 한 문장 작성해주세요.

목표: ${plan.title}
학습 단위: ${plan.unit}
하루 학습 가능 시간: ${plan.daily_minutes}분 (모든 날짜에 동일)
분배 방식: ${PATTERN_LABEL[effectivePattern]}
진행 상황: 전체 ${plan.total_amount}${plan.unit} 중 ${completedAmount}${plan.unit} 완료(${completedDays.length}일), 밀린 날 ${incompleteDays.length}일${paceRate !== null ? `, 목표량 대비 달성률 약 ${paceRate}%` : ''}
이번이 ${(plan.replan_count ?? 0) + 1}번째 재계획입니다. 목표일(${plan.end_date})은 바꾸지 않았습니다.

다시 나눈 계획:
${finalLines}

규칙:
- 한국어 존댓말 한 문장(30~120자). 다정하고 담백하게.
- 위 진행 상황을 언급해도 좋지만, 숫자를 지어내지 말고 위에 적힌 값만 사용할 것.
- "밀렸다"·"실패"·"부족하다"처럼 사용자를 탓하거나 압박하는 표현과 이모지는 쓰지 않는다.
- 목표일을 미루지 않았다는 점, 다시 이어갈 수 있다는 점을 담을 것.
- 실제 분배 숫자와 모순되지 않게. 하루 학습 가능 시간은 모든 날짜에 동일하므로
  날짜마다 시간을 고려한 듯한 표현은 쓰지 않는다.

응답 형식(JSON만):
{"comment":"한 줄 코멘트"}`

      for (let attempt = 0; attempt < 2 && aiComment === null; attempt++) {
        const parsed = await solarChat(solarKey, commentPrompt, 4000)
        const text = parsed && typeof parsed.comment === 'string' ? parsed.comment.trim() : ''
        if (text.length < 10) continue
        aiComment = text.slice(0, 200)
        commentBy = 'solar'
      }
      console.log('milrim-replan comment:', { commentBy, hasComment: aiComment !== null })
    }

    if (aiComment === null) {
      aiComment = STATIC_COMMENT[effectivePattern]
      commentBy = 'fallback'
    }

    console.log('milrim-replan final result:', {
      requestedPattern: pattern, effectivePattern, collapsed,
      generatedBy, commentBy, daysCount: days.length,
    })

    const rows = days.map((d) => ({
      plan_id,
      user_id: user.id,
      date: d.date,
      target_amount: d.target_amount,
      min_amount: d.min_amount,
    }))

    // 내일 이후의 아직 손대지 않은 날만 삭제한다. 오늘·과거는 물론이고,
    // 미리 완료 처리해둔 미래 날짜도 보존한다(위 openDates가 그 날짜를 이미 비켜 갔다).
    const { error: deleteError } = await supabase
      .from('milrim_plan_days')
      .delete()
      .eq('plan_id', plan_id)
      .gte('date', tomorrow_date)
      .eq('status', 'pending')
    if (deleteError) throw deleteError

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from('milrim_plan_days')
        .insert(rows)
      if (insertError) throw insertError
    }

    // distribution_pattern은 건드리지 않는다 — 사용자가 계획을 만들 때 고른 값이므로 보존한다.
    const { error: updateError } = await supabase
      .from('milrim_plans')
      .update({
        replan_count: (plan.replan_count ?? 0) + 1,
        ai_strategy: aiComment,
        ai_comment_by: commentBy,
        generated_by: generatedBy,
      })
      .eq('id', plan_id)
    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true, days_count: rows.length,
        ai_strategy: aiComment, ai_comment_by: commentBy, generated_by: generatedBy,
      }),
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
