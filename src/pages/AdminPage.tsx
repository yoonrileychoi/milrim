import { useState } from 'react'
import Layout from '../components/Layout'

const users = [
  { email: 'jiwoo@milrim.app', joinDate: '2025.05.02', plans: 2, replans: 4, icon: 'eco', iconColor: '#2E5A3A', iconBg: '#DDE8CE' },
  { email: 'minsu_k@gmail.com', joinDate: '2025.04.18', plans: 5, replans: 11, icon: 'park', iconColor: '#5C7A4A', iconBg: '#E6E0CF' },
  { email: 'hayoon22@kakao.com', joinDate: '2025.06.10', plans: 1, replans: 0, icon: 'forest', iconColor: '#2E5A3A', iconBg: '#DDE8CE' },
  { email: 'seoyeon@naver.com', joinDate: '2025.03.27', plans: 3, replans: 7, icon: 'grass', iconColor: '#5C7A4A', iconBg: '#E6E0CF' },
]

export default function AdminPage() {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  return (
    <Layout title="관리자 모드">
      <div className="fade-in">
        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px' }}>
            <div style={{ fontSize: 13, color: '#9a9482' }}>총 가입자</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2B2A26', marginTop: 6 }}>1,284</div>
            <div style={{ fontSize: 12, color: '#2E5A3A', fontWeight: 600, marginTop: 4 }}>오늘 +37</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: '22px 24px' }}>
            <div style={{ fontSize: 13, color: '#9a9482' }}>7일간 활성 사용자 총합</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2B2A26', marginTop: 6 }}>842</div>
          </div>
          <div style={{ background: '#2E5A3A', borderRadius: 20, padding: '22px 24px' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>누적 AI 재계획</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 6 }}>8,941</div>
            <div style={{ fontSize: 12, color: '#C2E098', fontWeight: 600, marginTop: 4 }}>오늘 +212</div>
          </div>
        </div>

        {/* user table */}
        <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 22, marginTop: 16, overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px 12px', minWidth: 560 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2B2A26' }}>사용자 관리</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAF6EE', border: '1px solid #E7E1D3', borderRadius: 10, padding: '8px 12px', width: 220 }}>
              <span className="ms" style={{ fontSize: 18, color: '#b3ad9d' }}>search</span>
              <span style={{ fontSize: 13, color: '#b3ad9d' }}>이메일로 검색</span>
            </div>
          </div>
          <div style={{ minWidth: 560 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '2.4fr 1.4fr 0.8fr 0.8fr 0.6fr',
              padding: '10px 22px', borderTop: '1px solid #F0EADC', borderBottom: '1px solid #F0EADC',
              fontSize: 12, color: '#9a9482', fontWeight: 600,
            }}>
              <div>사용자</div><div>가입일</div><div style={{ textAlign: 'center' }}>플랜</div><div style={{ textAlign: 'center' }}>재계획</div><div style={{ textAlign: 'right' }}>관리</div>
            </div>
            {users.map((u, i) => (
              <div key={u.email} style={{
                display: 'grid', gridTemplateColumns: '2.4fr 1.4fr 0.8fr 0.8fr 0.6fr',
                alignItems: 'center', padding: '14px 22px',
                borderBottom: i < users.length - 1 ? '1px solid #F4EFE3' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: u.iconColor, flexShrink: 0 }}>
                    <span className="ms" style={{ fontSize: 18 }}>{u.icon}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#2B2A26' }}>{u.email}</span>
                </div>
                <div style={{ fontSize: 13, color: '#847f6f' }}>{u.joinDate}</div>
                <div style={{ fontSize: 14, color: '#2B2A26', textAlign: 'center' }}>{u.plans}</div>
                <div style={{ fontSize: 14, color: '#2B2A26', textAlign: 'center' }}>{u.replans}</div>
                <div style={{ textAlign: 'right', color: '#B5524A', cursor: 'pointer' }} onClick={() => setDeleteTarget(u.email)}>
                  <span className="ms" style={{ fontSize: 20 }}>delete</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* delete modal */}
      {deleteTarget && (
        <div
          onClick={() => setDeleteTarget(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(43,42,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}
        >
          <div onClick={e => e.stopPropagation()} className="pop-in" style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 22, padding: '26px 24px 22px' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#FBEDEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B5524A', margin: '0 auto 16px' }}>
              <span className="ms" style={{ fontSize: 28 }}>warning</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#2B2A26', textAlign: 'center' }}>정말 삭제하시겠어요?</div>
            <div style={{ fontSize: 13, color: '#847f6f', textAlign: 'center', marginTop: 9, lineHeight: 1.6 }}>
              {deleteTarget}의 계정과<br />학습 기록이 영구 삭제됩니다.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, border: '1px solid #DDD7C6', background: '#fff', color: '#6B6757', fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 14, fontFamily: 'var(--font)', cursor: 'pointer' }}>취소</button>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, border: 'none', background: '#B5524A', color: '#fff', fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 14, fontFamily: 'var(--font)', cursor: 'pointer' }}>삭제하기</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
