const KEY = 'milrim_timer_session'

export interface TimerSession {
  planId: string
  planDayId: string
  title?: string
  target?: number
  unit?: string
  dailyMinutes?: number
  /** 이전에 누적된 학습 초 (일시정지 시점까지) */
  elapsedBefore: number
  /** 현재 구간이 시작된 epoch ms. null이면 일시정지 상태 */
  startedAt: number | null
}

export function readTimerSession(): TimerSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as TimerSession
  } catch {
    return null
  }
}

export function writeTimerSession(session: TimerSession): void {
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function clearTimerSession(): void {
  localStorage.removeItem(KEY)
}

/** 새로고침·백그라운드 탭 스로틀링과 무관하게 항상 실제 경과 시간을 재계산 */
export function currentSeconds(session: TimerSession): number {
  if (session.startedAt == null) return session.elapsedBefore
  return session.elapsedBefore + Math.floor((Date.now() - session.startedAt) / 1000)
}
