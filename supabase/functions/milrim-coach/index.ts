import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================
// milrim-coach — 일일 코치 메시지 배치 생성
//
// 매일 KST 00:00(UTC 15:00)에 pg_cron이 호출한다. 사용자는 호출할 수 없다
// (x-cron-secret 헤더가 CRON_SECRET 환경변수와 일치해야 함).
// Solar 호출 1회로 세그먼트 16종의 메시지를 JSON으로 일괄 생성해
// milrim_daily_messages에 저장한다. 사용자 수와 무관하게 하루 1회 호출.
//
// Solar 생성에 실패한 세그먼트는 저장하지 않는다 — 클라이언트가
// 코드에 내장된 기본 문구로 폴백하며, 그 경우 "AI 메이트" 배지를
// 붙이지 않으므로 표기와 구현이 일치한다.
//
// 배포: supabase functions deploy milrim-coach --no-verify-jwt
// (JWT 검증 대신 CRON_SECRET으로 보호)
// ============================================================

const SEGMENTS = [
  'standard_high', 'standard_mid', 'standard_low', 'standard_min',
  'steady_high', 'steady_mid', 'steady_low', 'steady_min',
  'burst_high', 'burst_mid', 'burst_low', 'burst_min',
  'warmup', 'comeback', 'deadline', 'no_plan',
] as const

const SEGMENT_GUIDE = `
[사용자 유형]
- standard: 표준 학습자
- steady: 매일 꾸준히 오지만 하루 목표는 다 못 채우는 학습자 — 출석 자체를 크게 칭찬할 것. 달성률이 낮아도 절대 위로조로 깎아내리지 말 것
- burst: 가끔 오지만 올 때마다 확실히 해내는 학습자 — 몰아서 하는 리듬도 존중하고, 짧게라도 자주 들르면 좋다는 정도만 부드럽게

[어제 달성률 구간 — 유형 뒤에 붙음]
- high: 70% 이상 → "잘 하고 있어요, 지치지 말고 계속" 류
- mid: 50~70% → "쉬어가도 돼요, 포기하지만 않으면 제가 도울게요" 류
- low: 30~50% → "지치는 날도 있죠, 필요하다면 오늘은 충분히 쉬어도 괜찮아요. 대신 포기하지 말아요" 류
- min: 0~30% → 예시: "계획대로 안 되는 건 의지가 약해서가 아니에요. 저와 AI 재계획으로 더 잘 맞는 방법을 찾아볼까요?"

[특수 세그먼트]
- warmup: 계획을 시작한 지 일주일이 안 된 학습자 — 시작을 축하하고, 익숙해지는 게 목표라고
- comeback: 3일 이상 쉬다가 돌아온 학습자 — 돌아온 것 자체를 환영. 쉰 것을 절대 나무라지 말 것
- deadline: 목표일이 임박해 남은 양이 많은 학습자 — "부담"·"압박" 같은 단어를 직접 언급하지
  말 것(그 단어를 꺼내는 순간 오히려 부담을 상기시킨다). 그런 단어 없이 그냥 담백하게
  다음 행동(예: AI 재계획으로 나누기)만 제안할 것
- no_plan: 아직 학습 계획이 없는 사용자 — 서비스를 소개하며 첫 목표 생성을 권유

[승인된 예시 — 이 톤과 문체를 참고할 것 (그대로 베끼지 말고, 매일 다르게 변주)]
- standard_min: "계획대로 안 되는 건 의지가 약해서가 아니에요. 저와 AI 재계획으로 더 잘 맞는 방법을 찾아볼까요?"
- steady_high: "매일 꾸준히 출석하다니 대단해요. 조금씩 공부량을 늘려볼까요?"
- steady_mid: "꾸준히 출석하는 것만으로도 이미 반은 성공한 거예요. 차근차근 목표를 향해 나아가고 있어요. 도움이 필요하면 언제든 AI 재계획을 이용할 수 있어요."
- steady_low: "시작이 반이라고 하죠. 출석한 것만으로도 이미 반을 이룬 거예요. 필요하다면 쉬고, 다시 시작해도 괜찮아요."
- steady_min: "오랜만에 출석해도 괜찮아요. 오늘은 5분이라도 충분해요. 조금씩 노력하다보면, 금방 원래의 흐름을 찾을 수 있을 거예요."
- burst_high: "짧은 시간에 집중력을 발휘해 목표를 달성하는 모습이 멋져요. 다음에는 매일 집중력을 발휘하는 건 어떨까요? 어떤 방식이 자신에게 맞는지 알아보아요."

[절대 금지 표현 — 매우 중요]
- "내일부터 다시 시작해요", "내일부터 다시 힘을 내요" 및 이와 같은 뜻의 표현을 절대 쓰지 말 것.
  이 서비스는 "미뤄도 괜찮다"는 철학이지만, 그렇다고 "오늘은 미루고 내일부터 하라"고 대놓고
  권하면 안 된다. 쉬는 것을 말할 땐 반드시 아래처럼 "오늘 쉬어도 된다"는 방향으로 돌려 말할 것:
  "필요하다면 휴식을 취해요", "필요하다면 쉬어도 괜찮아요", "휴식이 필요한 날에는 휴식을
  하는 것도 좋아요" 같은 톤.
- 번역체(영어를 그대로 옮긴 듯 어색한 문장), 냉정하고 사무적인 어조, 사용자를 재촉·압박하는
  뉘앙스를 피할 것. 자연스러운 한국어 구어체, 다정하지만 담백한 존댓말로 쓸 것.
- "열공", "화이팅" 같이 철 지난 유행어·신조어를 쓰지 말 것. 시간이 지나도 안 어색할 평범하고
  담백한 표현을 쓸 것.
- 느낌표(!)를 쓰지 말 것. 밝고 들뜬 활발한 톤이 아니라, 차분하고 담백한 톤을 유지할 것.`

