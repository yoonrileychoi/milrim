import Layout from '../components/Layout'

const weekDays = ['월', '화', '수', '목', '금', '토', '일']
const weekData = [45, 90, 30, 120, 75, 0, 60]
const maxVal = Math.max(...weekData)

const monthHeatmap = Array.from({ length: 30 }, (_, i) => {
  const seed = (i * 37 + 13) % 10
  return {
    day: i + 1,
    value: seed > 3 ? (seed % 4) : 0,
  }
})

export default function StatsPage() {
  const totalMinutes = weekData.reduce((a, b) => a + b, 0)
  const activeDays = weekData.filter(v => v > 0).length
  const avgMinutes = Math.round(totalMinutes / activeDays)

  return (
    <Layout>
      <div style={{ paddingTop: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
          학습 통계
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: '이번 주 총 학습', value: `${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분`, color: 'var(--color-pigment)' },
            { label: '하루 평균', value: `${avgMinutes}분`, color: 'var(--color-accent)' },
            { label: '연속 학습일', value: '3일', color: '#2E8B57' },
            { label: '이번 달 달성률', value: '68%', color: 'var(--color-ink)' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'white', borderRadius: 14, padding: '16px', boxShadow: 'var(--shadow-soft)' }}>
              <p style={{ fontSize: 11, color: 'var(--color-ink-45)', margin: '0 0 6px' }}>{stat.label}</p>
              <p style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: stat.color, margin: 0 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-card)', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 16px' }}>이번 주 학습 시간</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 100 }}>
            {weekDays.map((day, i) => (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', position: 'relative', height: 80, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    height: `${maxVal > 0 ? (weekData[i] / maxVal) * 100 : 0}%`,
                    minHeight: weekData[i] > 0 ? 4 : 0,
                    background: i === new Date().getDay() - 1 ? 'var(--color-pigment)' : 'var(--color-wash)',
                    transition: 'height 0.5s ease',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--color-ink-45)', fontFamily: 'var(--font-mono)' }}>{day}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-card)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 16px' }}>6월 학습 캘린더</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {['월', '화', '수', '목', '금', '토', '일'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--color-ink-45)', paddingBottom: 4, fontFamily: 'var(--font-mono)' }}>{d}</div>
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`pad-${i}`} style={{ aspectRatio: '1', borderRadius: 4 }} />
            ))}
            {monthHeatmap.map(({ day, value }) => (
              <div
                key={day}
                title={`${day}일: ${value > 0 ? ['30분 미만', '30-60분', '1-2시간', '2시간+'][value - 1] : '미학습'}`}
                style={{
                  aspectRatio: '1', borderRadius: 4,
                  background:
                    value === 0 ? 'var(--color-wash)'
                    : value === 1 ? 'color-mix(in srgb, var(--color-pigment) 25%, white)'
                    : value === 2 ? 'color-mix(in srgb, var(--color-pigment) 50%, white)'
                    : value === 3 ? 'color-mix(in srgb, var(--color-pigment) 75%, white)'
                    : 'var(--color-pigment)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: value >= 3 ? 'white' : 'var(--color-ink-45)',
                }}>
                {day}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 11, color: 'var(--color-ink-45)' }}>적음</span>
            {[0.25, 0.5, 0.75, 1].map(v => (
              <div key={v} style={{ width: 14, height: 14, borderRadius: 3, background: `color-mix(in srgb, var(--color-pigment) ${v * 100}%, white)` }} />
            ))}
            <span style={{ fontSize: 11, color: 'var(--color-ink-45)' }}>많음</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}
