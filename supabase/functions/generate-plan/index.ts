import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function fallbackDays(
  startDate: string, endDate: string, totalAmount: number
): { date: string; target_amount: number; min_amount: number }[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  const days = []
  let remaining = totalAmount

  for (let i = 0; i < totalDays; i++) {
    const daysLeft = totalDays - i
    const target = i === totalDays - 1 ? remaining : Math.ceil(remaining / daysLeft)
    const minAmount = Math.max(1, Math.ceil(target * 0.2))
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    days.push({ date: d.toISOString().split('T')[0], target_amount: target, min_amount: minAmount })
    remaining -= target
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

    const start = new Date(start_date)
    const end = new Date(end_date)
    const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1

    let days: { date: string; target_amount: number; min_amount: number }[]

    const solarKey = Deno.env.get('SOLAR_API_KEY')

    if (solarKey) {
      try {
        const res = await fetch('https://api.upstage.ai/v1/solar/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${solarKey}`,
            'Content-Type': 'application/json',
          },
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
            if (Array.isArray(parsed.days) && parsed.days.length === totalDays) {
              days = parsed.days
            }
          }
        }
      } catch (_) {
        // Solar 호출 실패 시 fallback
      }
    }

    // Solar 실패 또는 키 없을 때 수학적 분배로 fallback
    if (!days!) {
      days = fallbackDays(start_date, end_date, total_amount)
    }

    const rows = days.map((d) => ({
      plan_id,
      user_id: user.id,
      date: d.date,
      target_amount: d.target_amount,
      min_amount: d.min_amount,
    }))

    const { error: insertError } = await supabase
      .from('milrim_plan_days')
      .insert(rows)

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ success: true, days_count: rows.length }),
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
