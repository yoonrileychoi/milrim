import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Day = { date: string; target_amount: number; min_amount: number }
type Pattern = 'front' | 'back' | 'even'

// Deno 환경이라 src/lib/*를 import할 수 없어 날짜 유틸을 이 파일에 복제한다
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
 * 예) 80을 6일에 → 13·14·13·14·13·13 (13과 14를 번갈아 놓아 의도적으로 섞은 느낌)
 * 날짜 간 차이는 항상 ≤1.
 * totalAmount < 일수인 경우 배정 0인 날은 생략(휴식일, CHECK target>0 위반 방지).
 */
function evenAmounts(totalDays: number, total: number): number[] {
  const base = Math.floor(total / totalDays)
  const extra = total % totalDays
  const amounts = new Array(totalDays).fill(base)
  // 2번째 날부터 한 칸씩 걸러 +1을 놓고(1,3,5…), 다 못 놓으면 나머지 짝수 칸(2,4,6…)에 이어 놓는다.
  // 기간 전체에 균등 분산(1,4처럼 넓게 벌리기)하면 사용자에겐 숫자가 불규칙하게 널뛰어 보인다.
  const slots: number[] = []
  for (let i = 1; i < totalDays && slots.length < extra; i += 2) slots.push(i)
  for (let i = 2; i < totalDays && slots.length < extra; i += 2) slots.push(i)
  for (const i of slots) amounts[i] += 1
  return amounts
}

