import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('사용자')

  return (
    <div className="fade-in" style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: '#F4F2EA' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '26px 24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div
            onClick={() => navigate('/my')}
            style={{ width: 38, height: 38, borderRadius: 11, background: '#fff', border: '1px solid #E7E1D3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6757', cursor: 'pointer' }}
          >
            <span className="ms" style={{ fontSize: 22 }}>arrow_back</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#2B2A26' }}>프로필 설정</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 92, height: 92, borderRadius: '50%', background: '#DDE8CE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E5A3A' }}>
              <span className="ms" style={{ fontSize: 42 }}>eco</span>
            </div>
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 30, height: 30, borderRadius: '50%', background: '#2E5A3A', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #F4F2EA', cursor: 'pointer',
            }}>
              <span className="ms" style={{ fontSize: 16, fontVariationSettings: "'wght' 400" }}>photo_camera</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2B2A26', marginBottom: 8 }}>닉네임</div>
          <div style={{ background: '#fff', border: '1px solid #2E5A3A', borderRadius: 14, padding: '14px 16px' }}>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 15, fontWeight: 600, color: '#2B2A26', width: '100%' }}
            />
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2B2A26', marginBottom: 8 }}>이메일</div>
          <div style={{ background: '#F4F0E4', border: '1px solid #EFEADD', borderRadius: 14, padding: '14px 16px', fontSize: 15, color: '#b3ad9d' }}>user@milrim.app</div>
        </div>

        <button
          onClick={() => navigate('/my')}
          style={{ width: '100%', border: 'none', background: '#2E5A3A', color: '#fff', fontSize: 16, fontWeight: 700, padding: 16, borderRadius: 15, fontFamily: 'var(--font)', cursor: 'pointer', marginTop: 28 }}
        >
          저장하기
        </button>
      </div>
    </div>
  )
}
