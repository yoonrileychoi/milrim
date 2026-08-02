import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { todayStr, addDaysStr, toDateStr } from '../lib/date'

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  return hours > 0
    ? `${hours}시간 ${mins > 0 ? mins + '분 ' : ''}${secs}초`
    : mins > 0
      ? `${mins}분 ${secs}초`
      : `${secs}초`
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function heatLevel(seconds: number): number {
  const mins = seconds / 60
  if (mins <= 0) return 0
  if (mins < 15) return 1
  if (mins < 30) return 2
  if (mins < 60) return 3
  return 4
}

const HEAT_COLORS = ['#ECE7DA', '#CDE3B0', '#9CC36B', '#5F9A47', '#2E5A3A']

export default function StatsPage() {
  const { user } = useAuth()
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [studyDays, setStudyDays] = useState(0)
  const [replanCount, setReplanCount] = useState(0)
  const [secondsByDate, setSecondsByDate] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [earliestPlanMonth, setEarliestPlanMonth] = useState<{ year: number; month: number } | null>(null)
  const [viewYear, setViewYear] = useState(() => Number(todayStr().slice(0, 4)))
  const [viewMonth, setViewMonth] = useState(() => Number(todayStr().slice(5, 7)) - 1)
  const [showYearLimitModal, setShowYearLimitModal] = useState(false)

  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      const today = todayStr()
      const todayStart = `${today}T00:00:00`
      const tomorrowStart = `${addDaysStr(today, 1)}T00:00:00`

      // 관리자 계정은 RLS 정책상 남의 데이터도 조회될 수 있으므로 본인 것만 명시 필터
      const [{ data: sessions }, { data: todaySessions }, { data: completedDays }, { data: plans }] = await Promise.all([
        supabase.from('milrim_study_sessions').select('duration_seconds, started_at').eq('user_id', user.id),
        supabase.from('milrim_study_sessions').select('duration_seconds').eq('user_id', user.id).gte('started_at', todayStart).lt('started_at', tomorrowStart),
        supabase.from('milrim_plan_days').select('date').eq('user_id', user.id).eq('status', 'complete'),
        supabase.from('milrim_plans').select('id, title, unit, total_amount, replan_count, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      setTotalSeconds(sessions?.reduce((s, r) => s + (r.duration_seconds ?? 0), 0) ?? 0)
      setTodaySeconds(todaySessions?.reduce((s, r) => s + (r.duration_seconds ?? 0), 0) ?? 0)
      // 고유 날짜 수 — 같은 날 여러 플랜 완료 시 1일로 계산
      setStudyDays(new Set((completedDays ?? []).map(d => d.date)).size)
      setReplanCount(plans?.reduce((s, p) => s + (p.replan_count ?? 0), 0) ?? 0)

      const byDate = new Map<string, number>()
      for (const s of sessions ?? []) {
        const d = toDateStr(new Date(s.started_at))
        byDate.set(d, (byDate.get(d) ?? 0) + (s.duration_seconds ?? 0))
      }
      setSecondsByDate(byDate)

      // 월별 학습 기록 조회의 시작점 — 사용자가 처음 학습 계획을 만든 달
      const earliestCreatedAt = (plans ?? []).reduce<string | null>(
        (min, p) => (!min || p.created_at < min) ? p.created_at : min, null,
      )
      if (earliestCreatedAt) {
        const d = new Date(earliestCreatedAt)
        setEarliestPlanMonth({ year: d.getFullYear(), month: d.getMonth() })
      }

      setLoading(false)
    }
    fetchStats()
  }, [user?.id])

  const today = todayStr()
  const now = new Date(today + 'T00:00:00')
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed

  const currentMonthIdx = currentYear * 12 + currentMonth
  const viewMonthIdx = viewYear * 12 + viewMonth
  const oneYearAgoIdx = currentMonthIdx - 12
  const earliestPlanIdx = earliestPlanMonth ? earliestPlanMonth.year * 12 + earliestPlanMonth.month : currentMonthIdx
  // 두 하한 중 더 최근(=더 제약이 큰) 쪽이 실제로 조회 가능한 가장 이른 달이 된다.
  const yearCapBinding = oneYearAgoIdx >= earliestPlanIdx
  const effectiveEarliestIdx = Math.max(earliestPlanIdx, oneYearAgoIdx)
  const prevDisabled = !yearCapBinding && viewMonthIdx <= effectiveEarliestIdx
  const nextDisabled = viewMonthIdx >= currentMonthIdx

  const goPrevMonth = () => {
    const prevIdx = viewMonthIdx - 1
    if (prevIdx < effectiveEarliestIdx) {
      if (yearCapBinding) setShowYearLimitModal(true)
      return
    }
    setViewYear(Math.floor(prevIdx / 12))
    setViewMonth(((prevIdx % 12) + 12) % 12)
  }
  const goNextMonth = () => {
    if (nextDisabled) return
    const nextIdx = viewMonthIdx + 1
    setViewYear(Math.floor(nextIdx / 12))
    setViewMonth(((nextIdx % 12) + 12) % 12)
  }

  const isCurrentViewedMonth = viewYear === currentYear && viewMonth === currentMonth
  const monthTitle = isCurrentViewedMonth
    ? '이번달 학습 기록'
    : viewYear === currentYear
      ? `${viewMonth + 1}월 학습 기록`
      : `${viewYear}년 ${viewMonth + 1}월 학습 기록`

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
  const monthCells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`),
  ]

  const last7 = Array.from({ length: 7 }, (_, i) => addDaysStr(today, i - 6))
  const weeklyMinutes = last7.map(d => Math.round((secondsByDate.get(d) ?? 0) / 60))
  const maxWeeklyMinutes = Math.max(1, ...weeklyMinutes)

  return (
    <Layout title="나의 학습 통계">
      <div className="fade-in">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E2DCCB', borderTopColor: '#2E5A3A', animation: 'dspin 0.9s linear infinite' }} />
          </div>
        ) : (
          <>
            <div className="stats-summary-grid">
              <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px', display: 'flex' }}>
                <div style={{ flex: 3, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#9a9482', whiteSpace: 'nowrap' }}>전체 누적 학습<span className="stats-label-suffix"> 시간</span></div>
                  <div style={{ fontSize: 16.2, fontWeight: 800, color: '#2B2A26', marginTop: 7, lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                    {totalSeconds === 0 ? <span style={{ fontSize: 11.7 }}>아직 없어요</span> : formatDuration(totalSeconds)}
                  </div>
                </div>
                <div style={{ width: 1, background: '#ECE7DA', margin: '0 14px' }} />
                <div style={{ flex: 2, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#9a9482', whiteSpace: 'nowrap' }}>오늘 누적 학습<span className="stats-label-suffix"> 시간</span></div>
                  <div style={{ fontSize: 16.2, fontWeight: 800, color: '#2B2A26', marginTop: 7, lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                    {todaySeconds === 0 ? <span style={{ fontSize: 11.7 }}>아직 없어요</span> : formatDuration(todaySeconds)}
                  </div>
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px' }}>
                <div style={{ fontSize: 13, color: '#9a9482' }}>계획 달성</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#2B2A26', marginTop: 7 }}>
                  <span style={{ fontSize: 14 }}>총 </span>{studyDays}<span style={{ fontSize: 14 }}> 일</span>
                </div>
              </div>
            </div>

            {/* 밀려도 다시 이어간 횟수 + 격려 카드 — "얼마나 꾸준히 해왔나"를 보여주는 핵심 지표라
                주간 차트보다 먼저 보이게 배치(사용자 요청, 2026-08-02) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 16 }}>
              <div className="stats-replan-card" style={{
                background: 'linear-gradient(150deg, #2E5A3A 0%, #3C6B45 100%)',
                borderRadius: 22, color: '#fff',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center',
              }}>
                <div className="stats-replan-label" style={{ opacity: 0.85, fontWeight: 500 }}>밀려도 다시 이어간 횟수</div>
                <div className="stats-replan-number" style={{ fontWeight: 800, lineHeight: 1 }}>
                  {replanCount}<span className="stats-replan-unit">회</span>
                </div>
                <div className="stats-replan-sub" style={{ color: '#C2E098', fontWeight: 600 }}>
                  {replanCount === 0 ? '아직 재계획이 없어요' : '한 번도 완전히 멈추지 않았어요'}
                </div>
              </div>
              <div className="stats-encourage-card" style={{ background: '#F0F5E6', borderRadius: 22, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <span className="ms stats-encourage-icon" style={{ color: '#2E5A3A' }}>eco</span>
                <div className="stats-encourage-text" style={{ color: '#3E5C42', lineHeight: 1.5, fontWeight: 700 }}>
                  속도가 느려도, 꾸준히 옳은 방향으로 간다면 목표를 이룰 수 있을 거예요.
                </div>
              </div>
            </div>

            {/* 주간 막대차트 */}
            <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px', marginTop: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 18 }}>최근 7일 학습 기록</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 110 }}>
                {last7.map((d, i) => {
                  const mins = weeklyMinutes[i]
                  const isToday = d === today
                  const barHeight = Math.max(4, Math.round((mins / maxWeeklyMinutes) * 84))
                  const wd = new Date(d + 'T00:00:00').getDay()
                  return (
                    <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 10.5, color: '#9a9482', fontWeight: 700, minHeight: 13 }}>
                        {mins > 0 ? mins : ''}
                      </div>
                      <div style={{
                        width: '100%', maxWidth: 28, height: barHeight, borderRadius: 7,
                        background: isToday ? '#2E5A3A' : mins > 0 ? '#9CC36B' : '#F0EADC',
                      }} title={`${d} · ${mins}분`} />
                      <div style={{ fontSize: 11, color: isToday ? '#2E5A3A' : '#b3ad9d', fontWeight: isToday ? 800 : 500 }}>
                        {WEEKDAY_LABELS[wd]}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 월간 잔디 히트맵 — 폭은 다른 카드들과 동일하게 전체 폭 사용(사용자 요청, 2026-08-02) */}
            <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px', marginTop: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26' }}>{monthTitle}</div>
              {/* 월 이동 — 처음 계획을 만든 달까지, 최대 1년 전까지만 조회 가능 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8, marginBottom: 10 }}>
                <button
                  onClick={goPrevMonth}
                  disabled={prevDisabled}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 30, height: 30, borderRadius: 10, border: '1px solid #ECE7DA',
                    background: '#fff', cursor: prevDisabled ? 'not-allowed' : 'pointer',
                    opacity: prevDisabled ? 0.4 : 1, color: '#6B6757',
                  }}
                >
                  <span className="ms" style={{ fontSize: 18 }}>chevron_left</span>
                </button>
                <button
                  onClick={goNextMonth}
                  disabled={nextDisabled}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 30, height: 30, borderRadius: 10, border: '1px solid #ECE7DA',
                    background: '#fff', cursor: nextDisabled ? 'not-allowed' : 'pointer',
                    opacity: nextDisabled ? 0.4 : 1, color: '#6B6757',
                  }}
                >
                  <span className="ms" style={{ fontSize: 18 }}>chevron_right</span>
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
                {WEEKDAY_LABELS.map(w => (
                  <div key={w} style={{ fontSize: 10, color: '#b3ad9d', textAlign: 'center', fontWeight: 600 }}>{w}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {monthCells.map((d, i) => {
                  if (!d) return <div key={`empty-${i}`} />
                  const seconds = secondsByDate.get(d) ?? 0
                  const level = heatLevel(seconds)
                  const dayNum = Number(d.slice(-2))
                  const isFuture = d > today
                  return (
                    <div
                      key={d}
                      title={`${dayNum}일 · ${formatDuration(seconds)}`}
                      style={{
                        aspectRatio: '1', borderRadius: 6,
                        background: isFuture ? '#F7F4EC' : HEAT_COLORS[level],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontSize: 9, color: level >= 3 ? 'rgba(255,255,255,0.75)' : '#b3ad9d', fontWeight: 600 }}>{dayNum}</span>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginTop: 14 }}>
                <span style={{ fontSize: 10, color: '#b3ad9d', marginRight: 3 }}>적음</span>
                {HEAT_COLORS.map(c => (
                  <div key={c} style={{ width: 11, height: 11, borderRadius: 3, background: c }} />
                ))}
                <span style={{ fontSize: 10, color: '#b3ad9d', marginLeft: 3 }}>많음</span>
              </div>
            </div>

            {showYearLimitModal && (
              <div
                onClick={() => setShowYearLimitModal(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(43,42,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}
              >
                <div onClick={e => e.stopPropagation()} className="pop-in" style={{ width: '100%', maxWidth: 320, background: '#fff', borderRadius: 22, padding: '26px 24px 22px' }}>
                  <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#F0F5E6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E5A3A', margin: '0 auto 16px' }}>
                    <span className="ms" style={{ fontSize: 28 }}>info</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#2B2A26', textAlign: 'center' }}>최대 1년까지만 조회 가능합니다</div>
                  <button
                    onClick={() => setShowYearLimitModal(false)}
                    style={{ width: '100%', marginTop: 20, border: 'none', background: '#2E5A3A', color: '#fff', fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 14, fontFamily: 'var(--font)', cursor: 'pointer' }}
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