/** 주어진 기울기 s로 선형 분배를 만든다. 합계는 정확히 total, 모든 날 정수. */
function rampWith(totalDays: number, total: number, direction: 'front' | 'back', s: number): number[] {
  const mean = total / totalDays
  // i=0..D-1 선형 가중치. front: 앞이 무겁게(내림차순), back: 뒤가 무겁게(오름차순)
  const real: number[] = []
  for (let i = 0; i < totalDays; i++) {
    const t = (2 * i) / (totalDays - 1) - 1 // -1 → +1
    const w = direction === 'front' ? 1 - s * t : 1 + s * t
    real.push(mean * w) // sum(w)=D 이므로 sum(real)=total
  }
  const floors = real.map((r) => Math.floor(r))
  let deficit = total - floors.reduce((a, b) => a + b, 0) // 0 ≤ deficit < D
  const amounts = [...floors]
  // 남은 +1을 무거운 쪽 끝에서부터 배정 → 단조 방향 유지
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
 * '초반집중(front)'·'후반집중(back)' 분배.
 * 기울기 0.4(3일 이하는 0.25)에서 시작해 가드에 걸리면 0.05씩 낮춰 다시 계산한다.
 * 하루 평균이 작을 때(예: 30강/7일) 예전처럼 통째로 '고르게'로 되돌아가지 않고,
 * 완만하게라도 사용자가 고른 방향을 살린다. 하루 평균이 큰 계획은 첫 기울기에서
 * 바로 통과하므로 기존 결과와 동일하다.
 * 최소 기울기(0.05)로도 가드를 못 넘기면 null — 호출부가 '고르게'로 처리한다.
 */
function rampAmounts(totalDays: number, total: number, direction: 'front' | 'back'): number[] | null {
  const mean = total / totalDays
  if (totalDays <= 1 || mean < 3) return null // 기울기를 줄 재료가 없음
  const start = totalDays <= 3 ? 0.25 : 0.4
  for (let s = start; s >= 0.05 - 1e-9; s -= 0.05) {
    const amounts = rampWith(totalDays, total, direction, s)
    if (withinGuard(amounts) && isMonotone(amounts, direction)) return amounts
  }
  return null
}

/**
 * 주어진 날짜 목록에 패턴대로 확정 분배(수학 기반, 항상 유효)를 만든다.
 * 날짜 목록을 받는 이유: 이미 기록이 있는 날은 건너뛰고 남은 날짜에만 배분해야 하므로
 * 연속되지 않은 날짜가 들어올 수 있다.
 * 초반/후반집중을 어떤 기울기로도 적용할 수 없으면 '고르게'로 내려가며,
 * 이때 반환하는 pattern도 'even'으로 바꾼다 — 화면 숫자는 고른데 기록·코멘트만
 * '초반집중'이라고 하는 표기·구현 불일치를 막기 위함.
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
    if (target <= 0) continue // 학습량 < 일수: 배정 없는 날 생략
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
  if (amounts.reduce((a, b) => a + b, 0) !== total) return false // 합계 보존 필수
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  if (max > min * 2.5) return false // 극단 몰빵 방지

  if (pattern === 'even') {
    return max - min <= 1 // 고르게: 차이 ≤1 유지
  }
  // 초반/후반: 방향이 끝까지 유지돼야 한다.
  // 예전엔 전반부 합 vs 후반부 합만 봤는데(작은 굴곡 허용), 그러면 Solar가
  // 6·5·5·4·3·3·4 처럼 마지막에 다시 올라가는 분배를 내놔도 통과했다.
  // 초반집중인데 마지막 날이 전날보다 많으면 사용자에겐 그냥 틀린 계획이다.
  return isMonotone(amounts, pattern)
}

const PATTERN_LABEL: Record<Pattern, string> = {
  even: '고르게 — 매일 비슷한 분량(날짜 간 차이 최소)',
  front: '초반집중 — 앞쪽 날짜를 더 무겁게, 뒤로 갈수록 가볍게',
  back: '후반집중 — 앞쪽을 가볍게 시작해 뒤로 갈수록 무겁게',
}

// Solar 실패 시 쓰는 정적 코멘트(패턴별). AI 배지 없이 표시된다.
const STATIC_COMMENT: Record<Pattern, string> = {
  even: '매일 비슷한 분량으로 고르게 나눠봤어요. 꾸준함이 가장 큰 힘이 돼요.',
  front: '처음에 조금 더 하고 뒤로 갈수록 가벼워지도록 나눴어요. 부담 없이 시작해봐요.',
  back: '가볍게 시작해서 뒤로 갈수록 조금씩 늘어나도록 나눴어요. 천천히 이어가봐요.',
}

// 고른 배분 방식을 어떤 기울기로도 적용할 수 없어 '고르게'로 내려간 경우.
// Solar에 맡기면 이 사정을 정확히 전달하지 못할 수 있어 고정 문구를 쓴다(AI 배지 숨김).
const COLLAPSED_COMMENT =
  '선택하신 방식대로 나누면 특정 날의 부담이 너무 커져서, 이번 계획은 고르게 나눴어요.'

// 코멘트가 하지 말아야 할 말 — 계획을 막 만든 시점이라 진행 상황이 존재하지 않는다.
// Solar가 "잘 진행되고 있네요" 같은 없는 사실을 지어내는 사례가 있어 걸러낸다.
const PROGRESS_CLAIM_WORDS = [
  '진행되고', '진행 중', '진행중', '잘 하고', '잘하고', '잘 해오', '해오셨', '해오신',
  '달성률', '지금까지', '그동안', '완료하셨', '완료하신', '벌써',
]
const claimsProgress = (s: string) => PROGRESS_CLAIM_WORDS.some((w) => s.includes(w))

const SOLAR_SYSTEM = '학습 플래너 AI입니다. 요청한 JSON 형식으로만 응답합니다. 설명 없이 JSON만 출력하세요.'

/** Solar chat 1회 호출. 실패(네트워크·타임아웃·비정상 응답) 시 null. 응답 안의 JSON 객체를 파싱해 반환. */
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

/**
 * Solar에게 줄 패턴별 규칙. 말로만 "방향을 유지하라"고 하면 6·5·5·4·3·3·4 처럼
 * 마지막에 다시 올라가는 답이 오므로, 지켜야 할 형태·틀린 예·자기 점검 방법을 함께 준다.
 */
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

    const body = await req.json()
    const { plan_id, title, start_date, end_date, daily_minutes, unit, total_amount } = body
    const rawPattern = body.distribution_pattern
    const pattern: Pattern = ['front', 'back', 'even'].includes(rawPattern) ? rawPattern : 'even'

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

    // 1) 이미 결과가 기록된 날(완료·미완료)은 보존한다.
    //    계획을 수정해 다시 생성하더라도 "그날 실제로 공부했다"는 사실까지 사라지면 안 된다.
    //    (예전에는 plan_id로만 필터해 전부 지워서 완료 기록·누적 공부일·진행률이 함께 리셋됐다)
    const { data: existingDays, error: existingError } = await supabase
      .from('milrim_plan_days')
      .select('date, status, actual_amount')
      .eq('plan_id', plan_id)
      .neq('status', 'pending')
    if (existingError) throw existingError

    const keptDays = existingDays ?? []
    const keptDates = new Set(keptDays.map((d: any) => d.date))
    const completedDays = keptDays.filter((d: any) => d.status === 'complete')
    const completedAmount = completedDays.reduce((s: number, d: any) => s + (d.actual_amount ?? 0), 0)

    // 새로 배분할 몫과 날짜 — 완료한 양은 빼고, 기록이 있는 날은 건너뛴다
    const remainingAmount = Math.max(0, total_amount - completedAmount)
    const openDates: string[] = []
    for (let i = 0; i < totalDays; i++) {
      const d = addDaysStr(start_date, i)
      if (!keptDates.has(d)) openDates.push(d)
    }

    // 2) 확정 분배(수학, 보통 강도)를 먼저 만든다 — 항상 유효한 base
    //    초반/후반집중을 적용할 수 없었으면 effectivePattern이 'even'으로 내려온다.
    const built = buildDistribution(openDates, remainingAmount, pattern)
    const base = built.days
    const effectivePattern = built.pattern
    const collapsed = effectivePattern !== pattern

    console.log('generate-plan preserve:', {
      keptDays: keptDays.length, completedDays: completedDays.length,
      completedAmount, remainingAmount, openDates: openDates.length,
    })

    let days: Day[] = base
    let aiComment: string | null = null
    let generatedBy: 'solar' | 'fallback' = 'fallback'
    let commentBy: 'solar' | 'fallback' = 'fallback'

    const solarKey = Deno.env.get('SOLAR_API_KEY')

    // 3) [분배 다듬기] Solar에게 base 초안을 보여주고 튀는 날만 보정하게 한다(숫자만).
    //    검증(패턴 방향·합계·가드) 통과 시 채택, 실패/거부 시 base(수학) 유지.
    if (effectivePattern === 'even') {
      // '고르게'는 모든 날의 조건이 같아 정답이 산수로 하나로 정해진다. AI가 판단할 재료가
      // 없고, 실제로 Solar가 손대면 나빠지기만 했다(실측: 방향 위반·합계 위반).
      // 그래서 다듬기 호출을 아예 하지 않는다 — 계획 생성이 5초 빨라지기도 한다.
      // 초반/후반집중은 다듬을 여지가 있으므로 아래에서 그대로 Solar를 부른다.
      // (코멘트는 패턴과 무관하게 Solar가 쓴다 — 4단계 참조)
      console.log('generate-plan adjust: even 패턴이라 Solar 다듬기 생략', {
        finalAmounts: days.map((d) => d.target_amount),
      })
    } else if (solarKey && base.length > 0) {
      const draftLines = base.map((d) => `${d.date}: ${d.target_amount}${unit}`).join('\n')
      const { rule, selfCheck } = patternRuleFor(effectivePattern)
      const adjustPrompt = `아래는 학습 계획 초안입니다. 목표·기간·하루 학습 가능 시간을 고려해 부자연스럽게 튀는 날만 자연스럽게 다듬어주세요.

목표: ${title}
기간: ${start_date} ~ ${end_date} (총 ${totalDays}일)
하루 학습 가능 시간: ${daily_minutes}분 (모든 날짜에 동일)
학습 단위: ${unit}
분배 방식: ${PATTERN_LABEL[effectivePattern]}${completedDays.length > 0
  ? `\n이미 완료한 날: ${completedDays.length}일 (${completedAmount}${unit} 완료) — 아래 초안은 남은 ${remainingAmount}${unit}만 다시 나눈 것`
  : ''}

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
      console.log('generate-plan adjust:', {
        requestedPattern: pattern, effectivePattern, collapsed, generatedBy,
        baseAmounts: base.map((d) => d.target_amount),
        // Solar가 뭘 내놨고 채택됐는지 — 거부됐다면 규칙을 어긴 응답을 그대로 남긴다
        solarAmounts: Array.isArray(parsed?.days) ? parsed.days.map((d: any) => d?.target_amount) : null,
        solarAccepted: !!adjusted,
        finalAmounts: days.map((d) => d.target_amount),
      })
    }

    // 4) [코멘트] 최종 확정된 숫자(days)를 기준으로 Solar에게 코멘트를 별도 요청. 실패 시 1회 재시도.
    //    분배가 solar였든 수학이었든 무관하게, 코멘트 출처(commentBy)만 배지 기준이 된다.
    const hasProgress = completedDays.length > 0
    if (collapsed) {
      // 고른 방식을 적용하지 못한 사정은 Solar에 맡기지 않고 정확히 알린다.
      aiComment = COLLAPSED_COMMENT
      commentBy = 'fallback'
      console.log('generate-plan comment: collapsed → 고정 안내 문구 사용')
    } else if (solarKey && days.length > 0) {
      const finalLines = days.map((d) => `${d.date}: ${d.target_amount}${unit}`).join('\n')

      // 신규 생성이면 진행 상황이 존재하지 않는다 — Solar가 "잘 진행되고 있네요" 같은
      // 없는 사실을 지어내는 사례가 있어 금지한다. 반대로 완료 기록이 남아 있는
      // 재생성이라면 실제 진행 상황을 언급해도 된다(사실이므로).
      const progressBlock = hasProgress
        ? `진행 상황: 총 ${total_amount}${unit} 중 ${completedAmount}${unit}을 이미 완료(${completedDays.length}일).
아래 계획은 남은 ${remainingAmount}${unit}을 다시 나눈 것입니다.`
        : `진행 상황: 이 계획은 지금 막 만들어졌고, 아직 학습을 시작하지 않았습니다.`

      const progressRule = hasProgress
        ? `- 위 진행 상황을 언급해도 좋지만, 숫자를 지어내지 말고 위에 적힌 값만 사용할 것.
- 이미 한 만큼을 인정해주되 "밀렸다"·"실패"·"부족하다"는 식으로 압박하지 말 것.`
        : `- 사용자는 아직 학습을 시작하지 않았다. 진행 상황·달성률·과거 수행을 언급하지 말 것.
  (금지 예: "잘 진행되고 있네요", "계획대로 잘 하고 계세요", "지금까지 꾸준히 해오셨네요")
- 앞으로의 계획을 설명하거나 시작을 응원하는 내용만 쓸 것.
  (좋은 예: "매일 25페이지씩 학습하시면 목표일까지 충분히 끝낼 수 있어요.")`

      const commentPrompt = `아래는 확정된 학습 계획입니다. 이 계획을 설명하고 격려하는 코멘트를 한 문장 작성해주세요.

목표: ${title}
기간: ${start_date} ~ ${end_date} (총 ${totalDays}일)
하루 학습 가능 시간: ${daily_minutes}분 (모든 날짜에 동일)
학습 단위: ${unit}
분배 방식: ${PATTERN_LABEL[effectivePattern]}
${progressBlock}

확정 계획:
${finalLines}

규칙:
- 한국어 존댓말 한 문장(30~120자). 다정하고 담백하게.
${progressRule}
- 실제 분배 숫자와 모순되지 않게. 이모지는 쓰지 않는다.
- 하루 학습 가능 시간은 모든 날짜에 동일하므로, 날짜마다 시간을 고려한 듯한 표현은 쓰지 않는다.

응답 형식(JSON만):
{"comment":"한 줄 코멘트"}`

      let rejected = 0
      for (let attempt = 0; attempt < 2 && aiComment === null; attempt++) {
        const parsed = await solarChat(solarKey, commentPrompt, 4000)
        const text = parsed && typeof parsed.comment === 'string' ? parsed.comment.trim() : ''
        if (text.length < 10) continue
        // 신규 생성인데 없는 진행 상황을 말하면 채택하지 않는다(재시도 → 실패 시 정적 문구)
        if (!hasProgress && claimsProgress(text)) { rejected++; continue }
        aiComment = text.slice(0, 200)
        commentBy = 'solar'
      }
      console.log('generate-plan comment:', { hasProgress, commentBy, hasComment: aiComment !== null, rejected })
    }

    // 코멘트는 항상 존재해야 한다. Solar 코멘트를 못 받은 경우 패턴별 정적 문구(배지 숨김).
    if (aiComment === null) {
      aiComment = STATIC_COMMENT[effectivePattern]
      commentBy = 'fallback'
    }

    console.log('generate-plan final result:', {
      requestedPattern: pattern, effectivePattern, collapsed, generatedBy, commentBy, daysCount: days.length,
    })

    const rows = days.map((d) => ({
      plan_id, user_id: user.id, date: d.date, target_amount: d.target_amount, min_amount: d.min_amount,
    }))

    // 재생성 시 UNIQUE(plan_id, date) 위반 방지: 기존 행을 먼저 삭제.
    // 단 아직 손대지 않은 날(pending)만 지운다 — 완료·미완료로 결과가 기록된 날은
    // 보존해야 하므로(위 1단계 참조), 새 분배도 그 날짜들을 비켜 간다.
    // (anon + 사용자 JWT 클라이언트이므로 RLS에 의해 본인 행만 삭제된다)
    const { error: deleteError } = await supabase
      .from('milrim_plan_days')
      .delete()
      .eq('plan_id', plan_id)
      .eq('status', 'pending')
    if (deleteError) throw deleteError

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('milrim_plan_days').insert(rows)
      if (insertError) throw insertError
    }

    // 무엇으로 생성됐는지 기록 (실패해도 계획 생성 자체는 성공이므로 throw하지 않음
    // — 여기서 500을 내면 브라우저 fallback이 분배 결과를 지우고 재분배해버림)
    const { error: markError } = await supabase
      .from('milrim_plans')
      .update({ generated_by: generatedBy, ai_strategy: aiComment, ai_comment_by: commentBy, distribution_pattern: effectivePattern })
      .eq('id', plan_id)
    if (markError) console.error('plan mark update failed:', markError)

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
