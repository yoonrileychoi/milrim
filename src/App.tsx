import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import PlanListPage from './pages/PlanListPage'
import GoalCreatePage from './pages/GoalCreatePage'
import AiLoadingPage from './pages/AiLoadingPage'
import PlanResultPage from './pages/PlanResultPage'
import PlanDetailPage from './pages/PlanDetailPage'
import TimerPage from './pages/TimerPage'
import RestPage from './pages/RestPage'
import CompletePage from './pages/CompletePage'
import IncompletePage from './pages/IncompletePage'
import ReplanPage from './pages/ReplanPage'
import StatsPage from './pages/StatsPage'
import MyPage from './pages/MyPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F4F2EA',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid #DDE8CE', borderTopColor: '#2E5A3A',
          animation: 'dspin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F4F2EA',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid #DDE8CE', borderTopColor: '#2E5A3A',
          animation: 'dspin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/home' : '/login'} replace />} />
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />

      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/plan" element={<ProtectedRoute><PlanListPage /></ProtectedRoute>} />
      <Route path="/plan/new" element={<ProtectedRoute><GoalCreatePage /></ProtectedRoute>} />
      <Route path="/plan/ai-loading" element={<ProtectedRoute><AiLoadingPage /></ProtectedRoute>} />
      <Route path="/plan/result" element={<ProtectedRoute><PlanResultPage /></ProtectedRoute>} />
      <Route path="/plan/:id" element={<ProtectedRoute><PlanDetailPage /></ProtectedRoute>} />
      <Route path="/timer" element={<ProtectedRoute><TimerPage /></ProtectedRoute>} />
      <Route path="/rest" element={<ProtectedRoute><RestPage /></ProtectedRoute>} />
      <Route path="/complete" element={<ProtectedRoute><CompletePage /></ProtectedRoute>} />
      <Route path="/incomplete" element={<ProtectedRoute><IncompletePage /></ProtectedRoute>} />
      <Route path="/replan" element={<ProtectedRoute><ReplanPage /></ProtectedRoute>} />
      <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
      <Route path="/my" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      <Route path="/my/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
    </Routes>
  )
}
