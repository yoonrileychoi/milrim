import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type Plan = {
  id: string
  title: string
  start_date: string
  end_date: string
  unit: string
  total_amount: number
  replan_count: number
  status: 'active' | 'completed'
}

export default function PlanListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const { data: plansData } = await supabase
        .from('milrim_plans')
        .select('id, title, start_date, end_date, unit, total_amount, replan_count, status')
        // 관리자 계정은 RLS 정책상 남의 플랜도 조회되므로 본인 것만 명시 필터
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      const list = plansData || []
      setPlans(list)

      if (list.length > 0) {
        const { data: days } = await supabase
          .from('milrim_plan_days')
          .select('plan_id, actual_amount, status')
          .in('plan_id', list.map(p => p.id))
          .eq('status', 'complete')
        const map: Record<string, number> = {}
        for (const p of list) {
          const done = (days || [])
            .filter(d => d.plan_id === p.id)
            .reduce((s, d) => s + (d.actual_amount ?? 0), 0)
          map[p.id] = p.total_amount > 0 ? Math.min(100, Math.round((done / p.total_amount) * 100)) : 0
        }
        setProgressMap(map)
      }
      setLoading(false)
    }
    fetchData()
  }, [user?.id])

  const fmt = (d: string) => {
    const [, m, day] = d.split('-')
    return `${parseInt(m)}/${parseInt(day)}`
  }

  const getRemain = (end: string, status: string) => {
    if (status === 'completed') return '완료'
    const diff = Math.ceil((new Date(end + 'T23:59:59').getTime() - Date.now()) / 86400000)
    if (diff < 0) return '기간 초과'
    if (diff === 0) return '오늘 마감'
    return `남은 ${diff}일`
  }

  return (
    <Layout title="나의 학습계획">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #DDE8CE', borderTopColor: '#2E5A3A', animation: 'dspin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {plans.map(plan => {
            const isDone = plan.status === 'completed'
            const remain = getRemain(plan.end_date, plan.status)
            return (
              <div
                key={plan.id}
                onClick={() => navigate(`/plan/${plan.id}`)}
                style={{
                  background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: 22,
                  cursor: 'pointer', opacity: isDone ? 0.72 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ flex: 1, marginRight: 8 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: isDone ? '#6B6757' : '#2B2A26', wordBreak: 'keep-all' }}>{plan.title}</div>
                    <div style={{ fontSize: 12, color: '#9a9482', marginTop: 4 }}>{fmt(plan.start_date)} ~ {fmt(plan.end_date)} · {remain}</div>
                  </div>
                  {isDone && <div style={{ fontSize: 14, fontWeight: 800, color: '#9CC36B', flexShrink: 0 }}>완료</div>}
                </div>
                <div style={{ height: 9, background: '#EDE7D7', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: isDone ? '100%' : `${progressMap[plan.id] ?? 0}%`, height: '100%',
                    background: isDone ? '#9CC36B' : 'linear-gradient(90deg, #9CC36B, #2E5A3A)',
                    borderRadius: 6,
                  }} />
                </div>
                <div style={{ fontSize: 11.5, color: '#9a9482', marginTop: 10 }}>
                  총 {plan.total_amount}{plan.unit} · 재계획 {plan.replan_count}회 · {isDone ? 100 : (progressMap[plan.id] ?? 0)}%
                </div>
              </div>
            )
          })}

          <div
            onClick={() => navigate('/plan/new')}
            style={{
              border: '1.5px dashed #D8CFB8', borderRadius: 20, padding: 22,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 10, color: '#9a9482', cursor: 'pointer', minHeight: 150,
            }}
          >
            <span className="ms" style={{ fontSize: 30 }}>add_circle</span>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>새 계획 추가</div>
          </div>
        </div>
      )}
    </Layout>
  )
}
