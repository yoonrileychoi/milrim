import { useEffect, useState } from 'react'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import { LogoBars } from './Logo'
import { useTheme, THEMES } from '../contexts/ThemeContext'

function ThemeButtons({ dir = 'down' }: { dir?: 'down' | 'up' }) {
  const [showPalette, setShowPalette] = useState(false)
  const { theme, setTheme, isDark } = useTheme()

  useEffect(() => {
    if (!showPalette) return
    const close = () => setShowPalette(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showPalette])

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    ...(dir === 'up' ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }),
    background: 'var(--paper)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '12px 14px',
    boxShadow: '0 8px 28px rgba(0,0,0,0.15)',
    zIndex: 200,
    minWidth: 168,
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* Palette picker */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={e => { e.stopPropagation(); setShowPalette(p => !p) }}
          title="컬러 테마"
          style={{
            width: 34, height: 34, border: 'none', borderRadius: 10,
            background: showPalette ? 'var(--primary-tint)' : 'transparent',
            color: 'var(--ink-50)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit',
          }}
        >
          <span className="ms" style={{ fontSize: 20 }}>palette</span>
        </button>
        {showPalette && (
          <div style={panelStyle} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 11, color: 'var(--ink-40)', fontWeight: 600, marginBottom: 10 }}>컬러 테마</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {THEMES.map(t => (
                <div key={t.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <div
                    onClick={() => { setTheme(t.name); setShowPalette(false) }}
                    title={t.label}
                    style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: t.swatch,
                      cursor: 'pointer',
                      border: theme === t.name ? '3px solid var(--ink)' : '2px solid transparent',
                      boxShadow: theme === t.name ? '0 0 0 1px var(--border2)' : 'none',
                      transition: 'transform 0.12s',
                    }}
                  />
                  <div style={{ fontSize: 9.5, color: 'var(--ink-50)', textAlign: 'center', lineHeight: 1.2 }}>{t.label}</div>
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
          width: 34, height: 34, border: 'none', borderRadius: 10,
          background: isDark ? 'var(--primary-tint)' : 'transparent',
          color: 'var(--ink-50)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit',
        }}
      >
        <span className="ms" style={{ fontSize: 20 }}>{isDark ? 'light_mode' : 'dark_mode'}</span>
      </button>
    </div>
  )
}

export default function Layout({ children, title }: { children: React.ReactNode; title?: string }) {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1000)

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1000)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const today = new Date()
  const dateStr = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  const pageTitle = title || ''

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', minHeight: '100dvh' }}>
        <Sidebar />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 40px 60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--ink-40)', fontWeight: 500 }}>{dateStr}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', marginTop: 5 }}>{pageTitle}</div>
              </div>
            </div>
            <div className="fade-in">{children}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* mobile top appbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--appbar-bg)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <LogoBars size="sm" />
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>밀림</div>
        </div>
        <ThemeButtons dir="down" />
      </div>

      <div style={{ flex: 1, padding: '0 20px', paddingBottom: 86, overflowY: 'auto' }}>
        <div style={{ paddingTop: 14, marginBottom: 22 }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-40)', fontWeight: 500 }}>{dateStr}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 10 }}>{pageTitle}</div>
        </div>
        <div className="fade-in">{children}</div>
      </div>

      <BottomNav />
    </div>
  )
}
