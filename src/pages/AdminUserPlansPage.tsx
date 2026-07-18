import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// 관리자 전용: 특정 계정이 생성한 플랜 목록 (최근 생성 순)
// milrim_plans의 "관리자 전체 플랜 조회" RLS 정책으로 조회 가능.
// milrim_plan_days에는 관리자 정책이 없어 일별 계획은 열람 불가 —
// 그래서 카드에 상세 페이지 링크를 걸지 않는다.

type Plan = {
  id: string
  title: string
  start_date: string
  end_date: string
  unit: string
  total_amount: number
  replan_count: number
  status: 'active' | 'completed'
  created_at: string
}

export default function AdminUserPlansPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const { state } = useLocation()
  const { nickname, email } = (state ?? {}) as { nickname?: string; email?: string }
  const { user } = useAuth()
  const isAdmin = user?.app_metadata?.milrim_role === 'admin'

  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin || !userId) return
    supabase
      .from('milrim_plans')
      .select('id, title, start_date, end_date, unit, total_amount, replan_count, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPlans(data || [])
        setLoading(false)
      })
  }, [isAdmin, userId])

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-')
    return `${y}.${m}.${day}`
  }

  const fmtCreated = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  if (!isAdmin) {
    return (
      <Layout title="관리자 페이지">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <span className="ms" style={{ fontSize: 48, color: '#B5524A' }}>lock</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#2B2A26', marginTop: 16 }}>접근 권한이 없습니다</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="사용자 학습 계획 조회">
      <div className="fade-in">
        {/* header: back + user info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div
            onClick={() => navigate('/admin')}
            style={{ width: 38, height: 38, borderRadius: 11, background: '#fff', border: '1px solid #E7E1D3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6757', cursor: 'pointer', flexShrink: 0 }}
          >
            <span className="ms" style={{ fontSize: 22 }}>arrow_back</span>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2B2A26' }}>{nickname || '사용자'}</div>
            {email && <div style={{ fontSize: 12, color: '#9a9482', marginTop: 1 }}>{email}</div>}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #DDE8CE', borderTopColor: '#2E5A3A', animation: 'dspin 0.8s linear infinite' }} />
          </div>
        ) : plans.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '48px 24px', textAlign: 'center', color: '#9a9482', fontSize: 14 }}>
            생성한 학습 계획이 없습니다.
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 22, overflowX: 'auto' }}>
            <div style={{ minWidth: 620 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1.6fr 1fr 0.8fr 0.8fr 1fr',
                padding: '12px 22px', borderBottom: '1px solid #F0EADC',
                fontSize: 12, color: '#9a9482', fontWeight: 600,
              }}>
                <div>학습 계획</div><div>기간</div><div style={{ textAlign: 'center' }}>학습량</div>
                <div style={{ textAlign: 'center' }}>재계획</div><div style={{ textAlign: 'center' }}>상태</div>
                <div style={{ textAlign: 'right' }}>생성일</div>
              </div>
              {plans.map((p, i) => (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.6fr 1fr 0.8fr 0.8fr 1fr',
                  alignItems: 'center', padding: '14px 22px',
                  borderBottom: i < plans.length - 1 ? '1px solid #F4EFE3' : 'none',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2B2A26', wordBreak: 'keep-all', paddingRight: 8 }}>{p.title}</div>
                  <div style={{ fontSize: 12.5, color: '#847f6f' }}>{fmtDate(p.start_date)} ~ {fmtDate(p.end_date)}</div>
                  <div style={{ fontSize: 13, color: '#2B2A26', textAlign: 'center' }}>{p.total_amount}{p.unit}</div>
                  <div style={{ fontSize: 13, color: '#2B2A26', textAlign: 'center' }}>{p.replan_count}회</div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: p.status === 'completed' ? '#EFEADD' : '#DDE8CE',
                      color: p.status === 'completed' ? '#847f6f' : '#2E5A3A',
                    }}>
                      {p.status === 'completed' ? '완료' : '진행 중'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#847f6f', textAlign: 'right' }}>{fmtCreated(p.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ fontSize: 12, color: '#b3ad9d', marginTop: 12, lineHeight: 1.6 }}>
          개인정보 보호를 위해 학습 계획 목록만 표시됩니다 (일별 계획·학습 기록은 열람 불가).
        </div>
      </div>
    </Layout>
  )
}
