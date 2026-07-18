import { addDaysStr, diffDays } from './date'

// ============================================================
// Solar 일일 코치 메시지 — 세그먼트 판정 + 폴백 문구
//
// 메시지 자체는 매일 자정(KST) Edge Function(milrim-coach)이 Solar로
// 16종을 일괄 생성해 milrim_daily_messages에 저장한다.
// 브라우저는 "내가 어떤 세그먼트인지"만 본인 데이터로 계산해서
// 해당 세그먼트의 메시지를 골라 보여준다. (사용자별 Solar 호출 없음)
// ============================================================

export const COACH_SEGMENTS = [
  'standard_high', 'standard_mid', 'standard_low', 'standard_min',
  'steady_high', 'steady_mid', 'steady_low', 'steady_min',
  'burst_high', 'burst_mid', 'burst_low', 'burst_min',
  'warmup', 'comeback', 'deadline', 'no_plan',
] as const

export type CoachSegment = (typeof COACH_SEGMENTS)[number]

export interface CoachDayRow {
  date: string
  target_amount: number
  actual_amount: number | null
  status: string
  study_seconds: number
}

export interface CoachPlanInfo {
  start_date: string
  end_date: string
  total_amount: number
  completedAmount: number
}

interface PickInput {
  today: string
  /** 최근 14일(오늘 미포함) 일별 계획 행 — 전체 플랜 합산 */
  recentDays: CoachDayRow[]
  /** 활성 플랜 목록 */
  plans: CoachPlanInfo[]
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

function tierOf(rate: number): 'high' | 'mid' | 'low' | 'min' {
  if (rate >= 0.7) return 'high'
  if (rate >= 0.5) return 'mid'
  if (rate >= 0.3) return 'low'
  return 'min'
}

export function pickCoachSegment({ today, recentDays, plans }: PickInput): CoachSegment {
  // 1. 활성 플랜 없음
  if (plans.length === 0) return 'no_plan'

  // 2. 워밍업 — 첫 플랜 시작 후 7일 미만
  const earliestStart = plans.map(p => p.start_date).sort()[0]
  if (diffDays(today, earliestStart) < 7) return 'warmup'

  // 날짜별 집계
  const byDate = new Map<string, { target: number; actual: number; studied: boolean }>()
  for (const r of recentDays) {
    const cur = byDate.get(r.date) ?? { target: 0, actual: 0, studied: false }
    cur.target += r.target_amount
    cur.actual += r.actual_amount ?? 0
    cur.studied = cur.studied || r.study_seconds > 0 || (r.actual_amount ?? 0) > 0 || r.status === 'complete'
    byDate.set(r.date, cur)
  }
  const scheduledDates = [...byDate.keys()].sort()
  const studiedDates = scheduledDates.filter(d => byDate.get(d)!.studied)

  // 3. 복귀 — 마지막 공부일로부터 3일 이상 공백
  const lastStudied = studiedDates[studiedDates.length - 1]
  const gap = lastStudied ? diffDays(today, lastStudied) : 999
  if (gap >= 3) return 'comeback'

  // 4. 마감 임박 — 어느 플랜이든 남은 하루 필요량이 처음 계획의 2배 이상
  for (const p of plans) {
    const remaining = Math.max(0, p.total_amount - p.completedAmount)
    const remainingDaysCount = diffDays(p.end_date, today) + 1
    if (remaining <= 0 || remainingDaysCount < 1) continue
    const planTotalDays = diffDays(p.end_date, p.start_date) + 1
    if (planTotalDays < 1) continue
    const originalDaily = p.total_amount / planTotalDays
    if (originalDaily > 0 && remaining / remainingDaysCount >= originalDaily * 2) return 'deadline'
  }

  // 5. 유형 × 어제 달성률 매트릭스
  if (scheduledDates.length === 0) return 'warmup'
  const attendance = studiedDates.length / scheduledDates.length
  const rateOf = (d: string) => {
    const v = byDate.get(d)!
    return v.target > 0 ? clamp01(v.actual / v.target) : 0
  }
  const avgRate = scheduledDates.reduce((s, d) => s + rateOf(d), 0) / scheduledDates.length
  const studiedRate = studiedDates.length > 0
    ? studiedDates.reduce((s, d) => s + rateOf(d), 0) / studiedDates.length
    : 0

  let type: 'standard' | 'steady' | 'burst' = 'standard'
  if (attendance >= 0.6 && avgRate < 0.7) type = 'steady'
  else if (attendance < 0.4 && studiedRate >= 0.7) type = 'burst'

  const yesterday = addDaysStr(today, -1)
  const y = byDate.get(yesterday)
  const yesterdayRate = y && y.target > 0 ? clamp01(y.actual / y.target) : avgRate

  return `${type}_${tierOf(yesterdayRate)}` as CoachSegment
}

/** 자정 배치 생성이 실패했거나 아직 안 돌았을 때 쓰는 기본 문구 */
export const COACH_FALLBACK: Record<CoachSegment, string> = {
  standard_high: '잘 하고 있어요! 어제의 몰입이 오늘의 나를 만들어요. 지치지 않게 페이스만 유지하면서, 오늘도 가볍게 이어가봐요. 밀림이 늘 함께할게요.',
  standard_mid: '절반을 넘겼다는 건 이미 방향이 맞다는 뜻이에요. 쉬어가도 돼요. 목표를 포기하지만 않으면, 제가 옆에서 계속 도와드릴게요.',
  standard_low: '살다 보면 지치는 날도 있죠. 필요하다면 오늘은 충분히 쉬어도 괜찮아요. 대신 포기하지만 말아요. 당신의 속도를 믿어요.',
  standard_min: '계획대로 안 되는 건 의지가 약해서가 아니에요. 저와 AI 재계획으로 더 잘 맞는 방법을 찾아볼까요?',
  steady_high: '매일 꾸준히 출석하다니 대단해요! 조금씩 공부량을 늘려볼까요?',
  steady_mid: '꾸준히 출석하는 것만으로도 이미 반은 성공한 거예요. 차근차근 목표를 향해 나아가고 있어요. 도움이 필요하면 언제든 AI 재계획을 이용할 수 있어요.',
  steady_low: '시작이 반이라고 하죠. 출석한 것만으로도 이미 반을 이룬 거예요. 필요하다면 쉬고, 다시 시작해도 괜찮아요.',
  steady_min: '오랜만에 출석해도 괜찮아요. 오늘은 5분이라도 충분해요. 조금씩 노력하다보면, 금방 원래의 흐름을 찾을 수 있을 거예요.',
  burst_high: '짧은 시간에 집중력을 발휘해 목표를 달성하는 모습이 멋져요. 다음에는 매일 집중력을 발휘하는 건 어떨까요? 어떤 방식이 자신에게 맞는지 알아보아요.',
  burst_mid: '가끔 오지만 올 때마다 확실하게 — 그것도 좋은 방법이에요. 다만 간격이 너무 벌어지면 감이 식으니, 짧게라도 들러줘요.',
  burst_low: '당신의 리듬대로 가도 돼요. 다만 오늘 5분만 앉아보면, 다음 몰입이 훨씬 쉬워져요. 완벽한 하루보다 잠깐의 연결이 중요해요.',
  burst_min: '쉬는 날이 있어도 괜찮아요. 돌아와서 몰아치는 힘이 당신에겐 있으니까요. 남은 양이 걱정되면 AI 재계획으로 다시 나눠봐요.',
  warmup: '시작했다는 것만으로 절반은 온 거예요. 처음 일주일은 잘하는 것보다 익숙해지는 게 목표예요. 부담 없이, 매일 조금씩만 만나요.',
  comeback: '다시 와줘서 고마워요. 쉬어간 날들도 다 과정이에요. 잃은 건 없어요 — 쌓아둔 건 그대로니까요. 오늘은 가볍게 5분부터 시작해봐요.',
  deadline: '목표일이 가까워졌네요. 압박감이 들 땐 AI 재계획으로 남은 양을 현실적으로 다시 나눠봐요. 지금 시작해도 충분히 끝낼 수 있어요. 제가 도울게요.',
  no_plan: '밀림에 온 걸 환영해요! 목표를 하나 만들어보세요. AI가 계획을 대신 짜드리고, 밀려도 다시 정리해드려요. 작은 공부가 쌓여 숲이 됩니다.',
}
