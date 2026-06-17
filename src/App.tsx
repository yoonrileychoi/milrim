import { Routes, Route, Navigate } from 'react-router-dom'
import SplashPage from './pages/SplashPage'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import PlanListPage from './pages/PlanListPage'
import PlanCreatePage from './pages/PlanCreatePage'
import PlanDetailPage from './pages/PlanDetailPage'
import StatsPage from './pages/StatsPage'
import MyPage from './pages/MyPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/splash" replace />} />
      <Route path="/splash" element={<SplashPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/plan" element={<PlanListPage />} />
      <Route path="/plan/new" element={<PlanCreatePage />} />
      <Route path="/plan/:id" element={<PlanDetailPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/my" element={<MyPage />} />
    </Routes>
  )
}
