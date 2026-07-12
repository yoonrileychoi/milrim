import { addDaysStr } from './date'

export interface DayAlloc {
  date: string
  target_amount: number
  min_amount: number
}

/**
 * startDate~endDate에 totalAmount를 균등 분배한다.
 * - base + extra 방식: 합계가 정확히 totalAmount
 * - totalAmount < 일수인 경우: 앞에서부터 1씩 배정하고, 배정량이 0인 날은
 *   행을 생성하지 않는다 (DB CHECK target_amount > 0 위반 방지).
 */
export function distributeDays(startDate: string, endDate: string, totalAmount: number): DayAlloc[] {
  const totalDays = Math.round(
    (new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000
  ) + 1
  if (totalDays <= 0 || totalAmount <= 0) return []

  const base = Math.floor(totalAmount / totalDays)
  const extra = totalAmount % totalDays
  const days: DayAlloc[] = []
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
