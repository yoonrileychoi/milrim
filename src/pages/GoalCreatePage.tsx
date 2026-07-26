import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { todayStr, toDateStr } from '../lib/date'

const unitOptions = ['페이지', '문제', '강의', '시간', '기타']

type Distribution = 'even' | 'front' | 'back'
const distributionOptions: { value: Distribution; label: string; desc: string }[] = [
  { value: 'even', label: '고르게 (기본)', desc: '매일 비슷한 분량으로 나눠요' },
  { value: 'front', label: '초반집중', desc: '앞쪽을 더 많이, 뒤로 갈수록 가볍게' },
  { value: 'back', label: '후반집중', desc: '가볍게 시작해 뒤로 갈수록 늘려서' },
]

const timeOptions = [
  { label: '30분', value: 30 },
  { label: '1시간', value: 60 },
  { label: '2시간', value: 120 },
  { label: '3시간', value: 180 },
  { label: '4시간+', value: 240 },
]

const nearestTime = (m?: number) => {
  if (!m) return 60
  // 옵션 외 legacy 값은 가장 가까운 옵션으로 근사 매핑
  return timeOptions.reduce((best, o) =>
    Math.abs(o.value - m) < Math.abs(best - m) ? o.value : best, timeOptions[0].value)
}

interface EditState {
  planId?: string
  title?: string
  startDate?: string
  endDate?: string
  dailyMinutes?: number
  unit?: string
  totalAmount?: number
  distribution?: Distribution
}

