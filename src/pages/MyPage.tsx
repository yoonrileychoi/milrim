import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'

export default function MyPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || '사용자'
  const email = user?.email || 'user@milrim.app'
  const isAdmin = user?.user_metadata?.milrim_role === 'admin'

  return (
    <Layout title="마이페이지">
      <div className="fade-in">
        {/* profile card */}
        <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#DDE8CE', flexShrink: 0, overflow: 'hidden' }}>
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="25" r="11" fill="#5A8A6A" />
              <ellipse cx="30" cy="52" rx="18" ry="14" fill="#5A8A6A" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#2B2A26' }}>{displayName}</div>
            <div style={{ fontSize: 13, color: '#9a9482', marginTop: 2 }}>{email}</div>
          </div>
          <div
            onClick={() => navigate('/my/profile')}
            style={{ fontSize: 13, color: '#2E5A3A', fontWeight: 700, border: '1px solid #DDE8CE', padding: '9px 15px', borderRadius: 20, cursor: 'pointer' }}
          >
            프로필 설정
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#9a9482', fontWeight: 600, margin: '24px 4px 9px' }}>관리</div>
        <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 18, overflow: 'hidden' }}>
          {isAdmin && (
            <>
              <div
                onClick={() => navigate('/admin')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span className="ms" style={{ fontSize: 20, color: '#6B6757' }}>admin_panel_settings</span>
                  <span style={{ fontSize: 14.5, color: '#2B2A26' }}>관리자 모드</span>
                </div>
                <span className="ms" style={{ fontSize: 20, color: '#c2bba8' }}>chevron_right</span>
              </div>
              <div style={{ height: 1, background: '#F0EADC', margin: '0 18px' }} />
            </>
          )}
          <div
            onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span className="ms" style={{ fontSize: 20, color: '#6B6757' }}>logout</span>
              <span style={{ fontSize: 14.5, color: '#2B2A26' }}>로그아웃</span>
            </div>
            <span className="ms" style={{ fontSize: 20, color: '#c2bba8' }}>chevron_right</span>
          </div>
          <div style={{ height: 1, background: '#F0EADC', margin: '0 18px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span className="ms" style={{ fontSize: 20, color: '#B5524A' }}>delete</span>
              <span style={{ fontSize: 14.5, color: '#B5524A' }}>회원 탈퇴</span>
            </div>
            <span className="ms" style={{ fontSize: 20, color: '#c2bba8' }}>chevron_right</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}
