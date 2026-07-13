import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { todayStr, addDaysStr } from '../lib/date'

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

export default function StatsPage() {
const [totalSeconds, setTotalSeconds] = useState(0)
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [studyDays, setStudyDays] = useState(0)
  const [replanCount, setReplanCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const today = todayStr()
      const todayStart = `${today}T00:00:00`
      const tomorrowStart = `${addDaysStr(today, 1)}T00:00:00`

      const [{ data: sessions }, { data: todaySessions }, { data: completedDays }, { data: plans }] = await Promise.all([
        // 전체 누적: 날짜 필터 없이 전체 세션
        supabase.from('milrim_study_sessions').select('duration_seconds'),
        // 오늘 누적: 오늘 00:00~내일 00:00 세션만
        supabase.from('milrim_study_sessions').select('duration_seconds').gte('started_at', todayStart).lt('started_at', tomorrowStart),
        supabase.from('milrim_plan_days').select('date').eq('status', 'complete'),
        supabase.from('milrim_plans').select('replan_count'),
      ])

      setTotalSeconds(sessions?.reduce((s, r) => s + (r.duration_seconds ?? 0), 0) ?? 0)
      setTodaySeconds(todaySessions?.reduce((s, r) => s + (r.duration_seconds ?? 0), 0) ?? 0)
      // 고유 날짜 수 — 같은 날 여러 플랜 완료 시 1일로 계산
      setStudyDays(new Set((completedDays ?? []).map(d => d.date)).size)
      setReplanCount(plans?.reduce((s, p) => s + (p.replan_count ?? 0), 0) ?? 0)
      setLoading(false)
    }
    fetchStats()
  }, [])

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
