import BottomNav from './BottomNav'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <main className="page-content">{children}</main>
      <BottomNav />
    </div>
  )
}
