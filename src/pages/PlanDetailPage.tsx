import { useNavigate } from 'react-router-dom'

const dailyTasks = [
  { date: '6/18', content: 'SQL 기초 1장 42p', done: true },
  { date: '6/19', content: 'SQL 기초 2장 42p', done: true },
  { date: '오늘', content: '뷰와 트리거 정리 15p', done: false, current: true },
  { date: '6/21', content: '연습문제 풀기 42p', done: false },
]

export default function PlanDetailPage() {
  const navigate = useNavigate()

  return (
    <div className="fade-in" style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: '#F4F2EA' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '26px 24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div
            onClick={() => navigate('/plan')}
            style={{ width: 38, height: 38, borderRadius: 11, background: '#fff', border: '1px solid #E7E1D3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6757', cursor: 'pointer' }}
          >
            <span className="ms" style={{ fontSize: 22 }}>arrow_back</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#2B2A26' }}>계획 상세</div>
        </div>

        {/* header card */}
        <div style={{ background: 'linear-gradient(150deg, #2E5A3A 0%, #3C6B45 100%)', borderRadius: 22, padding: 22, color: '#fff' }}>
          <div style={{ fontSize: 19, fontWeight: 800 }}>데이터베이스 시스템공학 A+</div>
          <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 5 }}>2025. 06. 18 ~ 06. 30 · 페이지 단위</div>
          <div style={{ display: 'flex', gap: 26, marginTop: 16 }}>
            <div><div style={{ fontSize: 11, opacity: 0.78 }}>진행률</div><div style={{ fontSize: 17, fontWeight: 700 }}>84%</div></div>
            <div><div style={{ fontSize: 11, opacity: 0.78 }}>전체 학습량</div><div style={{ fontSize: 17, fontWeight: 700 }}>500p</div></div>
            <div><div style={{ fontSize: 11, opacity: 0.78 }}>하루 시간</div><div style={{ fontSize: 17, fontWeight: 700 }}>2시간</div></div>
          </div>
        </div>

        {/* daily tasks */}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#2B2A26', margin: '20px 2px 11px' }}>일자별 계획</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dailyTasks.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, background: '#fff',
              border: t.current ? '1.5px solid #2E5A3A' : '1px solid #EFEADD',
              borderRadius: 14, padding: '12px 14px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.done ? '#9CC36B' : t.current ? '#2E5A3A' : '#c2bba8', width: 44, flexShrink: 0 }}>{t.date}</div>
              <div style={{
                flex: 1, fontSize: 13.5, color: t.done ? '#b3ad9d' : '#2B2A26',
                fontWeight: t.current ? 600 : 500,
                textDecoration: t.done ? 'line-through' : 'none',
              }}>{t.content}</div>
              {t.done && <span className="ms" style={{ fontSize: 18, color: '#9CC36B' }}>check_circle</span>}
              {t.current && <div style={{ fontSize: 11, color: '#9a9482' }}>진행중</div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            onClick={() => navigate('/plan/ai-loading')}
            style={{ flex: 1, border: '1px solid #2E5A3A', background: '#fff', color: '#2E5A3A', fontSize: 14, fontWeight: 700, padding: 14, borderRadius: 14, fontFamily: 'var(--font)', cursor: 'pointer' }}
          >
            계획 수정
          </button>
          <button
            onClick={() => navigate('/plan')}
            style={{ border: '1px solid #E2C9C2', background: '#fff', color: '#B5524A', fontSize: 14, fontWeight: 600, padding: '14px 18px', borderRadius: 14, fontFamily: 'var(--font)', cursor: 'pointer' }}
          >
            삭제
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: '#b3ad9d', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
          목표일·학습량·시간을 수정하면 AI가 다시 계획을 만들어요
        </div>
      </div>
    </div>
  )
}
