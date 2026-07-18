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

const dispUnit = (unit: string) => unit === '강의' ? '강' : unit

interface PlanProgress {
  id: string
  title: string
  unit: string
  total_amount: number
  completedAmount: number
  progress: number
}

export default function StatsPage() {
  const { user } = useAuth()
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [studyDays, setStudyDays] = useState(0)
  const [replanCount, setReplanCount] = useState(0)
  const [secondsByDate, setSecondsByDate] = useState<Map<string, number>>(new Map())
  const [planProgress, setPlanProgress] = useState<PlanProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      const today = todayStr()
      const todayStart = `${today}T00:00:00`
      const tomorrowStart = `${addDaysStr(today, 1)}T00:00:00`

      // 관리자 계정은 RLS 정책상 남의 데이터도 조회될 수 있으므로 본인 것만 명시 필터
      const [{ data: sessions }, { data: todaySessions }, { data: completedDays }, { data: plans }, { data: planDays }] = await Promise.all([
        supabase.from('milrim_study_sessions').select('duration_seconds, started_at').eq('user_id', user.id),
        supabase.from('milrim_study_sessions').select('duration_seconds').eq('user_id', user.id).gte('started_at', todayStart).lt('started_at', tomorrowStart),
        supabase.from('milrim_plan_days').select('date').eq('user_id', user.id).eq('status', 'complete'),
        supabase.from('milrim_plans').select('id, title, unit, total_amount, replan_count').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('milrim_plan_days').select('plan_id, actual_amount, status').eq('user_id', user.id),
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

      const progress: PlanProgress[] = (plans ?? []).map(p => {
        const doneDays = (planDays ?? []).filter(d => d.plan_id === p.id && d.status === 'complete')
        const completedAmount = doneDays.reduce((sum, d) => sum + (d.actual_amount ?? 0), 0)
        const pct = p.total_amount > 0 ? Math.round((completedAmount / p.total_amount) * 100) : 0
        return { id: p.id, title: p.title, unit: p.unit, total_amount: p.total_amount, completedAmount, progress: Math.min(pct, 100) }
      })
      setPlanProgress(progress)

      setLoading(false)
    }
    fetchStats()
  }, [user?.id])

  const today = todayStr()
  const now = new Date(today + 'T00:00:00')
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = new Date(year, month, 1).getDay()
  const monthCells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`),
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px', display: 'flex' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#9a9482' }}>전체 누적 학습 시간</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#2B2A26', marginTop: 7, lineHeight: 1.3 }}>
                    {totalSeconds === 0 ? <span style={{ fontSize: 13 }}>아직 없어요</span> : formatDuration(totalSeconds)}
                  </div>
                </div>
                <div style={{ width: 1, background: '#ECE7DA', margin: '0 14px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#9a9482' }}>오늘 누적 학습 시간</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#2B2A26', marginTop: 7, lineHeight: 1.3 }}>
                    {todaySeconds === 0 ? <span style={{ fontSize: 13 }}>아직 없어요</span> : formatDuration(todaySeconds)}
                  </div>
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px' }}>
                <div style={{ fontSize: 13, color: '#9a9482' }}>누적 공부일</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#2B2A26', marginTop: 7 }}>
                  {studyDays}<span style={{ fontSize: 14 }}>일</span>
                </div>
              </div>
            </div>

            {/* 주간 막대차트 */}
            <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px', marginTop: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 18 }}>최근 7일 학습 시간</div>
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

            {/* 월간 잔디 히트맵 */}
            <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px', marginTop: 16 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 18 }}>{month + 1}월 학습 기록</div>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 16 }}>
              <div style={{
                background: 'linear-gradient(150deg, #2E5A3A 0%, #3C6B45 100%)',
                borderRadius: 22, padding: 30, color: '#fff',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center',
              }}>
                <div style={{ fontSize: 14, opacity: 0.85, fontWeight: 500 }}>밀려도 다시 이어간 횟수</div>
                <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1, margin: '12px 0 6px' }}>
                  {replanCount}<span style={{ fontSize: 24 }}>회</span>
                </div>
                <div style={{ fontSize: 13.5, color: '#C2E098', fontWeight: 600 }}>
                  {replanCount === 0 ? '아직 재계획이 없어요' : '한 번도 완전히 멈추지 않았어요'}
                </div>
              </div>
              <div style={{ background: '#F0F5E6', borderRadius: 22, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 18, minHeight: 200 }}>
                <span className="ms" style={{ fontSize: 40, color: '#2E5A3A' }}>eco</span>
                <div style={{ fontSize: 22, color: '#3E5C42', lineHeight: 1.5, fontWeight: 700 }}>
                  속도가 느려도, 꾸준히 옳은 방향으로 간다면 목표를 이룰 수 있을 거예요.
                </div>
              </div>
            </div>

            {/* 목표별 진행률 */}
            {planProgress.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px', marginTop: 16 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 18 }}>목표별 진행률</div>
                {/* 4개 높이까지만 보이고 나머지는 스크롤 (항목 1개 ≈ 진행바 포함 48px + gap 16px) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 250, overflowY: 'auto', paddingRight: planProgress.length > 4 ? 10 : 0 }}>
                  {planProgress.map(p => (
                    <div key={p.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2B2A26' }}>{p.title}</div>
                        <div style={{ fontSize: 11.5, color: '#9a9482' }}>
                          {p.completedAmount}/{p.total_amount}{dispUnit(p.unit)} · <span style={{ fontWeight: 700, color: '#2E5A3A' }}>{p.progress}%</span>
                        </div>
                      </div>
                      <div style={{ height: 9, borderRadius: 6, background: '#F0EADC', overflow: 'hidden' }}>
                        <div style={{ width: `${p.progress}%`, height: '100%', borderRadius: 6, background: '#2E5A3A', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
