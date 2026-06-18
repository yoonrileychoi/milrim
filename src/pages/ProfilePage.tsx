import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setNickname(user.user_metadata?.name || user.user_metadata?.full_name || '')
    }
  }, [user])

  const handleSave = async () => {
    if (!nickname.trim()) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { name: nickname.trim() } })
    setSaving(false)
    if (!error) {
      await refreshUser()
      setSaved(true)
      setTimeout(() => navigate('/my'), 800)
    }
  }

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
          <div style={{ width: 92, height: 92, borderRadius: '50%', background: '#DDE8CE', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <svg width="92" height="92" viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="46" cy="38" r="16" fill="#5A8A6A" />
              <ellipse cx="46" cy="78" rx="26" ry="20" fill="#5A8A6A" />
            </svg>
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2B2A26', marginBottom: 8 }}>닉네임</div>
          <div style={{ background: '#fff', border: '1px solid #2E5A3A', borderRadius: 14, padding: '14px 16px' }}>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font)', fontSize: 15, fontWeight: 600, color: '#2B2A26', width: '100%' }}
            />
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2B2A26', marginBottom: 8 }}>이메일</div>
          <div style={{ background: '#F4F0E4', border: '1px solid #EFEADD', borderRadius: 14, padding: '14px 16px', fontSize: 15, color: '#b3ad9d' }}>
            {user?.email ?? '-'}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || saved}
          style={{ width: '100%', border: 'none', background: saved ? '#6E9E4E' : saving ? '#6E9E4E' : '#2E5A3A', color: '#fff', fontSize: 16, fontWeight: 700, padding: 16, borderRadius: 15, fontFamily: 'var(--font)', cursor: (saving || saved) ? 'not-allowed' : 'pointer', marginTop: 28 }}
        >
          {saved ? '저장됐어요!' : saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}
