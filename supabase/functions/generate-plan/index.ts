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
 * '고르게(even)' 분배: base를 모든 날에 깔고, 나머지(extra)를 기간 전체에
 * 고르게 흩어 배치(징검다리, 예: 26/25/26/25). 날짜 간 차이는 항상 ≤1.
 * totalAmount < 일수인 경우 배정 0인 날은 생략(휴식일, CHECK target>0 위반 방지).
 */
function evenAmounts(totalDays: number, total: number): number[] {
  const base = Math.floor(total / totalDays)
  const extra = total % totalDays
  const amounts = new Array(totalDays).fill(base)
  // extra개의 +1을 기간 전체에 고르게 분산
  for (let k = 0; k < extra; k++) {
    const pos = Math.floor((k + 0.5) * totalDays / extra)
    amounts[Math.min(pos, totalDays - 1)] += 1
  }
  return amounts
}

/**
 * '초반집중(front)'·'후반집중(back)' 분배: 평균을 중심으로 한 선형 기울기(보통 강도).
 * - 앞/뒤로 갈수록 완만하게 늘거나 줄어든다.
 * - 합계는 정확히 total, 모든 날 정수·1 이상, 단조(방향 유지)로 생성.
 * - 기간이 짧거나(≤3일) 하루 평균이 작으면(＜3) 기울기가 의미 없거나 극단이 되므로 even으로.
 */
function rampAmounts(totalDays: number, total: number, direction: 'front' | 'back'): number[] {
  const mean = total / totalDays
  if (totalDays <= 1 || mean < 3) return evenAmounts(totalDays, total)

  const s = totalDays <= 3 ? 0.25 : 0.4 // 보통 강도(최대/최소 ≈ 2.3배), 짧으면 완화
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

  // 가드: 최소 1 이상 + 최대 ≤ 최소의 2.5배(극단 몰빵 방지). 어기면 even으로 안전 복귀.
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  if (min < 1 || max > min * 2.5) return evenAmounts(totalDays, total)
  return amounts
}

