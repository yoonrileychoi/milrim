import { NavLink } from 'react-router-dom'

const tabs = [
  {
    to: '/home',
    label: '홈',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--color-pigment)' : 'none'} stroke={active ? 'var(--color-pigment)' : 'var(--color-ink-45)'} strokeWidth="1.8">
        <path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" /><path d="M3 12v9h5V12h8v9h5V12" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/plan',
    label: '플랜',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--color-pigment)' : 'var(--color-ink-45)'} strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="14" x2="8" y2="14" strokeLinecap="round" strokeWidth="2.5" /><line x1="12" y1="14" x2="12" y2="14" strokeLinecap="round" strokeWidth="2.5" /><line x1="8" y1="17" x2="8" y2="17" strokeLinecap="round" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    to: '/stats',
    label: '통계',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--color-pigment)' : 'var(--color-ink-45)'} strokeWidth="1.8">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    to: '/my',
    label: '마이',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--color-pigment)' : 'var(--color-ink-45)'} strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'white', borderTop: '1px solid var(--color-wash)',
      display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      zIndex: 100,
    }}>
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 8px', gap: 3, textDecoration: 'none' }}
        >
          {({ isActive }) => (
            <>
              {tab.icon(isActive)}
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em',
                color: isActive ? 'var(--color-pigment)' : 'var(--color-ink-45)',
                fontWeight: isActive ? 600 : 400,
              }}>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
