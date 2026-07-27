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
  return distributeOverDates(datesBetween(startDate, endDate), totalAmount)
}

/** startDate~endDate의 모든 날짜를 순서대로 반환한다. */
export function datesBetween(startDate: string, endDate: string): string[] {
  const totalDays = Math.round(
    (new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000
  ) + 1
  if (totalDays <= 0) return []
  const out: string[] = []
  for (let i = 0; i < totalDays; i++) out.push(addDaysStr(startDate, i))
  return out
}

/**
 * 주어진 날짜 목록에 totalAmount를 균등 분배한다.
 * 연속되지 않은 날짜 목록도 받는다 — 이미 기록이 있는 날을 건너뛰고
 * 남은 날짜에만 재배분할 때 쓴다.
 */
export function distributeOverDates(dates: string[], totalAmount: number): DayAlloc[] {
  const n = dates.length
  if (n <= 0 || totalAmount <= 0) return []

  const base = Math.floor(totalAmount / n)
  const extra = totalAmount % n

  // 나머지(+1)를 한 칸씩 걸러 배치한다 — 예) 80을 6일에 → 13·14·13·14·13·13.
  // Edge Function(generate-plan)의 evenAmounts와 같은 모양이 되도록 맞춘 것.
  const bump = new Array(n).fill(0)
  const slots: number[] = []
  for (let i = 1; i < n && slots.length < extra; i += 2) slots.push(i)
  for (let i = 2; i < n && slots.length < extra; i += 2) slots.push(i)
  for (const i of slots) bump[i] = 1

  const days: DayAlloc[] = []
  for (let i = 0; i < n; i++) {
    const target = base + bump[i]
    if (target <= 0) continue // 학습량 < 일수: 배정 없는 날은 생략(휴식일)
    days.push({
      date: dates[i],
      target_amount: target,
      min_amount: Math.max(1, Math.ceil(target * 0.2)),
    })
  }
  return days
}
