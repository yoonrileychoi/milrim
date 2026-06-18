import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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
    if (!id) return
    Promise.all([
      supabase.from('milrim_plans').select('*').eq('id', id).single(),
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
  }, [id, navigate])

  const handleDelete = async () => {
    if (!window.confirm('플랜을 삭제하시겠어요?\n모든 학습 기록도 함께 삭제됩니다.')) return
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
    const start = new Date(plan.start_date)
    const end = new Date(plan.end_date)
    const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
    const rows = []
    let remaining = plan.total_amount
    for (let i = 0; i < totalDays; i++) {
      const daysLeft = totalDays - i
      const target = i === totalDays - 1 ? remaining : Math.ceil(remaining / daysLeft)
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      rows.push({ plan_id: plan.id, user_id: user.id, date: d.toISOString().split('T')[0], target_amount: target, min_amount: Math.max(1, Math.ceil(target * 0.2)) })
      remaining -= target
    }
    const { data } = await supabase.from('milrim_plan_days').insert(rows).select()
    if (data) setDays(data as PlanDay[])
    setGenerating(false)
  }

  const fmtHeader = (d: string) => {
    const [y, m, day] = d.split('-')
    return `${y}. ${m}. ${day}`
  }

  const fmtShort = (d: string) => {
    const today = new Date().toISOString().split('T')[0]
    if (d === today) return '오늘'
    const [, m, day] = d.split('-')
    return `${parseInt(m)}/${parseInt(day)}`
  }

  const fmtMinutes = (m: number) =>
    m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}` : `${m}분`

  const completedCount = days.filter(d => d.status === 'complete').length
  const progress = days.length > 0 ? Math.round(completedCount / days.length * 100) : 0
  const today = new Date().toISOString().split('T')[0]

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
            {fmtHeader(plan.start_date)} ~ {fmtHeader(plan.end_date)} · {plan.unit} 단위
          </div>
          <div style={{ display: 'flex', gap: 26, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.78 }}>진행률</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{progress}%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.78 }}>전체 학습량</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{plan.total_amount}{plan.unit}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.78 }}>하루 시간</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{fmtMinutes(plan.daily_minutes)}</div>
            </div>
          </div>
        </div>

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
              const isToday = day.date === today
              const isDone = day.status === 'complete'
              return (
                <div key={day.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, background: '#fff',
                  border: isToday ? '1.5px solid #2E5A3A' : '1px solid #EFEADD',
                  borderRadius: 14, padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isDone ? '#9CC36B' : isToday ? '#2E5A3A' : '#c2bba8', width: 44, flexShrink: 0 }}>
                    {fmtShort(day.date)}
                  </div>
                  <div style={{
                    flex: 1, fontSize: 13.5, color: isDone ? '#b3ad9d' : '#2B2A26',
                    fontWeight: isToday ? 600 : 500,
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}>
                    {day.target_amount}{plan.unit}
                  </div>
                  {isDone && <span className="ms" style={{ fontSize: 18, color: '#9CC36B' }}>check_circle</span>}
                  {isToday && !isDone && <div style={{ fontSize: 11, color: '#9a9482' }}>진행중</div>}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            onClick={() => navigate('/plan/ai-loading', { state: { planId: plan.id, title: plan.title, startDate: plan.start_date, endDate: plan.end_date, dailyMinutes: plan.daily_minutes, unit: plan.unit, totalAmount: plan.total_amount } })}
            style={{ flex: 1, border: '1px solid #2E5A3A', background: '#fff', color: '#2E5A3A', fontSize: 14, fontWeight: 700, padding: 14, borderRadius: 14, fontFamily: 'var(--font)', cursor: 'pointer' }}
          >
            계획 수정
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ border: '1px solid #E2C9C2', background: '#fff', color: '#B5524A', fontSize: 14, fontWeight: 600, padding: '14px 18px', borderRadius: 14, fontFamily: 'var(--font)', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
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
