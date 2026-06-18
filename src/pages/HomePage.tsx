import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const mockGoals = [
  {
    id: '1', name: '데이터베이스 시스템공학 A+', progress: 84, unit: 'p',
    todayDone: 95, todayRemain: 50, total: 500, totalDone: 420,
    minGoal: 6, dailyTime: 12, replanCount: 3,
    color1: '#2E5A3A', color2: '#3C6B45',
  },
  {
    id: '2', name: '토익 900', progress: 52, unit: '개',
    todayDone: 2, todayRemain: 70, total: 50, totalDone: 26,
    minGoal: 1, dailyTime: 20, replanCount: 1,
    color1: '#3A4F2C', color2: '#4E6B3A',
  },
]

const mockTasks = [
  { id: 1, goalName: '데이터베이스 시스템공학 A+', content: '2장 SQL 기본 30p', done: true },
  { id: 2, goalName: '데이터베이스 시스템공학 A+', content: '연습문제 20문제', done: true },
  { id: 3, goalName: '데이터베이스 시스템공학 A+', content: '뷰와 트리거 정리 15p', done: false },
  { id: 4, goalName: '토익 900', content: 'LC 파트3 듣기 2개', done: false },
]

function CircleProgress({ pct, size = 84 }: { pct: number; size?: number }) {
  const r = size * 0.405
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={9} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#C2E098" strokeWidth={9}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 21, fontWeight: 800 }}>{pct}<span style={{ fontSize: 11 }}>%</span></div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const doneCount = mockTasks.filter(t => t.done).length

  return (
    <Layout title="오늘도 한 걸음씩">
      {/* Goal cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {mockGoals.map(g => (
          <div key={g.id} style={{
            background: `linear-gradient(150deg, ${g.color1} 0%, ${g.color2} 100%)`,
            borderRadius: 22, padding: '22px 24px', color: '#fff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.82, fontWeight: 500 }}>{g.name}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 8 }}>
                  <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1 }}>
                    {g.todayDone}<span style={{ fontSize: 18 }}>{g.unit}</span>
                  </div>
                  <div style={{ fontSize: 12.5, opacity: 0.8, marginBottom: 5 }}>오늘 · 약 {g.todayRemain}분</div>
                </div>
                <div style={{ fontSize: 12.5, opacity: 0.78, marginTop: 7 }}>전체 {g.total}{g.unit} 중 {g.totalDone}{g.unit} 완료</div>
              </div>
              <CircleProgress pct={g.progress} />
            </div>
            <div style={{ display: 'flex', marginTop: 16, paddingTop: 15, borderTop: '1px solid rgba(255,255,255,0.16)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, opacity: 0.78 }}>최소 달성</div>
                <div style={{ fontSize: 15.5, fontWeight: 700, marginTop: 3 }}>{g.minGoal}{g.unit}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, opacity: 0.78 }}>누적 학습 시간</div>
                <div style={{ fontSize: 15.5, fontWeight: 700, marginTop: 3 }}>{g.dailyTime}일</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, opacity: 0.78 }}>이어간 횟수</div>
                <div style={{ fontSize: 15.5, fontWeight: 700, marginTop: 3 }}>{g.replanCount}회</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's tasks + encouragement */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 22, padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16.5, fontWeight: 700, color: '#2B2A26' }}>오늘 할 일</div>
            <div style={{ fontSize: 12.5, color: '#2E5A3A', fontWeight: 700, background: '#F0F5E6', padding: '5px 12px', borderRadius: 20 }}>
              {doneCount} / {mockTasks.length} 완료
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mockTasks.map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px',
                border: `1px solid ${task.done ? '#EFEADD' : '#DDE8CE'}`,
                borderRadius: 15,
                background: task.done ? '#fff' : '#FCFBF7',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                  background: task.done ? '#2E5A3A' : 'transparent',
                  border: task.done ? 'none' : '2px solid #C9C7BC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>
                  {task.done && <span className="ms" style={{ fontSize: 16, fontVariationSettings: "'wght' 400" }}>check</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: '#a8a292', fontWeight: 600 }}>{task.goalName}</div>
                  <div style={{
                    fontSize: 14.5, fontWeight: 600,
                    color: task.done ? '#b3ad9d' : '#2B2A26',
                    textDecoration: task.done ? 'line-through' : 'none',
                  }}>{task.content}</div>
                </div>
                {!task.done && (
                  <button
                    onClick={() => navigate('/timer')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, border: 'none',
                      background: '#2E5A3A', color: '#fff', fontSize: 12.5, fontWeight: 700,
                      padding: '9px 13px', borderRadius: 10, fontFamily: 'var(--font)', cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <span className="ms" style={{ fontSize: 16, fontVariationSettings: "'wght' 400" }}>play_arrow</span>
                    시작
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, background: '#F0F5E6', borderRadius: 22, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E5A3A' }}>
            <span className="ms" style={{ fontSize: 28 }}>eco</span>
          </div>
          <div style={{ fontSize: 16, color: '#3E5C42', lineHeight: 1.65, fontWeight: 600 }}>
            포기하지만 않으면 괜찮아요. 밀린 계획은 AI가 다시 함께 정리해드릴게요.
          </div>
        </div>
      </div>
    </Layout>
  )
}
