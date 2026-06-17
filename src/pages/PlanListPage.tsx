import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const mockPlans = [
  { id: '1', subject: '수학', goal: '수능 수학 1등급', targetDate: '2026-11-15', progress: 42, remainDays: 87, color: 'var(--color-pigment)' },
  { id: '2', subject: '영어', goal: '토익 900점 달성', targetDate: '2026-09-01', progress: 68, remainDays: 23, color: '#2E8B57' },
]

export default function PlanListPage() {
  const navigate = useNavigate()
  const [plans] = useState(mockPlans)

  return (
    <Layout>
      <div style={{ paddingTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', margin: 0, letterSpacing: '-0.02em' }}>
            나의 플랜
          </h1>
          <button
            onClick={() => navigate('/plan/new')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--color-pigment)', border: 'none', borderRadius: 10, padding: '8px 14px',
              color: 'white', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer',
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            새 목표
          </button>
        </div>

        {plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-ink-45)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-wash)" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p style={{ fontSize: 15, margin: '0 0 6px', color: 'var(--color-ink-70)' }}>아직 플랜이 없어요</p>
            <p style={{ fontSize: 13 }}>새 목표를 추가해보세요</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {plans.map(plan => (
              <div
                key={plan.id}
                onClick={() => navigate(`/plan/${plan.id}`)}
                style={{
                  background: 'white', borderRadius: 16, padding: '20px',
                  boxShadow: 'var(--shadow-card)', cursor: 'pointer',
                  borderLeft: `4px solid ${plan.color}`,
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: plan.color,
                      background: `color-mix(in srgb, ${plan.color} 12%, transparent)`,
                      borderRadius: 4, padding: '2px 8px', display: 'inline-block', marginBottom: 6,
                    }}>{plan.subject}</span>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>{plan.goal}</h3>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-45)" strokeWidth="1.8">
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--color-ink-45)', margin: '0 0 2px' }}>목표일</p>
                    <p style={{ fontSize: 13, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                      {new Date(plan.targetDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--color-ink-45)', margin: '0 0 2px' }}>남은 기간</p>
                    <p style={{ fontSize: 13, color: plan.remainDays < 30 ? '#E53E3E' : 'var(--color-ink)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                      D-{plan.remainDays}
                    </p>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-ink-45)' }}>전체 진행률</span>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: plan.color, fontWeight: 600 }}>{plan.progress}%</span>
                  </div>
                  <div style={{ background: 'var(--color-wash)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${plan.progress}%`, background: plan.color, borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