function kstTodayStr(): string {
  const kst = new Date(Date.now() + 9 * 3600 * 1000)
  return kst.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  try {
    const cronSecret = Deno.env.get('CRON_SECRET')
    if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const today = kstTodayStr()

    // 이미 오늘 치가 전부 있으면 스킵 (중복 실행 안전)
    const { data: existing, error: existingError } = await admin
      .from('milrim_daily_messages')
      .select('segment')
      .eq('date', today)
    if (existingError) throw existingError
    const existingSegments = new Set((existing ?? []).map((r) => r.segment))
    const missing = SEGMENTS.filter((s) => !existingSegments.has(s))
    if (missing.length === 0) {
      return new Response(JSON.stringify({ success: true, inserted: 0, skipped: 'already_generated' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const solarKey = Deno.env.get('SOLAR_API_KEY')
    if (!solarKey) {
      return new Response(JSON.stringify({ error: 'SOLAR_API_KEY not set' }), { status: 500 })
    }

    const prompt = `당신은 학습 플래너 "밀림"의 AI 도우미입니다. 밀림의 철학: 공부가 밀리는 것은
실패가 아니라 학습 과정의 일부다. 실수해도, 미뤄도, 하루 쉬어도 괜찮다. 대신 목표를 끝까지
포기하지만 말아 달라. 매일 조금씩 하면 목표를 이룰 수 있다. 작은 공부가 쌓여 숲을 이룬다.

오늘 하루 동안 홈 화면에 보여줄 격려 메시지를 아래 16개 세그먼트별로 1개씩 작성하세요.
${SEGMENT_GUIDE}

작성 규칙:
- 각 메시지는 한국어 존댓말, 30~100자 (위 [승인된 예시]들의 길이를 참고 — 길게 늘어뜨리지 말 것)
- 절대 사용자를 비난·압박·닥달하지 않는다. "밀렸다", "실패" 같은 단어를 쓰지 않는다
- "내일부터 다시 시작해요/힘을 내요" 류 표현 절대 금지 — [절대 금지 표현] 항목 반드시 준수
- 번역체·사무적 어조 금지 — 자연스러운 한국어 구어체로
- 필요하면 "AI 재계획" 기능을 자연스럽게 언급해도 된다 (특히 min, deadline)
- 매일 새로 생성되므로 상투적이지 않게, 세그먼트마다 결이 다르게
- 응답은 아래 JSON 형식만 출력 (설명·마크다운 금지)

{"standard_high":"...","standard_mid":"...","standard_low":"...","standard_min":"...","steady_high":"...","steady_mid":"...","steady_low":"...","steady_min":"...","burst_high":"...","burst_mid":"...","burst_low":"...","burst_min":"...","warmup":"...","comeback":"...","deadline":"...","no_plan":"..."}`

    let parsed: Record<string, unknown> | null = null

    for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 25000)
      try {
        const res = await fetch('https://api.upstage.ai/v1/solar/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${solarKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'solar-mini',
            messages: [
              { role: 'system', content: '요청한 JSON 형식으로만 응답합니다. 설명 없이 JSON만 출력하세요.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
          }),
        })
        if (res.ok) {
          const json = await res.json()
          const content = json.choices?.[0]?.message?.content ?? ''
          const match = content.match(/\{[\s\S]*\}/)
          if (match) {
            try { parsed = JSON.parse(match[0]) } catch (_) { /* 재시도 */ }
          }
        }
      } catch (_) {
        // 타임아웃/네트워크 오류 — 재시도
      } finally {
        clearTimeout(timeout)
      }
    }

    if (!parsed) {
      return new Response(JSON.stringify({ error: 'Solar generation failed', inserted: 0 }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      })
    }

    // 유효한 세그먼트만 저장 (실패분은 클라이언트 기본 문구로 폴백됨)
    const rows = missing
      .map((segment) => {
        const msg = parsed![segment]
        if (typeof msg !== 'string') return null
        const trimmed = msg.trim()
        if (trimmed.length < 20) return null
        return { date: today, segment, message: trimmed.slice(0, 200) }
      })
      .filter((r): r is { date: string; segment: string; message: string } => r !== null)

    if (rows.length > 0) {
      const { error: insertError } = await admin
        .from('milrim_daily_messages')
        .upsert(rows, { onConflict: 'date,segment' })
      if (insertError) throw insertError
    }

    return new Response(
      JSON.stringify({ success: true, date: today, inserted: rows.length, missing_after: missing.length - rows.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
