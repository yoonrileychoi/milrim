import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'

export default function StatsPage() {
  const { user } = useAuth()
  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || '사용자'

  return (
    <Layout title="나의 숲">
      <div className="fade-in">
        {/* top stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px' }}>
            <div style={{ fontSize: 13, color: '#9a9482' }}>누적 학습 시간</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2B2A26', marginTop: 7 }}>47<span style={{ fontSize: 14 }}>시간</span></div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px' }}>
            <div style={{ fontSize: 13, color: '#9a9482' }}>누적 공부일</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2B2A26', marginTop: 7 }}>23<span style={{ fontSize: 14 }}>일</span></div>
          </div>
        </div>

        {/* big cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginTop: 16 }}>
          <div style={{
            background: 'linear-gradient(150deg, #2E5A3A 0%, #3C6B45 100%)',
            borderRadius: 22, padding: 30, color: '#fff',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, opacity: 0.85, fontWeight: 500 }}>밀려도 다시 이어간 횟수</div>
            <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1, margin: '12px 0 6px' }}>
              3<span style={{ fontSize: 24 }}>회</span>
            </div>
            <div style={{ fontSize: 13.5, color: '#C2E098', fontWeight: 600 }}>한 번도 완전히 멈추지 않았어요</div>
          </div>
          <div style={{ background: '#F0F5E6', borderRadius: 22, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 18, minHeight: 200 }}>
            <span className="ms" style={{ fontSize: 40, color: '#2E5A3A' }}>eco</span>
            <div style={{ fontSize: 22, color: '#3E5C42', lineHeight: 1.5, fontWeight: 700 }}>
              속도가 느려도, 꾸준히 옳은 방향으로 간다면 목표를 이룰 수 있을 거예요.
            </div>
          </div>
        </div>

        {/* story text */}
        <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 22, padding: '22px 24px', marginTop: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#2B2A26', marginBottom: 8 }}>3번의 재계획 끝에 여기까지 왔어요</div>
          <div style={{ fontSize: 13, color: '#847f6f', lineHeight: 1.65 }}>
            밀릴 때마다 AI가 목표일에 맞춰 계획을 다시 세웠고, 그때마다 {displayName}님은 다시 시작했어요. 그 꾸준함이 지금의 숲을 만들었습니다.
          </div>
        </div>
      </div>
    </Layout>
  )
}
