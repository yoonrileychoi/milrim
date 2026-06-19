import { useNavigate, useLocation } from 'react-router-dom'
import { LogoBars } from './Logo'
import { useEffect, useState } from 'react'
import { useTheme, THEMES } from '../contexts/ThemeContext'

const navItems = [
  { path: '/home', icon: 'home', label: '홈' },
  { path: '/plan', icon: 'event_note', label: '전체 계획' },
  { path: '/stats', icon: 'monitoring', label: '통계' },
  { path: '/my', icon: 'person', label: '마이페이지' },
  { path: '/admin', icon: 'admin_panel_settings', label: '관리자' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [showPalette, setShowPalette] = useState(false)
  const { theme, setTheme, isDark } = useTheme()

  useEffect(() => {
    if (!showPalette) return
    const close = () => setShowPalette(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showPalette])

  return (
    <div style={{
      width: 252, flexShrink: 0,
      background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '28px 18px 20px',
      position: 'sticky', top: 0, height: '100vh',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 10px 4px' }}>
        <LogoBars size="md" />
        <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--ink)', letterSpacing: '0.02em' }}>밀림</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-30)', padding: '0 10px', marginTop: 2 }}>밀려도 괜찮은 학습 플래너</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 34 }}>
        {navItems.map(item => {
          const active = pathname === item.path || (item.path !== '/home' && pathname.startsWith(item.path))
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px',
                borderRadius: 13, cursor: 'pointer',
                background: active ? 'var(--primary-tint)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--ink-70)',
              }}
            >
              <span className="ms" style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 14.5, fontWeight: active ? 700 : 400, fontFamily: 'var(--font)' }}>{item.label}</span>
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* Theme controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 12, position: 'relative' }}>
        {/* Palette */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={e => { e.stopPropagation(); setShowPalette(p => !p) }}
            title="컬러 테마"
            style={{
              width: 64, height: 64, borderRadius: 16,
              border: showPalette ? '3px solid var(--primary)' : '3px solid var(--border2)',
              background: showPalette ? 'var(--primary-tint)' : 'var(--paper)',
              color: showPalette ? 'var(--primary)' : 'var(--ink-50)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit',
            }}
          >
            <span className="ms" style={{ fontSize: 36 }}>palette</span>
          </button>
          {showPalette && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', right: 0, bottom: 'calc(100% + 8px)',
                background: 'var(--paper)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '12px 14px',
                boxShadow: '0 -4px 28px rgba(0,0,0,0.14)', zIndex: 200, minWidth: 168,
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--ink-40)', fontWeight: 600, marginBottom: 10 }}>컬러 테마</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {THEMES.map(t => (
                  <div key={t.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div
                      onClick={() => { setTheme(t.name); setShowPalette(false) }}
                      title={t.label}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: t.swatch, cursor: 'pointer',
                        border: theme === t.name ? '3px solid var(--ink)' : '2px solid transparent',
                        boxShadow: theme === t.name ? '0 0 0 1px var(--border2)' : 'none',
                      }}
                    />
                    <div style={{ fontSize: 9, color: 'var(--ink-50)', textAlign: 'center', lineHeight: 1.2 }}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(isDark ? 'green' : 'dark')}
          title={isDark ? '라이트 모드' : '다크 모드'}
          style={{
            width: 64, height: 64, borderRadius: 16,
            border: isDark ? '3px solid var(--primary)' : '3px solid var(--border2)',
            background: isDark ? 'var(--primary-tint)' : 'var(--paper)',
            color: isDark ? 'var(--primary)' : 'var(--ink-50)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit',
          }}
        >
          <span className="ms" style={{ fontSize: 36 }}>{isDark ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>

      <button
        onClick={() => navigate('/replan')}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          border: 'none', background: 'var(--primary)', color: '#fff',
          fontSize: 14, fontWeight: 700, padding: 13, borderRadius: 13,
          fontFamily: 'var(--font)', cursor: 'pointer', marginBottom: 10,
        }}
      >
        <span className="ms" style={{ fontSize: 20 }}>autorenew</span>
        계획 재생성
      </button>

      <div
        onClick={() => navigate('/my')}
        style={{
          display: 'flex', alignItems: 'center', gap: 11, padding: 12,
          borderRadius: 14, background: 'var(--paper)', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: '50%', background: 'var(--primary-tint2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0,
        }}>
          <span className="ms" style={{ fontSize: 20 }}>eco</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>사용자</div>
          <div style={{ fontSize: 11, color: 'var(--ink-40)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>user@milrim.app</div>
        </div>
      </div>
    </div>
  )
}
