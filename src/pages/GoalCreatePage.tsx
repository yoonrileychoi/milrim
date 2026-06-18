import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const timeOptions = ['30분', '1시간', '2시간', '3시간', '4시간 이상']
const unitOptions = ['페이지', '문제', '강의', '기타']

export default function GoalCreatePage() {
  const navigate = useNavigate()
  const [goalText, setGoalText] = useState('데이터베이스 시스템공학 A+')
  const [startDate] = useState('2025. 06. 18')
  const [endDate] = useState('2025. 06. 30')
  const [selectedTime, setSelectedTime] = useState('2시간')
  const [selectedUnit, setSelectedUnit] = useState('페이지')
  const [totalAmount, setTotalAmount] = useState('500')

  const dayCount = 12

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, overflowY: 'auto', background: '#F4F2EA',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '26px 24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div
            onClick={() => navigate('/plan')}
            style={{
              width: 38, height: 38, borderRadius: 11, background: '#fff',
              border: '1px solid #E7E1D3', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#6B6757', cursor: 'pointer',
            }}
          >
            <span className="ms" style={{ fontSize: 22 }}>arrow_back</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#2B2A26' }}>새 목표 만들기</div>
        </div>

        {/* 학습 목표명 */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 9 }}>학습 목표명을 입력하세요</div>
          <div style={{
            background: '#fff', border: '1px solid #E2DCCB', borderRadius: 14,
            padding: '14px 16px', fontSize: 15, color: '#2B2A26', fontWeight: 600,
            display: 'flex', alignItems: 'center',
          }}>
            <input
              value={goalText}
              onChange={e => setGoalText(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 15, fontWeight: 600, color: '#2B2A26', width: '100%' }}
              placeholder="예: 데이터베이스 시스템공학 A+, 토익 900, 운전면허 취득"
            />
          </div>
          <div style={{ fontSize: 11.5, color: '#b3ad9d', marginTop: 6 }}>예: 데이터베이스 시스템공학 A+, 토익 900, 운전면허 취득</div>
        </div>

        {/* 목표일 */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 9 }}>언제까지 목표인가요?</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, background: '#fff', border: '1px solid #E2DCCB', borderRadius: 14, padding: '14px 16px', fontSize: 14, color: '#847f6f' }}>{startDate}</div>
            <span className="ms" style={{ fontSize: 18, color: '#b3ad9d' }}>arrow_forward</span>
            <div style={{ flex: 1, background: '#fff', border: '1px solid #2E5A3A', borderRadius: 14, padding: '14px 16px', fontSize: 14, color: '#2B2A26', fontWeight: 600 }}>{endDate}</div>
          </div>
          <div style={{ fontSize: 11.5, color: '#2E5A3A', marginTop: 6, fontWeight: 500 }}>총 {dayCount}일 남았습니다</div>
        </div>

        {/* 하루 학습 가능 시간 */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 9 }}>하루 학습 가능 시간은?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {timeOptions.map(t => (
              <div
                key={t}
                onClick={() => setSelectedTime(t)}
                style={{
                  padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                  border: selectedTime === t ? '1.5px solid #2E5A3A' : '1px solid #E2DCCB',
                  background: selectedTime === t ? '#F0F5E6' : '#fff',
                  fontSize: 13.5, color: selectedTime === t ? '#2E5A3A' : '#847f6f',
                  fontWeight: selectedTime === t ? 700 : 400,
                }}
              >{t}</div>
            ))}
          </div>
        </div>

        {/* 학습 단위 */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 9 }}>학습 단위를 골라주세요</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {unitOptions.map(u => (
              <div
                key={u}
                onClick={() => setSelectedUnit(u)}
                style={{
                  flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 12, cursor: 'pointer',
                  border: selectedUnit === u ? '1.5px solid #2E5A3A' : '1px solid #E2DCCB',
                  background: selectedUnit === u ? '#F0F5E6' : '#fff',
                  fontSize: 13.5, color: selectedUnit === u ? '#2E5A3A' : '#847f6f',
                  fontWeight: selectedUnit === u ? 700 : 400,
                }}
              >{u}</div>
            ))}
          </div>
        </div>

        {/* 전체 학습량 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 9 }}>전체 학습량을 입력하세요</div>
          <div style={{
            background: '#fff', border: '1px solid #E2DCCB', borderRadius: 14,
            padding: '14px 16px', display: 'flex', alignItems: 'baseline', gap: 6,
          }}>
            <input
              type="number"
              value={totalAmount}
              onChange={e => setTotalAmount(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 19, fontWeight: 800, color: '#2B2A26', width: 80 }}
            />
            <span style={{ fontSize: 14, color: '#847f6f' }}>{selectedUnit}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/plan/ai-loading')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            border: 'none', background: '#2E5A3A', color: '#fff',
            fontSize: 16, fontWeight: 700, padding: 16, borderRadius: 15,
            fontFamily: 'var(--font)', cursor: 'pointer',
          }}
        >
          <span className="ms" style={{ fontSize: 20 }}>auto_awesome</span>
          AI로 계획 생성하기
        </button>
      </div>
    </div>
  )
}
