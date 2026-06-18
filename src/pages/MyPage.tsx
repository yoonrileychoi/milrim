import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

export default function MyPage() {
  const navigate = useNavigate()

  return (
    <Layout title="마이페이지">
      <div className="fade-in">
        {/* profile card */}
        <div style={{ background: '#fff', border: '1px solid #ECE7DA', borderRadius: 20, padding: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#DDE8CE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2E5A3A', flexShrink: 0 }}>
            <span className="ms" style={{ fontSize: 28 }}>eco</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#2B2A26' }}>사용자</div>
            <div style={{ fontSize: 13, color: '#9a9482', marginTop: 2 }}>user@milrim.app</div>
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
          <div
            onClick={() => navigate('/admin')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span className="ms" style={{ fontSize: 20, color: '#6B6757' }}>admin_panel_settings</span>
              <span style={{ fontSize: 14.5, color: '#2B2A26' }}>관리자 패널</span>
            </div>
            <span className="ms" style={{ fontSize: 20, color: '#c2bba8' }}>chevron_right</span>
          </div>
          <div style={{ height: 1, background: '#F0EADC', margin: '0 18px' }} />
          <div
            onClick={() => navigate('/login')}
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