/** 패턴에 맞는 확정 분배(수학 기반, 항상 유효)를 만든다. */
function buildDistribution(startDate: string, total: number, totalDays: number, pattern: Pattern): Day[] {
  if (totalDays <= 0 || total <= 0) return []
  const amounts =
    pattern === 'front' ? rampAmounts(totalDays, total, 'front')
    : pattern === 'back' ? rampAmounts(totalDays, total, 'back')
    : evenAmounts(totalDays, total)

  const days: Day[] = []
  for (let i = 0; i < totalDays; i++) {
    const target = amounts[i]
    if (target <= 0) continue // 학습량 < 일수: 배정 없는 날 생략
    days.push({ date: addDaysStr(startDate, i), target_amount: target, min_amount: minAmountOf(target) })
  }
  return days
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
  // 초반/후반: 전반부 합 vs 후반부 합으로 방향(무게중심)만 확인 — 작은 굴곡은 허용
  const half = Math.floor(amounts.length / 2)
  const frontSum = amounts.slice(0, amounts.length - half).reduce((a, b) => a + b, 0)
  const backSum = amounts.slice(amounts.length - half).reduce((a, b) => a + b, 0)
  return pattern === 'front' ? frontSum >= backSum : backSum >= frontSum
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

const directionText = (p: Pattern) => (p === 'front' ? '앞이 무겁게' : p === 'back' ? '뒤가 무겁게' : '매일 비슷하게')

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

    // 1) 확정 분배(수학, 보통 강도)를 먼저 만든다 — 항상 유효한 base
    const base = buildDistribution(start_date, total_amount, totalDays, pattern)

    let days: Day[] = base
    let aiComment: string | null = null
    let generatedBy: 'solar' | 'fallback' = 'fallback'
    let commentBy: 'solar' | 'fallback' = 'fallback'

    const solarKey = Deno.env.get('SOLAR_API_KEY')

    // 2) [분배 다듬기] Solar에게 base 초안을 보여주고 튀는 날만 보정하게 한다(숫자만).
    //    검증(패턴 방향·합계·가드) 통과 시 채택, 실패/거부 시 base(수학) 유지.
    if (solarKey && base.length > 0) {
      const draftLines = base.map((d) => `${d.date}: ${d.target_amount}${unit}`).join('\n')
      const adjustPrompt = `아래는 학습 계획 초안입니다. 목표·기간·하루 학습 가능 시간을 고려해 부자연스럽게 튀는 날만 자연스럽게 다듬어주세요.

목표: ${title}
기간: ${start_date} ~ ${end_date} (총 ${totalDays}일)
하루 학습 가능 시간: ${daily_minutes}분 (모든 날짜에 동일)
학습 단위: ${unit}
분배 방식: ${PATTERN_LABEL[pattern]}

계획 초안:
${draftLines}

규칙(반드시 지킬 것):
- 날짜와 개수는 초안과 동일하게 유지(같은 날짜 목록, ${base.length}개)
- target_amount의 합은 정확히 ${total_amount} (총량을 바꾸지 말 것)
- 정수만, 모든 날 1 이상
- 분배 방식의 방향을 유지(${directionText(pattern)})
- 크게 바꾸지 말고, 명백히 이상한 날만 소폭 조정. 이상 없으면 초안 그대로 반환

응답 형식(JSON만):
{"days":[{"date":"YYYY-MM-DD","target_amount":숫자}]}`

      const parsed = await solarChat(solarKey, adjustPrompt, 5000)
      const adjusted = parsed && isValidAdjustment(parsed.days, base, total_amount, pattern)
      if (adjusted) {
        days = parsed.days.map((d: any) => ({
          date: d.date, target_amount: d.target_amount, min_amount: minAmountOf(d.target_amount),
        }))
        generatedBy = 'solar'
      }
      console.log('generate-plan adjust:', {
        pattern, generatedBy,
        baseAmounts: base.map((d) => d.target_amount),
        finalAmounts: days.map((d) => d.target_amount),
      })
    }

    // 3) [코멘트] 최종 확정된 숫자(days)를 기준으로 Solar에게 코멘트를 별도 요청. 실패 시 1회 재시도.
    //    분배가 solar였든 수학이었든 무관하게, 코멘트 출처(commentBy)만 배지 기준이 된다.
    if (solarKey && days.length > 0) {
      const finalLines = days.map((d) => `${d.date}: ${d.target_amount}${unit}`).join('\n')
      const commentPrompt = `아래는 확정된 학습 계획입니다. 이 계획을 설명하고 격려하는 코멘트를 한 문장 작성해주세요.

목표: ${title}
기간: ${start_date} ~ ${end_date} (총 ${totalDays}일)
하루 학습 가능 시간: ${daily_minutes}분 (모든 날짜에 동일)
학습 단위: ${unit}
분배 방식: ${PATTERN_LABEL[pattern]}

확정 계획:
${finalLines}

규칙:
- 한국어 존댓말 한 문장(30~120자). 다정하고 담백하게.
- 실제 분배 숫자와 모순되지 않게. "밀렸다"·"실패" 같은 압박 표현과 이모지는 쓰지 않는다.
- 하루 학습 가능 시간은 모든 날짜에 동일하므로, 날짜마다 시간을 고려한 듯한 표현은 쓰지 않는다.

응답 형식(JSON만):
{"comment":"한 줄 코멘트"}`

      for (let attempt = 0; attempt < 2 && aiComment === null; attempt++) {
        const parsed = await solarChat(solarKey, commentPrompt, 4000)
        if (parsed && typeof parsed.comment === 'string' && parsed.comment.trim().length >= 10) {
          aiComment = parsed.comment.trim().slice(0, 200)
          commentBy = 'solar'
        }
      }
      console.log('generate-plan comment:', { commentBy, hasComment: aiComment !== null })
    }

    // 코멘트는 항상 존재해야 한다. Solar 코멘트를 못 받은 경우 패턴별 정적 문구(배지 숨김).
    if (aiComment === null) {
      aiComment = STATIC_COMMENT[pattern]
      commentBy = 'fallback'
    }

    console.log('generate-plan final result:', { generatedBy, commentBy, daysCount: days.length })

    const rows = days.map((d) => ({
      plan_id, user_id: user.id, date: d.date, target_amount: d.target_amount, min_amount: d.min_amount,
    }))

    // 재생성 시 UNIQUE(plan_id, date) 위반 방지: 기존 행을 먼저 삭제
    // (anon + 사용자 JWT 클라이언트이므로 RLS에 의해 본인 행만 삭제된다)
    const { error: deleteError } = await supabase
      .from('milrim_plan_days')
      .delete()
      .eq('plan_id', plan_id)
    if (deleteError) throw deleteError

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('milrim_plan_days').insert(rows)
      if (insertError) throw insertError
    }

    // 무엇으로 생성됐는지 기록 (실패해도 계획 생성 자체는 성공이므로 throw하지 않음
    // — 여기서 500을 내면 브라우저 fallback이 분배 결과를 지우고 재분배해버림)
    const { error: markError } = await supabase
      .from('milrim_plans')
      .update({ generated_by: generatedBy, ai_strategy: aiComment, ai_comment_by: commentBy, distribution_pattern: pattern })
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
