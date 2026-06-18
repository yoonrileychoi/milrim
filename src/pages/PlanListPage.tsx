import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const mockPlans = [
  { id: '1', name: '데이터베이스 시스템공학 A+', dateRange: '6/18 ~ 6/30', remain: '남은 12일', progress: 84, totalUnit: '500p', doneUnit: '420p', replanCount: 3 },
  { id: '2', name: '토익 900', dateRange: '6/10 ~ 7/08', remain: '남은 20일', progress: 52, totalUnit: '50개', doneUnit: '26개', replanCount: 1 },
  { id: '3', name: '정보처리기사 필기', dateRange: '완료', remain: '5/02 완료', progress: 100, totalUnit: '320p', doneUnit: '320p', replanCount: 0, done: true },
]

export default function PlanListPage() {
  const navigate = useNavigate()

  return (
    <Layout title="나의 플랜">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {mockPlans.map(plan => (
          <div
            key={plan.id}
            onClick={() => navigate(`/plan/${plan.id}`)}
            style={{
              background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: 22,
              cursor: 'pointer', opacity: plan.done ? 0.72 : 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: plan.done ? '#6B6757' : '#2B2A26' }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: '#9a9482', marginTop: 4 }}>{plan.dateRange} · 남은 {plan.remain}</div>
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, color: plan.progress === 100 ? '#9CC36B' : '#2E5A3A' }}>{plan.progress}%</div>
            </div>
            <div style={{ height: 9, background: '#EDE7D7', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${plan.progress}%`, height: '100%',
                background: plan.progress === 100 ? '#9CC36B' : 'linear-gradient(90deg, #9CC36B, #2E5A3A)',
                borderRadius: 6,
              }} />
            </div>
            <div style={{ fontSize: 11.5, color: '#9a9482', marginTop: 10 }}>
              {plan.doneUnit} / {plan.totalUnit} · 재계획 {plan.replanCount}회
            </div>
          </div>
        ))}

        <div
          onClick={() => navigate('/plan/new')}
          style={{
            border: '1.5px dashed #D8CFB8', borderRadius: 20, padding: 22,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, color: '#9a9482', cursor: 'pointer', minHeight: 150,
          }}
        >
          <span className="ms" style={{ fontSize: 30 }}>add_circle</span>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>새 목표 추가</div>
        </div>
      </div>
    </Layout>
  )
}
