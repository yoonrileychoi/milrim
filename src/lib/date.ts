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
