import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import { ConfirmProvider } from './components/ConfirmModal'
import Layout from './components/Layout'
import SplashGate from './components/SplashGate'
import Dashboard from './pages/Dashboard'
import People from './pages/People'
import Moderation from './pages/Moderation'
import Integrations from './pages/Integrations'
import Info from './pages/Info'
import AuthStore from './pages/AuthStore'
import Settings from './pages/Settings'
import VRChatStatus from './pages/VRChatStatus'
import DocsPage from './pages/DocsPage'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen vrcl-app-bg bg-beams flex flex-col items-center justify-center gap-6 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40" aria-hidden>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[min(90vw,420px)] h-[min(90vw,420px)] rounded-full bg-vrcl-purple/25 blur-[80px]" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-vrcl-pink/15 blur-[60px]" />
        </div>
        <div className="relative flex flex-col items-center gap-5">
          <div className="relative">
            <img
              src="/assets/vrchat%20legends/vrchat_legends_logo_round.png"
              alt=""
              className="h-16 w-16 rounded-xl object-cover shadow-lg shadow-vrcl-purple/30 ring-2 ring-vrcl-purple/20"
            />
            <div
              className="absolute -inset-1 rounded-[14px] border-2 border-vrcl-purple/40 border-t-transparent animate-spin pointer-events-none"
              aria-hidden
            />
          </div>
          <p className="text-sm font-semibold bg-gradient-to-r from-vrcl-purple-light to-vrcl-pink bg-clip-text text-transparent">
            Loading VRChat Legends…
          </p>
        </div>
      </div>
    )
  }
  if (!user) {
    window.location.href = '/login'
    return null
  }
  return children
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
      <Routes>
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <SplashGate>
                <Layout />
              </SplashGate>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="people" element={<People />} />
          <Route path="members" element={<Navigate to="/people" replace />} />
          <Route path="group" element={<Navigate to="/people" replace />} />
          <Route path="moderation" element={<Moderation />} />
          <Route path="activity" element={<Navigate to="/moderation?tab=activity" replace />} />
          <Route path="analytics" element={<Navigate to="/moderation?tab=analytics" replace />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="discord" element={<Navigate to="/integrations" replace />} />
          <Route path="ai" element={<Navigate to="/integrations" replace />} />
          <Route path="chatbox" element={<Navigate to="/integrations" replace />} />
          <Route path="auth-store" element={<AuthStore />} />
          <Route path="settings" element={<Settings />} />
          <Route path="vrchat-status" element={<VRChatStatus />} />
          <Route path="info" element={<Info />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="credits" element={<Navigate to="/info" replace />} />
          <Route path="about" element={<Navigate to="/info" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </ConfirmProvider>
    </ToastProvider>
  )
}
