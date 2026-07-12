import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function MyPage() {
  const navigate = useNavigate()
  const { user, nickname, signOut } = useAuth()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError('')
    const { error } = await supabase.functions.invoke('delete-account')
    if (error) {
      setDeleteError('탈퇴 처리에 실패했어요. 잠시 후 다시 시도해주세요.')
      setDeleting(false)
      return
    }
    await signOut() // 로컬 세션 제거 — 필수
    navigate('/login', { replace: true })
  }

  const displayName = nickname || user?.user_metadata?.name || user?.user_metadata?.full_name || '사용자'
  const email = user?.email || 'user@milrim.app'
  const isAdmin = user?.app_metadata?.milrim_role === 'admin'

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
          <div
            onClick={() => setShowDeleteModal(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span className="ms" style={{ fontSize: 20, color: '#B5524A' }}>delete</span>
              <span style={{ fontSize: 14.5, color: '#B5524A' }}>회원 탈퇴</span>
            </div>
            <span className="ms" style={{ fontSize: 20, color: '#c2bba8' }}>chevron_right</span>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div
          onClick={() => !deleting && setShowDeleteModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(43,42,38,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}
        >
          <div onClick={e => e.stopPropagation()} className="pop-in" style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 22, padding: '26px 24px 22px' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#FBEDEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B5524A', margin: '0 auto 16px' }}>
              <span className="ms" style={{ fontSize: 28 }}>warning</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#2B2A26', textAlign: 'center' }}>정말 탈퇴하시겠어요?</div>
            <div style={{ fontSize: 13, color: '#847f6f', textAlign: 'center', marginTop: 9, lineHeight: 1.6 }}>
              계정과 모든 학습 기록이 영구 삭제되며<br />복구할 수 없습니다.
            </div>
            {deleteError && (
              <div style={{ fontSize: 13, color: '#B5524A', textAlign: 'center', marginTop: 14 }}>{deleteError}</div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting} style={{ flex: 1, border: '1px solid #DDD7C6', background: '#fff', color: '#6B6757', fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 14, fontFamily: 'var(--font)', cursor: 'pointer' }}>취소</button>
              <button onClick={handleDeleteAccount} disabled={deleting} style={{ flex: 1, border: 'none', background: '#B5524A', color: '#fff', fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 14, fontFamily: 'var(--font)', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}>
                {deleting ? '삭제 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
