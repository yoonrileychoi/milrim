/** 로컬 타임존 기준 YYYY-MM-DD 문자열 */
export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 로컬 기준 오늘 날짜 문자열 */
export function todayStr(): string {
  return toDateStr(new Date())
}

/** YYYY-MM-DD 문자열에 n일을 더한 YYYY-MM-DD (로컬 기준) */
export function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00') // 'T00:00:00'을 붙여야 로컬 파싱됨
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

/** 두 YYYY-MM-DD 사이의 일수 차이 (a - b, 로컬 기준) */
export function diffDays(a: string, b: string): number {
  return Math.round(
    (new Date(a + 'T00:00:00').getTime() - new Date(b + 'T00:00:00').getTime()) / 86400000
  )
}

/**
 * 시작일~종료일이 며칠짜리인지 (양쪽 날짜 모두 포함).
 * 예: 8/2~8/8 → 7일. 계획 생성 화면과 계획 상세 화면이 같은 값을 쓰도록 여기 둔다.
 */
export function dayCountInclusive(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0
  return Math.max(0, diffDays(endDate, startDate) + 1)
}
