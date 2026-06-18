import { useNavigate } from 'react-router-dom'

const weekPlans = [
  { week: '1주차', bg: '#2E5A3A', content: '1~2장 SQL 기초', range: '6/18 ~ 6/22', amount: '210p' },
  { week: '2주차', bg: '#6E9E4E', content: '연습문제 + 뷰 정리', range: '6/23 ~ 6/27', amount: '200p' },
  { week: '3주차', bg: '#9CC36B', content: '전체 복습 + 모의시험', range: '6/28 ~ 6/30', amount: '90p' },
]

const dailyPlans = [
  { date: '6/18', content: 'SQL 기초 1장', amount: '42p' },
  { date: '6/19', content: 'SQL 기초 2장', amount: '42p' },
  { date: '6/20', content: '뷰와 트리거 정리', amount: '15p' },
]

export default function PlanResultPage() {
  const navigate = useNavigate()

  return (
    <div className="fade-in" style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: '#F4F2EA' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '30px 24px 40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0F5E6', color: '#2E5A3A', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, marginBottom: 12 }}>
          <span className="ms" style={{ fontSize: 15 }}>auto_awesome</span>
          계획 생성 완료
        </div>
        <div style={{ fontSize: 23, fontWeight: 800, color: '#2B2A26', lineHeight: 1.3 }}>
          데이터베이스 시스템공학 A+ 목표를<br />12일 계획으로 시작합니다
        </div>

        {/* summary cards */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          {[
            { label: '하루 학습량', value: '42p' },
            { label: '최소 달성', value: '6p', color: '#2E5A3A' },
            { label: '전체 학습량', value: '500p' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #EFEADD', borderRadius: 16, padding: 14 }}>
              <div style={{ fontSize: 11.5, color: '#9a9482' }}>{s.label}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: s.color || '#2B2A26', marginTop: 3 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* weekly plan */}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#2B2A26', margin: '22px 2px 11px' }}>주차별 계획</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {weekPlans.map(w => (
            <div key={w.week} style={{ background: '#fff', border: '1px solid #EFEADD', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: w.bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{w.week}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2B2A26' }}>{w.content}</div>
                <div style={{ fontSize: 12, color: '#9a9482', marginTop: 2 }}>{w.range} · {w.amount}</div>
              </div>
            </div>
          ))}
        </div>

        {/* daily plan */}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#2B2A26', margin: '22px 2px 11px' }}>일간 계획</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dailyPlans.map(d => (
            <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #EFEADD', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2E5A3A', width: 44, flexShrink: 0 }}>{d.date}</div>
              <div style={{ flex: 1, fontSize: 13.5, color: '#2B2A26', fontWeight: 500 }}>{d.content}</div>
              <div style={{ fontSize: 12, color: '#9a9482' }}>{d.amount}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/home')}
          style={{
            width: '100%', border: 'none', background: '#2E5A3A', color: '#fff',
            fontSize: 16, fontWeight: 700, padding: 16, borderRadius: 15,
            fontFamily: 'var(--font)', cursor: 'pointer', marginTop: 24,
          }}
        >
          내 계획으로 시작하기
        </button>
      </div>
    </div>
  )
}
