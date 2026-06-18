import { Routes, Route, Navigate } from 'react-router-dom'
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/plan" element={<PlanListPage />} />
      <Route path="/plan/new" element={<GoalCreatePage />} />
      <Route path="/plan/ai-loading" element={<AiLoadingPage />} />
      <Route path="/plan/result" element={<PlanResultPage />} />
      <Route path="/plan/:id" element={<PlanDetailPage />} />
      <Route path="/timer" element={<TimerPage />} />
      <Route path="/rest" element={<RestPage />} />
      <Route path="/complete" element={<CompletePage />} />
      <Route path="/incomplete" element={<IncompletePage />} />
      <Route path="/replan" element={<ReplanPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/my" element={<MyPage />} />
      <Route path="/my/profile" element={<ProfilePage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}
