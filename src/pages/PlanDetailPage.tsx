import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { todayStr, dayCountInclusive } from '../lib/date'
import { distributeDays, DISTRIBUTION_LABELS, type Distribution } from '../lib/distribute'

type Plan = {
  id: string
  title: string
  start_date: string
  end_date: string
  unit: string
  total_amount: number
  daily_minutes: number
  replan_count: number
  status: 'active' | 'completed'
  ai_strategy: string | null
  ai_comment_by: 'solar' | 'fallback' | null
  distribution_pattern: Distribution
}

type PlanDay = {
  id: string
  date: string
  target_amount: number
  min_amount: number
  status: 'pending' | 'complete' | 'incomplete'
  actual_amount: number | null
  study_seconds: number
}

export default function PlanDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [days, setDays] = useState<PlanDay[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!id || !user) return
    Promise.all([
      // 관리자 계정은 RLS 정책상 남의 플랜도 조회되므로 본인 것만 명시 필터
      supabase.from('milrim_plans').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('milrim_plan_days').select('*').eq('plan_id', id).order('date', { ascending: true }),
    ]).then(([planRes, daysRes]) => {
      if (planRes.error || !planRes.data) {
        navigate('/plan', { replace: true })
        return
      }
      setPlan(planRes.data)
      setDays(daysRes.data || [])
      setLoading(false)
    })
  }, [id, user?.id, navigate])

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('milrim_plans').delete().eq('id', id)
    if (!error) {
      navigate('/plan', { replace: true })
    } else {
      setDeleting(false)
    }
  }

  const handleGenerateDays = async () => {
    if (!plan || !user) return
    setGenerating(true)
    const rows = distributeDays(plan.start_date, plan.end_date, plan.total_amount).map(d => ({
      ...d, plan_id: plan.id, user_id: user.id, study_seconds: 0,
    }))
    const { data, error } = await supabase.from('milrim_plan_days').insert(rows).select()
    if (error) {
      console.error('plan_days insert error:', error)
    } else {
      await supabase.from('milrim_plans').update({ generated_by: 'fallback' }).eq('id', plan.id)
    }
    if (data && data.length > 0) {
      setDays(data as PlanDay[])
    } else {
      // insert 성공해도 select 실패할 수 있으므로 재조회
      const { data: refetch } = await supabase.from('milrim_plan_days').select('*').eq('plan_id', plan.id).order('date', { ascending: true })
      if (refetch) setDays(refetch as PlanDay[])
    }
    setGenerating(false)
  }

  const fmtHeader = (d: string) => {
    const [y, m, day] = d.split('-')
    return `${y}. ${m}. ${day}`
  }

  const fmtShort = (d: string) => {
    const today = todayStr()
    if (d === today) return '오늘'
    const [, m, day] = d.split('-')
    return `${parseInt(m)}/${parseInt(day)}`
  }

  const fmtMinutes = (m: number) =>
    m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}` : `${m}분`

  // "기타" 단위는 숫자만 봐서는 무슨 단위인지 알 수 없어 괄호로 감싸고, 나머지는 숫자와 한 칸 띄움
  const fmtAmount = (amount: number, unit: string) =>
    unit === '기타' ? `${amount} (기타)` : `${amount} ${unit}`

  const completedCount = days.filter(d => d.status === 'complete').length
  const progress = days.length > 0 ? Math.round(completedCount / days.length * 100) : 0
  const today = todayStr()

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F2EA' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #DDE8CE', borderTopColor: '#2E5A3A', animation: 'dspin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!plan) return null

  return (
    <div className="fade-in" style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: '#F4F2EA' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '26px 24px 40px' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div
            onClick={() => navigate('/plan')}
            style={{ width: 38, height: 38, borderRadius: 11, background: '#fff', border: '1px solid #E7E1D3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6757', cursor: 'pointer' }}
          >
            <span className="ms" style={{ fontSize: 22 }}>arrow_back</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#2B2A26' }}>계획 상세</div>
        </div>

        {/* plan card */}
        <div style={{ background: 'linear-gradient(150deg, #2E5A3A 0%, #3C6B45 100%)', borderRadius: 22, padding: 22, color: '#fff' }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>{plan.title}</div>
          <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 5 }}>
            {fmtHeader(plan.start_date)} ~ {fmtHeader(plan.end_date)} (총 {dayCountInclusive(plan.start_date, plan.end_date)}일)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 26, rowGap: 14, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.78 }}>진행률</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{progress}%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.78 }}>전체 학습량</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{fmtAmount(plan.total_amount, plan.unit)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.78 }}>하루 시간</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{fmtMinutes(plan.daily_minutes)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.78 }}>학습량 배분</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                {(DISTRIBUTION_LABELS[plan.distribution_pattern] ?? DISTRIBUTION_LABELS.even).resultLabel}
              </div>
            </div>
          </div>
        </div>

        {/* 한줄 코멘트 — Solar가 실제로 쓴 경우에만 "AI 메이트/Powered by Solar" 표기(표기·구현 일치) */}
        {plan.ai_strategy && (() => {
          const isAi = plan.ai_comment_by !== 'fallback' // null(과거 행·재계획)·'solar'는 AI로 취급
          return (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: '#F1F7E8', border: '1px solid #DDE8CE', borderRadius: 14,
              padding: '13px 16px', marginTop: 14,
            }}>
              <span className="ms" style={{ fontSize: 18, color: '#6B9C4A', flexShrink: 0, marginTop: 1 }}>{isAi ? 'auto_awesome' : 'eco'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#3E5A2E', lineHeight: 1.55 }}>
                  {isAi && <span style={{ fontWeight: 700 }}>AI 도우미의 한 마디: </span>}
                  {plan.ai_strategy}
                </div>
                {isAi && (
                  <div style={{ fontSize: 10.5, color: '#9CB088', textAlign: 'right', marginTop: 4 }}>
                    Powered by Solar
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* daily tasks */}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#2B2A26', margin: '20px 2px 11px' }}>일자별 계획</div>
        {days.length === 0 ? (
          <div style={{
            background: '#fff', border: '1px solid #ECE7DA', borderRadius: 14,
            padding: '28px 20px', textAlign: 'center',
          }}>
            <span className="ms" style={{ fontSize: 36, color: '#DDE8CE' }}>calendar_month</span>
            <div style={{ fontSize: 14, color: '#9a9482', marginTop: 10 }}>아직 일별 계획이 없어요</div>
            <button
              onClick={handleGenerateDays}
              disabled={generating}
              style={{ marginTop: 14, border: 'none', background: '#2E5A3A', color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 24px', borderRadius: 12, fontFamily: 'var(--font)', cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1 }}
            >
              {generating ? '생성 중...' : '계획 생성하기'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {days.map(day => {
              const isPast = day.date < today
              const isToday = day.date === today
              const isFuture = day.date > today
              const isDone = day.status === 'complete'
              const isIncomplete = day.status === 'incomplete'
              const isActive = isToday && !isDone && !isIncomplete
              // 과거 또는 incomplete = 흑백 처리
              const isMuted = isPast || isIncomplete
              return (
                <div key={day.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: isMuted ? '#F7F5EF' : '#fff',
                  border: isActive ? '1.5px solid #2E5A3A' : '1px solid #EFEADD',
                  borderRadius: 14, padding: '12px 14px',
                }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700,
                    color: isIncomplete ? '#d8d3c8' : isMuted ? '#c2bba8' : isDone ? '#9CC36B' : '#2E5A3A',
                    width: 44, flexShrink: 0,
                  }}>
                    {fmtShort(day.date)}
                  </div>
                  <div style={{
                    flex: 1, fontSize: 13.5,
                    color: isIncomplete ? '#d8d3c8' : isMuted ? '#c2bba8' : '#2B2A26',
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: isDone || isIncomplete ? 'line-through' : 'none',
                  }}>
                    {day.target_amount}{plan.unit}
                  </div>
                  {isDone && <span className="ms" style={{ fontSize: 18, color: isMuted ? '#c2bba8' : '#9CC36B' }}>check_circle</span>}
                  {isIncomplete && <div style={{ fontSize: 10, color: '#d0cbbe', fontWeight: 600 }}>조정 완료</div>}
                  {isActive && <div style={{ fontSize: 11, color: '#9a9482' }}>진행중</div>}
                  {isFuture && isDone && <span className="ms" style={{ fontSize: 18, color: '#9CC36B' }}>check_circle</span>}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            onClick={() => navigate('/plan/new', { state: { planId: plan.id, title: plan.title, startDate: plan.start_date, endDate: plan.end_date, dailyMinutes: plan.daily_minutes, unit: plan.unit, totalAmount: plan.total_amount, distribution: plan.distribution_pattern } })}
            style={{ flex: 1, border: '1px solid #2E5A3A', background: '#fff', color: '#2E5A3A', fontSize: 14, fontWeight: 700, padding: 14, borderRadius: 14, fontFamily: 'var(--font)', cursor: 'pointer' }}
          >
            계획 수정
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ flex: 1, border: '1px solid #E2C9C2', background: '#fff', color: '#B5524A', fontSize: 14, fontWeight: 600, padding: 14, borderRadius: 14, fontFamily: 'var(--font)', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: '#b3ad9d', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
          목표일·학습량·시간을 수정하면 AI가 다시 계획을 만들어요
        </div>
      </div>
    </div>
  )
}
