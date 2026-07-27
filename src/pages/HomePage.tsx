import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { todayStr, addDaysStr, diffDays } from '../lib/date'
import { pickCoachSegment, COACH_FALLBACK, type CoachDayRow } from '../lib/coach'

interface Plan {
  id: string
  title: string
  unit: string
  total_amount: number
  replan_count: number
  daily_minutes: number
  start_date: string
  end_date: string
}

interface PlanDay {
  id: string
  plan_id: string
  date: string
  target_amount: number
  min_amount: number
  status: 'pending' | 'complete' | 'incomplete'
  actual_amount: number | null
  study_seconds: number
}

interface GoalCard extends Plan {
  todayDay: PlanDay | null
  completedDays: number
  completedAmount: number
  progress: number
  overdueDays: number
}

function CircleProgress({ pct, size = 84 }: { pct: number; size?: number }) {
  const r = size * 0.405
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct, 100) / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={9} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#C2E098" strokeWidth={9}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 21, fontWeight: 800 }}>{Math.min(pct, 100)}<span style={{ fontSize: 11 }}>%</span></div>
      </div>
    </div>
  )
}

const dispUnit = (unit: string) => unit === '강의' ? '강' : unit

const CARD_COLORS = [
  ['#2E5A3A', '#3C6B45'],
  ['#3A4F2C', '#4E6B3A'],
  ['#2B4A36', '#3A5F42'],
  ['#1E4030', '#2E5A3A'],
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user, nickname } = useAuth()
  const displayName = nickname || user?.user_metadata?.name || user?.user_metadata?.full_name || '사용자'

  const [goals, setGoals] = useState<GoalCard[]>([])
  const [loading, setLoading] = useState(true)
  const [studyDayCount, setStudyDayCount] = useState(0)
  const [coachMessage, setCoachMessage] = useState('')
  const [coachIsAi, setCoachIsAi] = useState(false)
  const [showComeback, setShowComeback] = useState(false)
  const today = todayStr()

  // 복귀 환영 토스트 — 3일 이상 공백 후 첫 방문
  useEffect(() => {
    if (!user) return
    const key = `milrim_last_visit_${user.id}`
    const prev = localStorage.getItem(key)
    localStorage.setItem(key, today)
    if (prev && diffDays(today, prev) >= 3) setShowComeback(true)
  }, [user, today])

  // 토스트 자동 닫기 — 위 effect에 두면 user 객체가 갱신될 때 cleanup이 타이머를 지워버려
  // (재실행 시엔 이미 오늘 날짜가 저장돼 있어 새 타이머도 안 걸린다) 토스트가 영영 남는다.
  useEffect(() => {
    if (!showComeback) return
    const t = setTimeout(() => setShowComeback(false), 6000)
    return () => clearTimeout(t)
  }, [showComeback])

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const [
        { data: plans },
        { data: completeDates },
        { data: recentDays },
        { data: coachRows },
      ] = await Promise.all([
        supabase
          .from('milrim_plans')
          .select('id, title, unit, total_amount, replan_count, daily_minutes, start_date, end_date')
          // 관리자 계정은 RLS 정책상 남의 플랜도 조회되므로 본인 것만 명시 필터
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase.from('milrim_plan_days').select('date').eq('user_id', user.id).eq('status', 'complete'),
        supabase
          .from('milrim_plan_days')
          .select('date, target_amount, actual_amount, status, study_seconds')
          .eq('user_id', user.id)
          .gte('date', addDaysStr(today, -14))
          .lt('date', today),
        supabase.from('milrim_daily_messages').select('segment, message').eq('date', today),
      ])

      setStudyDayCount(new Set((completeDates ?? []).map((d: { date: string }) => d.date)).size)

      let cards: GoalCard[] = []
      if (plans && plans.length > 0) {
        const planIds = plans.map((p: Plan) => p.id)
        const [{ data: todayDays }, { data: allDays }] = await Promise.all([
          supabase.from('milrim_plan_days').select('*').in('plan_id', planIds).eq('date', today),
          supabase.from('milrim_plan_days').select('plan_id, date, actual_amount, status').in('plan_id', planIds),
        ])

        cards = plans.map((p: Plan) => {
          const todayDay = todayDays?.find((d: PlanDay) => d.plan_id === p.id) ?? null
          const planDays = allDays?.filter((d: { plan_id: string }) => d.plan_id === p.id) ?? []
          const doneDays = planDays.filter((d: { status: string }) => d.status === 'complete')
          const completedAmount = doneDays.reduce((sum: number, d: { actual_amount: number | null }) => sum + (d.actual_amount ?? 0), 0)
          const progress = p.total_amount > 0 ? Math.round((completedAmount / p.total_amount) * 100) : 0
          const overdueDays = planDays.filter((d: { date: string; status: string }) => d.date < today && d.status !== 'complete').length
          return { ...p, todayDay, completedDays: doneDays.length, completedAmount, progress, overdueDays }
        })
        setGoals(cards)
      }

      // Solar 일일 코치 메시지 — 세그먼트는 본인 데이터로 브라우저가 판정
      const segment = pickCoachSegment({
        today,
        recentDays: (recentDays ?? []) as CoachDayRow[],
        plans: cards.map(c => ({
          start_date: c.start_date,
          end_date: c.end_date,
          total_amount: c.total_amount,
          completedAmount: c.completedAmount,
        })),
      })
      const aiMessage = coachRows?.find((r: { segment: string }) => r.segment === segment)?.message
      setCoachMessage(aiMessage ?? COACH_FALLBACK[segment])
      setCoachIsAi(!!aiMessage)

      setLoading(false)
    }

    fetchData()
  }, [today, user?.id])

  const todayTasks = goals.filter(g => g.todayDay)
  const mostOverdue = goals.filter(g => g.overdueDays > 0).sort((a, b) => b.overdueDays - a.overdueDays)[0] ?? null

  return (
    <Layout title={`안녕하세요, ${displayName}님`}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E2DCCB', borderTopColor: '#2E5A3A', animation: 'dspin 0.9s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* 누적 공부일 — 리셋되지 않는 숲 카운터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontSize: 12.5, color: 'var(--primary)', fontWeight: 700 }}>
            <span className="ms" style={{ fontSize: 16 }}>eco</span>
            {studyDayCount > 0 ? `${studyDayCount}일째 숲을 가꾸는 중이에요` : '오늘부터 숲을 가꿔볼까요?'}
          </div>

          {/* Goal cards header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>오늘의 계획</div>
            {goals.length >= 4 && (
              <div onClick={() => navigate('/plan')} style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>더 보기...</div>
            )}
          </div>
          {/* Goal cards — always 4 slots, filler with "새 계획 추가" */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {goals.slice(0, 4).map((g, i) => {
              const [c1, c2] = CARD_COLORS[i % CARD_COLORS.length]
              return (
                <div key={g.id} onClick={() => navigate(`/plan/${g.id}`)} style={{
                  background: `linear-gradient(150deg, ${c1} 0%, ${c2} 100%)`,
                  borderRadius: 22, padding: '22px 24px', color: '#fff', cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ fontSize: 13, opacity: 0.82, fontWeight: 500 }}>{g.title}</div>
                        {g.overdueDays > 0 && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
                            background: 'rgba(255,255,255,0.16)', borderRadius: 20, padding: '3px 9px',
                            fontSize: 10.5, fontWeight: 700,
                          }}>
                            <span className="ms" style={{ fontSize: 12 }}>eco</span>
                            이어가는 중
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 8 }}>
                        <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1 }}>
                          {g.todayDay?.target_amount ?? '-'}<span style={{ fontSize: 18 }}>{dispUnit(g.unit)}</span>
                        </div>
                      </div>
                    </div>
                    <CircleProgress pct={g.progress} />
                  </div>
                  <div style={{ display: 'flex', marginTop: 16, paddingTop: 15, borderTop: '1px solid rgba(255,255,255,0.16)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11.5, opacity: 0.78 }}>최소달성목표</div>
                      <div style={{ fontSize: 15.5, fontWeight: 700, marginTop: 3 }}>
                        {g.todayDay?.min_amount ?? '-'}{dispUnit(g.unit)}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11.5, opacity: 0.78 }}>누적 학습 시간</div>
                      <div style={{ fontSize: 15.5, fontWeight: 700, marginTop: 3 }}>{g.completedDays}일</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11.5, opacity: 0.78 }}>이어간 횟수</div>
                      <div style={{ fontSize: 15.5, fontWeight: 700, marginTop: 3 }}>{g.replan_count}회</div>
                    </div>
                  </div>
                </div>
              )
            })}
            {Array.from({ length: Math.max(0, 4 - Math.min(goals.length, 4)) }).map((_, i) => (
              <div
                key={`add-${i}`}
                onClick={() => navigate('/plan/new')}
                style={{
                  border: '1.5px dashed var(--border2)', borderRadius: 20, padding: 22,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 10, color: 'var(--ink-40)', cursor: 'pointer', minHeight: 150,
                }}
              >
                <span className="ms" style={{ fontSize: 30 }}>add_circle</span>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>새 계획 추가</div>
              </div>
            ))}
          </div>

          {/* Today's tasks + coach message */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 22, padding: '22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--ink)' }}>오늘 할 일</div>
                <div style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 700, background: 'var(--primary-tint)', padding: '5px 12px', borderRadius: 20 }}>
                  {todayTasks.filter(g => g.todayDay?.status === 'complete').length} / {todayTasks.length} 완료
                </div>
              </div>
              {todayTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13.5, color: 'var(--ink-30)' }}>
                  오늘 일정이 없어요
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {todayTasks.map(g => {
                    const done = g.todayDay?.status === 'complete'
                    return (
                      <div key={g.id} style={{
                        display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px',
                        border: `1px solid ${done ? 'var(--border3)' : 'var(--primary-tint2)'}`,
                        borderRadius: 15,
                        background: done ? 'var(--white)' : 'var(--paper)',
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                          background: done ? 'var(--primary)' : 'transparent',
                          border: done ? 'none' : '2px solid var(--border2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                        }}>
                          {done && <span className="ms" style={{ fontSize: 16, fontVariationSettings: "'wght' 400" }}>check</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-40)', fontWeight: 600 }}>{g.title}</div>
                          <div style={{
                            fontSize: 14.5, fontWeight: 600,
                            color: done ? 'var(--ink-30)' : 'var(--ink)',
                            textDecoration: done ? 'line-through' : 'none',
                          }}>
                            오늘 목표: {g.todayDay?.target_amount}{g.unit}
                          </div>
                        </div>
                        {!done && (
                          <button
                            onClick={() => navigate('/timer', { state: { planId: g.id, planDayId: g.todayDay?.id, title: g.title, target: g.todayDay?.target_amount, unit: g.unit, dailyMinutes: g.daily_minutes } })}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5, border: 'none',
                              background: 'var(--primary)', color: '#fff', fontSize: 12.5, fontWeight: 700,
                              padding: '9px 13px', borderRadius: 10, fontFamily: 'var(--font)', cursor: 'pointer', flexShrink: 0,
                            }}
                          >
                            <span className="ms" style={{ fontSize: 16, fontVariationSettings: "'wght' 400" }}>play_arrow</span>
                            시작
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ flex: 1, background: 'var(--primary-tint)', borderRadius: 22, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 13 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <span className="ms" style={{ fontSize: 28 }}>eco</span>
              </div>
              {coachIsAi && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--primary)', opacity: 0.75 }}>
                  <span className="ms" style={{ fontSize: 13 }}>auto_awesome</span>
                  AI 메이트의 오늘 한마디
                </div>
              )}
              <div style={{ fontSize: 15, color: 'var(--primary)', lineHeight: 1.65, fontWeight: 600 }}>
                {coachMessage}
              </div>
              {coachIsAi && (
                <div style={{ textAlign: 'right', fontSize: 10.5, color: 'var(--primary)', opacity: 0.55, letterSpacing: 0.3 }}>
                  Powered by Solar
                </div>
              )}
              {mostOverdue && (
                <button
                  onClick={() => navigate('/replan', { state: { planId: mostOverdue.id } })}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    border: 'none', background: 'var(--primary)', color: '#fff',
                    fontSize: 14, fontWeight: 700, padding: '13px 16px', borderRadius: 12,
                    fontFamily: 'var(--font)', cursor: 'pointer', marginTop: 3,
                  }}
                >
                  <span className="ms" style={{ fontSize: 18 }}>auto_awesome</span>
                  '{mostOverdue.title}' 이어가기
                </button>
              )}
            </div>
          </div>

          {/* 복귀 환영 토스트 */}
          {showComeback && (
            <div className="fade-in" style={{
              position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 96, zIndex: 300,
              background: 'var(--primary)', color: '#fff', borderRadius: 16, padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: 10, maxWidth: 'calc(100vw - 40px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            }}>
              <span className="ms" style={{ fontSize: 20, color: '#C2E098' }}>eco</span>
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>
                다시 와줘서 고마워요. 돌아오기만 하면, 언제든 이어갈 수 있어요.
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
