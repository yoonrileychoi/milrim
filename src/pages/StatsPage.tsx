import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function StatsPage() {
  const { user } = useAuth()
  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || '사용자'

  const [totalSeconds, setTotalSeconds] = useState(0)
  const [studyDays, setStudyDays] = useState(0)
  const [replanCount, setReplanCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split('T')[0]
      const todayStart = `${today}T00:00:00`
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStart = `${tomorrow.toISOString().split('T')[0]}T00:00:00`

      const [{ data: sessions }, { data: completedDays }, { data: plans }] = await Promise.all([
        supabase.from('milrim_study_sessions').select('duration_seconds').gte('started_at', todayStart).lt('started_at', tomorrowStart),
        supabase.from('milrim_plan_days').select('date').eq('status', 'complete'),
        supabase.from('milrim_plans').select('replan_count'),
      ])

      setTotalSeconds(sessions?.reduce((s, r) => s + (r.duration_seconds ?? 0), 0) ?? 0)
      setStudyDays(completedDays?.length ?? 0)
      setReplanCount(plans?.reduce((s, p) => s + (p.replan_count ?? 0), 0) ?? 0)
      setLoading(false)
    }
    fetchStats()
  }, [])

  const totalHours = Math.floor(totalSeconds / 3600)
  const totalMins = Math.floor((totalSeconds % 3600) / 60)
  const timeDisplay = totalHours > 0
    ? `${totalHours}시간 ${totalMins > 0 ? totalMins + '분' : ''}`
    : `${totalMins}분`

  return (
    <Layout title="나의 숲">
      <div className="fade-in">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E2DCCB', borderTopColor: '#2E5A3A', animation: 'dspin 0.9s linear infinite' }} />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px' }}>
                <div style={{ fontSize: 13, color: '#9a9482' }}>오늘 누적 학습 시간</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#2B2A26', marginTop: 7 }}>
                  {totalSeconds === 0 ? <span style={{ fontSize: 18 }}>아직 없어요</span> : timeDisplay}
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px' }}>
                <div style={{ fontSize: 13, color: '#9a9482' }}>누적 공부일</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#2B2A26', marginTop: 7 }}>
                  {studyDays}<span style={{ fontSize: 14 }}>일</span>
                </div>
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

          </>
        )}
      </div>
    </Layout>
  )
}
