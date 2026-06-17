import { useNavigate } from 'react-router-dom'

const mockTasks = [
  { date: '06-18', content: '미적분 3단원 개념 정리', done: true, time: 40 },
  { date: '06-18', content: '기본 문제 10문제', done: true, time: 20 },
  { date: '06-19', content: '미적분 4단원 개념 정리', done: false, time: 50 },
  { date: '06-20', content: '유형별 문제 풀이', done: false, time: 60 },
  { date: '06-21', content: '오답 분석 및 복습', done: false, time: 45 },
]

export default function PlanDetailPage() {
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-wash)', background: 'white' }}>
        <button onClick={() => navigate('/plan')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--color-ink)', margin: 0, letterSpacing: '-0.02em' }}>
          수학 — 수능 1등급
        </h1>
      </div>

      <div style={{ padding: '20px', flex: 1, overflow: 'auto', paddingBottom: 32 }}>
        <div style={{ background: 'var(--color-pigment)', borderRadius: 16, padding: '20px', color: 'white', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 12, opacity: 0.8, margin: '0 0 4px' }}>전체 진행률</p>
              <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', margin: 0 }}>42%</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, opacity: 0.8, margin: '0 0 4px' }}>목표일까지</p>
              <p style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-mono)', margin: 0 }}>D-87</p>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '42%', background: 'var(--color-accent)', borderRadius: 4 }} />
          </div>
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 12px' }}>학습 일정</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mockTasks.map((task, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              background: 'white', borderRadius: 12, padding: '14px 16px',
              boxShadow: 'var(--shadow-soft)', opacity: task.done ? 0.55 : 1,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: task.done ? 'var(--color-pigment)' : 'transparent',
                border: task.done ? 'none' : '1.5px solid var(--color-wash)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
              }}>
                {task.done && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2"><polyline points="2,6 5,9 10,3" /></svg>}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, color: 'var(--color-ink-45)', margin: '0 0 3px', fontFamily: 'var(--font-mono)' }}>
                  {new Date(`2026-${task.date}`).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </p>
                <p style={{ fontSize: 14, color: 'var(--color-ink)', margin: 0, textDecoration: task.done ? 'line-through' : 'none' }}>
                  {task.content}
                </p>
              </div>
              <span style={{ fontSize: 12, color: 'var(--color-ink-45)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                {task.time}분
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
