import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
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
  // 코치 팝업 — closing은 "닫는 중"(축소 애니메이션 재생 중) 상태. 애니메이션이 끝난 뒤에
  // 실제로 화면에서 제거한다.
  const [showCoachPop, setShowCoachPop] = useState(false)
  const [coachPopClosing, setCoachPopClosing] = useState(false)
  const today = todayStr()

  // 복귀 환영 토스트 — 3일 이상 공백 후 첫 방문
  useEffect(() => {
    if (!user) return
    const key = `milrim_last_visit_${user.id}`
    const prev = localStorage.getItem(key)
    localStorage.setItem(key, today)
    if (prev && diffDays(today, prev) >= 3) setShowComeback(true)
  }, [user, today])

  // 코치 팝업 — 오늘 처음 홈에 들어왔을 때 한 번만. 복귀 토스트가 뜨는 날(3일 이상 공백)에는
  // 두 개가 동시에 뜨므로 건너뛴다. 복귀 토스트와 달리 자동으로 닫히지 않는다(사용자 결정) —
  // 닫기 버튼·바깥 탭·스와이프로만 닫는다.
  useEffect(() => {
    if (!user) return
    const key = `milrim_coach_seen_${user.id}`
    if (localStorage.getItem(key) === today) return
    // 복귀 토스트 판정이 위 effect에서 먼저 끝나 있어야 하므로 showComeback을 함께 본다.
    if (showComeback) return
    localStorage.setItem(key, today)
    setShowCoachPop(true)
  }, [user, today, showComeback])

  // 토스트 자동 닫기 — 위 effect에 두면 user 객체가 갱신될 때 cleanup이 타이머를 지워버려
  // (재실행 시엔 이미 오늘 날짜가 저장돼 있어 새 타이머도 안 걸린다) 토스트가 영영 남는다.
  // loading을 함께 보는 이유: 토스트는 loading이 끝난 뒤에야 화면에 그려지는데, showComeback만
  // 보면 로딩 중에 타이머가 먼저 시작돼 데이터 조회가 6초를 넘기면 토스트가 보이기도 전에
  // 닫혀버린다(2026-07-31 브라우저 확인 중 발견). 실제로 보이는 시점부터 30초를 센다.
  // 탭·앱이 백그라운드로 가 있는 동안은 타이머를 멈추고, 돌아오면 남은 시간만큼 이어서 센다 —
  // 안 그러면 "돌아와도 괜찮다"는 환영 메시지를 정작 돌아왔을 때 못 보고 놓치게 된다.
  useEffect(() => {
    if (!showComeback || loading) return
    let remaining = 30000
    let startedAt = Date.now()
    let timer: ReturnType<typeof setTimeout>

    const start = () => {
      startedAt = Date.now()
      timer = setTimeout(() => setShowComeback(false), remaining)
    }
    const pause = () => {
      clearTimeout(timer)
      remaining -= Date.now() - startedAt
    }
    const handleVisibility = () => {
      if (document.hidden) pause()
      else start()
    }

    start()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [showComeback, loading])

  // 토스트 바깥 영역 탭·클릭 시 닫기. pointerdown이 아니라 click을 쓴다 — pointerdown은
  // 손가락이 화면에 닿는 순간(스크롤·드래그 시작 포함) 무조건 발생해서, 모바일에서 목록을
  // 스크롤만 해도 토스트가 닫히는 문제가 있었다(2026-08-01 확인). click은 브라우저가 "누르고
  // 움직임 없이 뗐을 때"만 발생시켜 드래그·스크롤은 자동으로 걸러진다.
  // 토스트 자체 위에서 시작된 터치는 아래 스와이프 판정이 전담하므로 여기서는 제외한다.
  const comebackToastRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!showComeback) return
    const dismissIfOutside = (e: Event) => {
      const target = e.target as Node | null
      if (comebackToastRef.current && target && comebackToastRef.current.contains(target)) return
      setShowComeback(false)
    }
    document.addEventListener('click', dismissIfOutside)
    return () => {
      document.removeEventListener('click', dismissIfOutside)
    }
  }, [showComeback])

  // 토스트를 "오늘 할 일 + AI 메이트" 영역 전체(좌우 패딩 포함)와 맞추기 — 그리드 폭·위치는
  // 화면 크기·사이드바 유무에 따라 달라지므로 CSS로 추측하지 않고 실제 렌더링된 컨테이너의
  // 위치·너비를 측정한다(StatsPage.tsx에서 쓴 방식과 동일 — 크기 추측은 화면 크기마다 어긋나기
  // 쉽다). 데스크톱은 사이드바 때문에 콘텐츠 영역이 화면 정중앙(50vw)에 있지 않으므로,
  // 중앙 정렬(left:50%+transform) 대신 컨테이너의 실제 left 좌표를 그대로 쓴다.
  const todayGridRef = useRef<HTMLDivElement>(null)
  const [toastBox, setToastBox] = useState<{ left: number; width: number } | null>(null)
  useEffect(() => {
    if (loading) return
    const measure = () => {
      const rect = todayGridRef.current?.getBoundingClientRect()
      if (rect) setToastBox({ left: rect.left, width: rect.width })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [loading, goals.length])

  // 코치 팝업 닫기 — 곧바로 지우지 않고 축소 애니메이션(0.2s)을 재생한 뒤 제거한다.
  const closeCoachPop = () => {
    setCoachPopClosing(true)
    setTimeout(() => {
      setShowCoachPop(false)
      setCoachPopClosing(false)
    }, 200)
  }

  // 코치 팝업 바깥(어두운 배경) 탭으로 닫기. 배경 요소에 직접 onClick을 걸므로 복귀 토스트처럼
  // document 전역 리스너를 쓸 필요가 없다.
  // 팝업을 위·아래로 40px 이상 끌면(스와이프) 닫기 — 복귀 토스트와 같은 방식.
  const coachDragStartY = useRef<number | null>(null)
  const handleCoachPointerDown = (e: ReactPointerEvent) => {
    coachDragStartY.current = e.clientY
  }
  const handleCoachPointerMove = (e: ReactPointerEvent) => {
    if (coachDragStartY.current == null) return
    if (Math.abs(e.clientY - coachDragStartY.current) > 40) {
      coachDragStartY.current = null
      closeCoachPop()
    }
  }
  const handleCoachPointerUp = () => {
    coachDragStartY.current = null
  }

  // 토스트를 위·아래로 40px 이상 끌면(스와이프) 닫기
  const comebackDragStartY = useRef<number | null>(null)
  const handleComebackPointerDown = (e: ReactPointerEvent) => {
    comebackDragStartY.current = e.clientY
  }
  const handleComebackPointerMove = (e: ReactPointerEvent) => {
    if (comebackDragStartY.current == null) return
    if (Math.abs(e.clientY - comebackDragStartY.current) > 40) {
      comebackDragStartY.current = null
      setShowComeback(false)
    }
  }
  const handleComebackPointerUp = () => {
    comebackDragStartY.current = null
  }

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

  // 토스트 너비를 측정된 컨테이너 폭의 95%로 줄이되(요청: 5%씩 축소), 줄어든 만큼 좌우
  // 여백을 균등하게 나눠 중심축은 그대로 유지한다
  const toastShrink = 0.95
  const toastRenderBox = toastBox
    ? { left: toastBox.left + (toastBox.width * (1 - toastShrink)) / 2, width: toastBox.width * toastShrink }
    : null

  // 개발 전용 — 복귀 환영 토스트 테스트 버튼. 방문 기록을 4일 전으로 되돌리고 새로고침한다.
  // import.meta.env.DEV 가드로 프로덕션 빌드에는 포함되지 않음(LoginPage 테스트 로그인과 동일 패턴)
  const handleDevResetComeback = () => {
    const oldDate = addDaysStr(today, -4)
    Object.keys(localStorage).filter(k => k.startsWith('milrim_last_visit_')).forEach(k => localStorage.setItem(k, oldDate))
    window.location.reload()
  }

  // 개발 전용 — 코치 팝업 테스트 버튼. 오늘 본 기록을 지우고 바로 다시 띄운다.
  const handleDevResetCoachPop = () => {
    Object.keys(localStorage).filter(k => k.startsWith('milrim_coach_seen_')).forEach(k => localStorage.removeItem(k))
    setCoachPopClosing(false)
    setShowCoachPop(true)
  }

  return (
    <Layout title={`안녕하세요, ${displayName}님`}>
      {import.meta.env.DEV && (
        <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 500, display: 'flex', gap: 6 }}>
          <button
            onClick={handleDevResetComeback}
            style={{
              border: '1px dashed #b3ad9d', background: '#fff', color: '#847f6f',
              fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            테스트: 복귀 토스트 띄우기
          </button>
          <button
            onClick={handleDevResetCoachPop}
            style={{
              border: '1px dashed #b3ad9d', background: '#fff', color: '#847f6f',
              fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            테스트: 코치 팝업 띄우기
          </button>
        </div>
      )}
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

          {/* AI 메이트 카드 — 화면 최상단(카운터 바로 아래)으로 이동. 원래는 아래 "오늘 할 일"
              옆 2칸 그리드의 두 번째 칸이었다(2026-08-02 재배치). */}
          <div style={{ background: 'var(--primary-tint)', borderRadius: 22, padding: 22, display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 16 }}>
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

          {/* Goal cards header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>오늘의 계획</div>
            {goals.length >= 4 && (
              <div onClick={() => navigate('/plan')} style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>전체 계획 보기</div>
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
          <div ref={todayGridRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
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
                <div className="today-tasks-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {todayTasks.slice(0, 10).map(g => {
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
          </div>

          {/* 코치 팝업 — 오늘 첫 방문 시 1회. 배경을 한 톤 어둡게 덮어 팝업만 또렷하게 보이도록 한다.
              닫으면 배경이 원래 밝기로 돌아오고 팝업은 작아지며 사라진다. */}
          {showCoachPop && (
            <div
              className={coachPopClosing ? 'coach-backdrop-out' : 'coach-backdrop-in'}
              onClick={closeCoachPop}
              style={{
                position: 'fixed', inset: 0, zIndex: 400,
                background: 'rgba(30, 35, 28, 0.45)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                padding: '14vh 20px 20px',
              }}
            >
              <div
                className={coachPopClosing ? 'coach-pop-out' : 'coach-pop-in'}
                // 팝업 안쪽을 눌렀을 때 배경 클릭으로 번져 닫히지 않도록 막는다.
                onClick={e => e.stopPropagation()}
                onPointerDown={handleCoachPointerDown}
                onPointerMove={handleCoachPointerMove}
                onPointerUp={handleCoachPointerUp}
                onPointerCancel={handleCoachPointerUp}
                style={{
                  width: '100%', maxWidth: 420,
                  background: 'var(--primary-tint)', borderRadius: 22, padding: '24px 24px 20px',
                  display: 'flex', flexDirection: 'column', gap: 13,
                  boxShadow: '0 14px 34px rgba(0,0,0,0.28)',
                  touchAction: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                    <span className="ms" style={{ fontSize: 28 }}>eco</span>
                  </div>
                  <button
                    onClick={closeCoachPop}
                    aria-label="닫기"
                    style={{
                      border: 'none', background: 'transparent', color: 'var(--primary)', opacity: 0.6,
                      cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0,
                    }}
                  >
                    <span className="ms" style={{ fontSize: 20 }}>close</span>
                  </button>
                </div>
                {coachIsAi && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--primary)', opacity: 0.75 }}>
                    <span className="ms" style={{ fontSize: 13 }}>auto_awesome</span>
                    AI 메이트의 오늘 한마디
                  </div>
                )}
                <div style={{ fontSize: 15.5, color: 'var(--primary)', lineHeight: 1.65, fontWeight: 600 }}>
                  {coachMessage}
                </div>
                {coachIsAi && (
                  <div style={{ textAlign: 'right', fontSize: 10.5, color: 'var(--primary)', opacity: 0.55, letterSpacing: 0.3 }}>
                    Powered by Solar
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 복귀 환영 토스트 — 옵션 A: 아이보리(카드 위에서도 또렷) */}
          {showComeback && (
            <div
              ref={comebackToastRef}
              className="fade-in"
              onPointerDown={handleComebackPointerDown}
              onPointerMove={handleComebackPointerMove}
              onPointerUp={handleComebackPointerUp}
              onPointerCancel={handleComebackPointerUp}
              style={{
                position: 'fixed', bottom: '11.2vh', zIndex: 300,
                left: toastRenderBox ? `${toastRenderBox.left}px` : '50%',
                transform: toastRenderBox ? 'none' : 'translateX(-50%)',
                width: toastRenderBox ? `${toastRenderBox.width}px` : undefined,
                background: '#FBF8F0',
                color: '#1E2A1C', borderRadius: 11, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 10,
                maxWidth: 'calc(100vw - 40px)',
                boxShadow: '0 8px 18px rgba(0,0,0,0.25)',
                touchAction: 'none',
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2F4A33', flexShrink: 0 }} />
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5 }}>
                다시 와줘서 고마워요. 돌아오기만 하면, 언제든 이어갈 수 있어요.
              </div>
              <button
                onClick={() => setShowComeback(false)}
                aria-label="닫기"
                style={{
                  border: 'none', background: 'transparent', color: '#1E2A1C', opacity: 0.6,
                  cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0,
                }}
              >
                <span className="ms" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
