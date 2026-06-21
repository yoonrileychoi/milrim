import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const ICONS = [
  { icon: 'eco', color: '#2E5A3A', bg: '#DDE8CE' },
  { icon: 'park', color: '#5C7A4A', bg: '#E6E0CF' },
  { icon: 'forest', color: '#2E5A3A', bg: '#DDE8CE' },
  { icon: 'grass', color: '#5C7A4A', bg: '#E6E0CF' },
]

interface AdminUser {
  id: string
  nickname: string
  email: string
  joinDate: string
  plans: number
  replans: number
}

interface KPI {
  totalUsers: number
  activeUsers: number
  totalReplans: number
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.app_metadata?.milrim_role === 'admin'
  const [users, setUsers] = useState<AdminUser[]>([])
  const [kpi, setKpi] = useState<KPI>({ totalUsers: 0, activeUsers: 0, totalReplans: 0 })
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    fetchData()
  }, [isAdmin])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-list-users')
      if (usersError) throw usersError
      const profiles: { id: string; nickname: string; email: string; created_at: string }[] = usersData?.users || []

      const { data: plans } = await supabase
        .from('milrim_plans')
        .select('user_id, replan_count')

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data: sessions } = await supabase
        .from('milrim_study_sessions')
        .select('user_id')
        .gte('started_at', sevenDaysAgo.toISOString())

      const userStats: AdminUser[] = (profiles || []).map(p => {
        const userPlans = (plans || []).filter(pl => pl.user_id === p.id)
        const d = new Date(p.created_at)
        const joinDate = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
        return {
          id: p.id,
          nickname: p.nickname,
          email: p.email || '',
          joinDate,
          plans: userPlans.length,
          replans: userPlans.reduce((sum, pl) => sum + (pl.replan_count || 0), 0),
        }
      })

      const activeUserIds = new Set((sessions || []).map(s => s.user_id))
      const totalReplans = (plans || []).reduce((sum, p) => sum + (p.replan_count || 0), 0)

      setUsers(userStats)
      setKpi({
        totalUsers: profiles?.length || 0,
        activeUsers: activeUserIds.size,
        totalReplans,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: deleteTarget.id },
      })
      if (error) throw error
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      setKpi(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }))
      setDeleteTarget(null)
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  const filtered = users.filter(u => u.nickname.toLowerCase().includes(search.toLowerCase()))

  if (!isAdmin) {
    return (
      <Layout title="관리자 페이지">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <span className="ms" style={{ fontSize: 48, color: '#B5524A' }}>lock</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#2B2A26', marginTop: 16 }}>접근 권한이 없습니다</div>
          <div style={{ fontSize: 14, color: '#9a9482', marginTop: 8 }}>관리자 계정으로 로그인해주세요.</div>
          <button
            onClick={() => navigate('/home')}
            style={{ marginTop: 24, border: 'none', background: '#2E5A3A', color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 28px', borderRadius: 14, fontFamily: 'var(--font)', cursor: 'pointer' }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="관리자 페이지">
      <div className="fade-in">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px' }}>
            <div style={{ fontSize: 13, color: '#9a9482' }}>총 가입자</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2B2A26', marginTop: 6 }}>{loading ? '-' : kpi.totalUsers.toLocaleString()}</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px' }}>
            <div style={{ fontSize: 13, color: '#9a9482' }}>7일간 활성 사용자</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2B2A26', marginTop: 6 }}>{loading ? '-' : kpi.activeUsers.toLocaleString()}</div>
          </div>
          <div style={{ background: '#2E5A3A', borderRadius: 20, padding: '22px 24px' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>누적 AI 재계획</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 6 }}>{loading ? '-' : kpi.totalReplans.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 22, marginTop: 16, overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px 12px', minWidth: 560 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2B2A26' }}>사용자 관리</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAF6EE', border: '1px solid #E7E1D3', borderRadius: 10, padding: '8px 12px', width: 220 }}>
              <span className="ms" style={{ fontSize: 18, color: '#b3ad9d' }}>search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="닉네임으로 검색"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 13, color: '#2B2A26', width: '100%' }}
              />
            </div>
          </div>
          <div style={{ minWidth: 560 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '2.4fr 1.4fr 0.8fr 0.8fr 0.6fr',
              padding: '10px 22px', borderTop: '1px solid #F0EADC', borderBottom: '1px solid #F0EADC',
              fontSize: 12, color: '#9a9482', fontWeight: 600,
            }}>
              <div>사용자</div><div>가입일</div><div style={{ textAlign: 'center' }}>플랜</div><div style={{ textAlign: 'center' }}>재계획</div><div style={{ textAlign: 'right' }}>관리</div>
            </div>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9a9482' }}>불러오는 중...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9a9482' }}>사용자가 없습니다.</div>
            ) : filtered.map((u, i) => {
              const iconSet = ICONS[i % ICONS.length]
              return (
                <div key={u.id} style={{
                  display: 'grid', gridTemplateColumns: '2.4fr 1.4fr 0.8fr 0.8fr 0.6fr',
                  alignItems: 'center', padding: '14px 22px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #F4EFE3' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: iconSet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconSet.color, flexShrink: 0 }}>
                      <span className="ms" style={{ fontSize: 18 }}>{iconSet.icon}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#2B2A26' }}>{u.nickname}</div>
                      <div style={{ fontSize: 11, color: '#9a9482', marginTop: 1 }}>{u.email}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#847f6f' }}>{u.joinDate}</div>
                  <div style={{ fontSize: 14, color: '#2B2A26', textAlign: 'center' }}>{u.plans}</div>
                  <div style={{ fontSize: 14, color: '#2B2A26', textAlign: 'center' }}>{u.replans}</div>
                  <div style={{ textAlign: 'right', color: '#B5524A', cursor: 'pointer' }} onClick={() => setDeleteTarget(u)}>
                    <span className="ms" style={{ fontSize: 20 }}>delete</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div
          onClick={() => !deleting && setDeleteTarget(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(43,42,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}
        >
          <div onClick={e => e.stopPropagation()} className="pop-in" style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 22, padding: '26px 24px 22px' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#FBEDEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B5524A', margin: '0 auto 16px' }}>
              <span className="ms" style={{ fontSize: 28 }}>warning</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#2B2A26', textAlign: 'center' }}>정말 삭제하시겠어요?</div>
            <div style={{ fontSize: 13, color: '#847f6f', textAlign: 'center', marginTop: 9, lineHeight: 1.6 }}>
              {deleteTarget.nickname}의 계정과<br />학습 기록이 영구 삭제됩니다.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ flex: 1, border: '1px solid #DDD7C6', background: '#fff', color: '#6B6757', fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 14, fontFamily: 'var(--font)', cursor: 'pointer' }}>취소</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, border: 'none', background: '#B5524A', color: '#fff', fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 14, fontFamily: 'var(--font)', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