export default function GoalCreatePage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user } = useAuth()
  const edit = (state ?? {}) as EditState
  const isEdit = !!edit.planId

  const today = todayStr()
  const maxDate = (() => { const d = new Date(); d.setMonth(d.getMonth() + 6); return toDateStr(d) })()

  const [goalText, setGoalText] = useState(edit.title || '')
  const [startDate, setStartDate] = useState(edit.startDate || today)
  const [endDate, setEndDate] = useState(edit.endDate || '')
  const [dailyMinutes, setDailyMinutes] = useState(nearestTime(edit.dailyMinutes))
  const [selectedUnit, setSelectedUnit] = useState(edit.unit || '페이지')
  const [totalAmount, setTotalAmount] = useState(edit.totalAmount?.toString() || '')
  const [distribution, setDistribution] = useState<Distribution>(edit.distribution || 'even')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dayCount = startDate && endDate
    ? Math.max(0, Math.round((new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000) + 1)
    : 0

  const handleSubmit = async () => {
    if (!goalText.trim()) return setError('목표명을 입력해주세요.')
    if (!endDate) return setError('목표 날짜를 입력해주세요.')
    if (endDate < startDate) return setError('종료일이 시작일보다 빠릅니다.')
    if (!totalAmount || parseInt(totalAmount) <= 0) return setError('학습량을 입력해주세요.')

    setLoading(true)
    setError('')

    const planData = {
      title: goalText.trim(),
      start_date: startDate,
      end_date: endDate,
      daily_minutes: dailyMinutes,
      unit: selectedUnit,
      total_amount: parseInt(totalAmount),
      distribution_pattern: distribution,
    }

    if (isEdit) {
      const { error: err } = await supabase.from('milrim_plans').update(planData).eq('id', edit.planId!)
      if (err) { setError('저장에 실패했어요. 다시 시도해주세요.'); setLoading(false); return }
      navigate('/plan/ai-loading', { state: { planId: edit.planId, ...planData, dailyMinutes: planData.daily_minutes, startDate: planData.start_date, endDate: planData.end_date, totalAmount: planData.total_amount, distribution } })
      return
    }

    const { data, error: err } = await supabase
      .from('milrim_plans')
      .insert({ user_id: user!.id, ...planData })
      .select('id')
      .single()

    if (err || !data) {
      setError('플랜 저장에 실패했어요. 다시 시도해주세요.')
      setLoading(false)
      return
    }

    navigate('/plan/ai-loading', {
      state: {
        planId: data.id,
        title: goalText.trim(),
        startDate,
        endDate,
        dailyMinutes,
        unit: selectedUnit,
        totalAmount: parseInt(totalAmount),
        distribution,
      },
    })
  }

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
          <div style={{ fontSize: 20, fontWeight: 800, color: '#2B2A26' }}>{isEdit ? '계획 수정하기' : '새 목표 만들기'}</div>
        </div>

        {/* 학습 목표명 */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 9 }}>어떤 목표인가요?</div>
          <div style={{
            background: '#fff', border: '1px solid #E2DCCB', borderRadius: 14,
            padding: '14px 16px',
          }}>
            <input
              value={goalText}
              onChange={e => setGoalText(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 15, fontWeight: 600, color: '#2B2A26', width: '100%' }}
            />
          </div>
          <div style={{ fontSize: 11.5, color: '#b3ad9d', marginTop: 6 }}>예: 영어 단어 외우기, 한국사 강의 완강, 수학 문제집 1권 끝내기</div>
        </div>

        {/* 목표일 */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 9 }}>언제까지 끝낼까요?</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, background: '#fff', border: '1px solid #E2DCCB', borderRadius: 14, padding: '14px 16px' }}>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={e => setStartDate(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 14, color: '#847f6f', width: '100%', cursor: 'pointer' }}
              />
            </div>
            <span className="ms" style={{ fontSize: 18, color: '#b3ad9d' }}>arrow_forward</span>
            <div style={{ flex: 1, background: '#fff', border: endDate ? '1px solid #2E5A3A' : '1px solid #E2DCCB', borderRadius: 14, padding: '14px 16px' }}>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={maxDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 14, color: endDate ? '#2B2A26' : '#b3ad9d', fontWeight: endDate ? 600 : 400, width: '100%', cursor: 'pointer' }}
              />
            </div>
          </div>
          {dayCount > 0 && (
            <div style={{ fontSize: 11.5, color: '#2E5A3A', marginTop: 6, fontWeight: 500 }}>총 {dayCount}일 동안 학습해요</div>
          )}
        </div>

        {/* 하루 학습 가능 시간 */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 9 }}>하루에 얼마나 공부할 수 있나요?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {timeOptions.map(t => (
              <div
                key={t.value}
                onClick={() => setDailyMinutes(t.value)}
                style={{
                  flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 12, cursor: 'pointer',
                  border: dailyMinutes === t.value ? '1.5px solid #2E5A3A' : '1px solid #E2DCCB',
                  background: dailyMinutes === t.value ? '#F0F5E6' : '#fff',
                  fontSize: 13, color: dailyMinutes === t.value ? '#2E5A3A' : '#847f6f',
                  fontWeight: dailyMinutes === t.value ? 700 : 400,
                  whiteSpace: 'nowrap',
                }}
              >{t.label}</div>
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
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 9 }}>전체 학습량은 얼마인가요?</div>
          <div style={{
            background: '#fff', border: '1px solid #E2DCCB', borderRadius: 14,
            padding: '14px 16px', display: 'flex', alignItems: 'baseline', gap: 6,
          }}>
            <input
              type="number"
              value={totalAmount}
              onChange={e => setTotalAmount(e.target.value)}
              min={1}
              placeholder="0"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 19, fontWeight: 800, color: '#2B2A26', width: 80 }}
            />
            {selectedUnit !== '기타' && <span style={{ fontSize: 14, color: '#847f6f' }}>{selectedUnit}</span>}
          </div>
        </div>

        {/* 학습량 배분 방식 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B2A26', marginBottom: 9 }}>학습량을 어떻게 나눌까요?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {distributionOptions.map(o => {
              const selected = distribution === o.value
              return (
                <div
                  key={o.value}
                  onClick={() => setDistribution(o.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    borderRadius: 13, padding: '13px 15px',
                    border: selected ? '1.5px solid #2E5A3A' : '1px solid #E2DCCB',
                    background: selected ? '#F0F5E6' : '#fff',
                  }}
                >
                  <span
                    className="ms"
                    style={{ fontSize: 20, color: selected ? '#2E5A3A' : '#c2bba8', flexShrink: 0 }}
                  >{selected ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: selected ? '#2E5A3A' : '#2B2A26' }}>{o.label}</div>
                    <div style={{ fontSize: 11.5, color: '#847f6f', marginTop: 2 }}>{o.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {error && (
          <div style={{ textAlign: 'center', fontSize: 13, color: '#B5524A', marginBottom: 12 }}>{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            border: 'none', background: loading ? '#6E9E4E' : '#2E5A3A', color: '#fff',
            fontSize: 16, fontWeight: 700, padding: 16, borderRadius: 15,
            fontFamily: 'var(--font)', cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <span className="ms" style={{ fontSize: 20 }}>auto_awesome</span>
          {loading ? '저장 중...' : isEdit ? 'AI로 계획 다시 생성하기' : 'AI로 계획 생성하기'}
        </button>
      </div>
    </div>
  )
}
