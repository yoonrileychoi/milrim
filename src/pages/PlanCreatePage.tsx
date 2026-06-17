import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Step = 'goal' | 'amount' | 'ai'

const subjects = ['수학', '영어', '국어', '과학', '사회', '역사', '기타']

export default function PlanCreatePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('goal')
  const [subject, setSubject] = useState('')
  const [goalText, setGoalText] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [dailyHours, setDailyHours] = useState('1')
  const [loading, setLoading] = useState(false)
  const [aiDone, setAiDone] = useState(false)

  const handleGenerateAI = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setAiDone(true) }, 2000)
  }

  const stepIndex = step === 'goal' ? 0 : step === 'amount' ? 1 : 2

  const remainDays = targetDate
    ? Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="app-shell" style={{ paddingTop: 0 }}>
      <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-wash)' }}>
        <button
          onClick={() => step === 'goal' ? navigate('/plan') : setStep(s => s === 'amount' ? 'goal' : 'amount')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--color-ink-45)', margin: '0 0 2px' }}>새 목표 만들기 ({stepIndex + 1}/3)</p>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
            {step === 'goal' ? '목표 설정' : step === 'amount' ? '학습량 설정' : 'AI 계획 생성'}
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '12px 20px', gap: 4 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= stepIndex ? 'var(--color-pigment)' : 'var(--color-wash)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {step === 'goal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: 8 }}>과목 선택</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {subjects.map(s => (
                  <button key={s} onClick={() => setSubject(s)} style={{
                    padding: '8px 14px', borderRadius: 8, border: '1.5px solid',
                    borderColor: subject === s ? 'var(--color-pigment)' : 'var(--color-wash)',
                    background: subject === s ? 'color-mix(in srgb, var(--color-pigment) 10%, transparent)' : 'white',
                    color: subject === s ? 'var(--color-pigment)' : 'var(--color-ink-70)',
                    fontSize: 13, fontWeight: subject === s ? 600 : 400, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: 8 }}>목표</label>
              <input value={goalText} onChange={e => setGoalText(e.target.value)}
                placeholder="예: 수능 수학 1등급 달성"
                style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1.5px solid var(--color-wash)', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--color-ink)', background: 'white', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: 8 }}>목표일</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1.5px solid var(--color-wash)', fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--color-ink)', background: 'white', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
        )}

        {step === 'amount' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'var(--color-wash)', borderRadius: 12, padding: '14px', marginBottom: 4 }}>
              <p style={{ fontSize: 13, color: 'var(--color-ink-70)', margin: 0 }}>
                <strong style={{ color: 'var(--color-pigment)' }}>{subject} — {goalText}</strong><br />
                {targetDate && `목표일: ${new Date(targetDate).toLocaleDateString('ko-KR')}`}
              </p>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', display: 'block', marginBottom: 8 }}>하루 목표 학습 시간</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="range" min="0.5" max="8" step="0.5" value={dailyHours}
                  onChange={e => setDailyHours(e.target.value)}
                  style={{ flex: 1, accentColor: 'var(--color-pigment)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, color: 'var(--color-pigment)', minWidth: 48, textAlign: 'right' }}>
                  {dailyHours}시간
                </span>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 12, padding: '16px', boxShadow: 'var(--shadow-soft)' }}>
              <p style={{ fontSize: 12, color: 'var(--color-ink-45)', margin: '0 0 8px' }}>예상 일정</p>
              <p style={{ fontSize: 14, color: 'var(--color-ink)', margin: 0, lineHeight: 1.6 }}>
                매일 <strong style={{ color: 'var(--color-pigment)' }}>{dailyHours}시간</strong> 학습 시<br />
                AI가 목표일에 맞춰 최적화된 계획을 생성합니다
              </p>
            </div>
          </div>
        )}

        {step === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--color-wash)',
                  borderTopColor: 'var(--color-pigment)', animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 16px',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                <p style={{ fontSize: 14, color: 'var(--color-ink-70)', margin: 0 }}>AI가 최적의 계획을 생성 중이에요...</p>
              </div>
            ) : aiDone ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'color-mix(in srgb, var(--color-pigment) 8%, transparent)', borderRadius: 12, padding: '14px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-pigment)" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  <p style={{ fontSize: 14, color: 'var(--color-pigment)', fontWeight: 600, margin: 0 }}>계획이 생성됐어요!</p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-ink-70)', margin: 0, lineHeight: 1.6 }}>
                  {subject} 목표를 위한 {remainDays}일 계획이 생성됐습니다. 매일 조금씩 꾸준히 해봐요.
                </p>
                {[1, 2, 3].map(week => (
                  <div key={week} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', boxShadow: 'var(--shadow-soft)' }}>
                    <p style={{ fontSize: 12, color: 'var(--color-ink-45)', margin: '0 0 6px', fontWeight: 600 }}>{week}주차</p>
                    <p style={{ fontSize: 14, color: 'var(--color-ink)', margin: 0 }}>
                      {week === 1 ? '기초 개념 정리 및 핵심 공식 암기' : week === 2 ? '유형별 문제풀이 & 오답 분석' : '실전 모의고사 및 취약점 보완'}
                    </p>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18, background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.8">
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" /><path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <p style={{ fontSize: 15, color: 'var(--color-ink)', margin: '0 0 6px', fontWeight: 600 }}>AI 계획 생성 준비됨</p>
                <p style={{ fontSize: 13, color: 'var(--color-ink-45)', margin: 0 }}>버튼을 눌러 맞춤 학습 계획을 생성하세요</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--color-wash)' }}>
        {step === 'goal' && (
          <button
            onClick={() => setStep('amount')}
            disabled={!subject || !goalText || !targetDate}
            style={{
              width: '100%', padding: '16px', borderRadius: 12, border: 'none',
              background: subject && goalText && targetDate ? 'var(--color-pigment)' : 'var(--color-wash)',
              color: subject && goalText && targetDate ? 'white' : 'var(--color-ink-45)',
              fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-sans)',
              cursor: subject && goalText && targetDate ? 'pointer' : 'not-allowed',
            }}>
            다음 →
          </button>
        )}
        {step === 'amount' && (
          <button
            onClick={() => setStep('ai')}
            style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: 'var(--color-pigment)', color: 'white', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>
            다음 →
          </button>
        )}
        {step === 'ai' && !aiDone && !loading && (
          <button onClick={handleGenerateAI} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: 'var(--color-accent)', color: 'white', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>
            ✨ AI 계획 생성하기
          </button>
        )}
        {step === 'ai' && aiDone && (
          <button onClick={() => navigate('/plan')} style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: 'var(--color-pigment)', color: 'white', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>
            플랜 목록으로 →
          </button>
        )}
      </div>
    </div>
  )
}
