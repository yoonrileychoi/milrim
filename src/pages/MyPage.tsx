import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

export default function MyPage() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div style={{ paddingTop: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
          마이페이지
        </h1>

        <div style={{ background: 'var(--color-pigment)', borderRadius: 20, padding: '24px', color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>사용자</p>
            <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>오늘도 한 걸음씩 나아가고 있어요 🌿</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[
            { label: '총 학습일', value: '14일' },
            { label: '완료 플랜', value: '2개' },
            { label: '연속 학습', value: '3일' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'white', borderRadius: 12, padding: '14px 10px', boxShadow: 'var(--shadow-soft)', textAlign: 'center' }}>
              <p style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)', margin: '0 0 4px' }}>{stat.value}</p>
              <p style={{ fontSize: 11, color: 'var(--color-ink-45)', margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)', marginBottom: 12 }}>
          {[
            { icon: '🔔', label: '알림 설정', sub: '학습 알림을 설정해요' },
            { icon: '📋', label: '이용약관', sub: '서비스 이용약관 보기' },
            { icon: '🔒', label: '개인정보처리방침', sub: '개인정보 보호 정책' },
          ].map((item, i, arr) => (
            <button key={item.label} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px',
              background: 'none', border: 'none', borderBottom: i < arr.length - 1 ? '1px solid var(--color-wash)' : 'none',
              cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', margin: '0 0 2px', fontFamily: 'var(--font-sans)' }}>{item.label}</p>
                <p style={{ fontSize: 12, color: 'var(--color-ink-45)', margin: 0, fontFamily: 'var(--font-sans)' }}>{item.sub}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-45)" strokeWidth="2">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%', padding: '16px', borderRadius: 12, border: '1.5px solid #FED7D7',
            background: 'white', color: '#E53E3E', fontSize: 14, fontWeight: 600,
            fontFamily: 'var(--font-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          로그아웃
        </button>
      </div>
    </Layout>
  )
}
