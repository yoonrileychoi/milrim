import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'

const mockTasks = [
  { id: 1, subject: '수학', content: '미적분 3단원 개념 정리', done: true, time: 40 },
  { id: 2, subject: '영어', content: '독해 지문 3개 풀기', done: false, time: 30 },
  { id: 3, subject: '국어', content: '문학 작품 분석 노트 작성', done: false, time: 50 },
]

const TIMER_SEC = 25 * 60

export default function HomePage() {
  const [tasks, setTasks] = useState(mockTasks)
  const [timerRunning, setTimerRunning] = useState(false)
  const [seconds, setSeconds] = useState(TIMER_SEC)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const today = new Date()
  const dateStr = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { setTimerRunning(false); clearInterval(intervalRef.current!); return TIMER_SEC }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
    }
    return () => clearInterval(intervalRef.current!)
  }, [timerRunning])

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  const doneCount = tasks.filter(t => t.done).length
  const progress = Math.round((doneCount / tasks.length) * 100)

  const subjectColors: Record<string, string> = {
    '수학': 'var(--color-pigment)', '영어': '#2E8B57', '국어': '#8B4513',
    '과학': '#2E6B8B', '사회': '#6B2E8B',
  }

  return (
    <Layout>
      <div style={{ paddingTop: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: 'var(--color-ink-45)', margin: '0 0 4px', fontFamily: 'var(--font-mono)' }}>{dateStr}</p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', margin: 0, letterSpacing: '-0.02em' }}>
            오늘도 한 걸음씩 🌿
          </h1>
        </div>

        <div style={{ background: 'var(--color-pigment)', borderRadius: 16, padding: '20px', marginBottom: 16, color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 12, opacity: 0.8, margin: '0 0 4px' }}>오늘의 달성률</p>
              <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', margin: 0 }}>{progress}%</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, opacity: 0.8, margin: '0 0 4px' }}>완료 / 전체</p>
              <p style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-mono)', margin: 0 }}>{doneCount}/{tasks.length}</p>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--color-accent)', borderRadius: 4, transition: 'width 0.6s ease' }} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--color-ink-45)', margin: '0 0 4px' }}>뽀모도로 타이머</p>
            <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', margin: 0 }}>
              {mins}:{secs}
            </p>
          </div>
          <button
            onClick={() => { if (!timerRunning) setSeconds(TIMER_SEC); setTimerRunning(r => !r) }}
            style={{
              width: 52, height: 52, borderRadius: '50%', border: 'none',
              background: timerRunning ? 'var(--color-ink)' : 'var(--color-pigment)',
              color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {timerRunning
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
            }
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>오늘의 계획</h2>
            <span style={{ fontSize: 12, color: 'var(--color-ink-45)', fontFamily: 'var(--font-mono)' }}>
              {tasks.reduce((acc, t) => acc + t.time, 0)}분
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'white', borderRadius: 12, padding: '14px 16px',
                  boxShadow: 'var(--shadow-soft)', cursor: 'pointer',
                  opacity: task.done ? 0.6 : 1, transition: 'all 0.2s',
                }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: task.done ? 'var(--color-pigment)' : 'transparent',
                  border: task.done ? 'none' : '1.5px solid var(--color-wash)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {task.done && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2"><polyline points="2,6 5,9 10,3" /></svg>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: subjectColors[task.subject] || 'var(--color-pigment)',
                      background: `color-mix(in srgb, ${subjectColors[task.subject] || 'var(--color-pigment)'} 12%, transparent)`,
                      borderRadius: 4, padding: '1px 6px',
                    }}>{task.subject}</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--color-ink)', margin: 0, textDecoration: task.done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

        <button style={{
          width: '100%', padding: '14px', borderRadius: 12,
          border: '1.5px dashed var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
          color: 'var(--color-ink)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
            <path d="M12 2a10 10 0 0 1 0 20" /><path d="M12 2a10 10 0 0 0 0 20" /><path d="M12 6v6l4 2" />
          </svg>
          밀렸나요? AI가 재계획할게요
        </button>
      </div>
    </Layout>
  )
}
