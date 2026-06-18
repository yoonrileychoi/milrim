import { useEffect, useState } from 'react'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import { LogoBars } from './Logo'

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
                <div style={{ fontSize: 13, color: '#9a9482', fontWeight: 500 }}>{dateStr}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#2B2A26', marginTop: 5 }}>{pageTitle}</div>
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
        background: 'rgba(250,246,238,0.92)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <LogoBars size="sm" />
          <div style={{ fontSize: 18, fontWeight: 800, color: '#2B2A26' }}>밀림</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 20px', paddingBottom: 86, overflowY: 'auto' }}>
        <div style={{ paddingTop: 14, marginBottom: 22 }}>
          <div style={{ fontSize: 12.5, color: '#9a9482', fontWeight: 500 }}>{dateStr}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#2B2A26', marginTop: 10 }}>{pageTitle}</div>
        </div>
        <div className="fade-in">{children}</div>
      </div>

      <BottomNav />
    </div>
  )
}
