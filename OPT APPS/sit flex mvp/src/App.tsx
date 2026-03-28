import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useAuthStore } from './stores/auth.store'

// Pages
import Login from './pages/Login'
import DriverQRLogin from './pages/DriverQRLogin'
import CallbackRequest from './pages/CallbackRequest'
import SatisfactionRating from './pages/SatisfactionRating'
import DispatcherWorkspace from './pages/dispatcher/Workspace'
import DriverToday from './pages/driver/Today'
import DriverTripNav from './pages/driver/TripNav'
import AdminFleet from './pages/admin/Fleet'
import AdminStops from './pages/admin/Stops'
import AdminDistances from './pages/admin/Distances'
import AdminUsers from './pages/admin/Users'
import AdminQRCodes from './pages/admin/QRCodes'
import AdminSettings from './pages/admin/Settings'
import ReportsOverview from './pages/reports/Overview'
import ReportsFinancial from './pages/reports/Financial'
import ReportsUrbact from './pages/reports/UrbactPanel'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, profile } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Javne stranice */}
          <Route path="/login" element={<Login />} />
          <Route path="/driver-login" element={<DriverQRLogin />} />
          <Route path="/pozovi-me" element={<CallbackRequest />} />
          <Route path="/ocena/:token" element={<SatisfactionRating />} />

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/dispatcher" replace />} />

          {/* Dispečer */}
          <Route path="/dispatcher" element={
            <ProtectedRoute roles={['dispatcher', 'admin']}>
              <DispatcherWorkspace />
            </ProtectedRoute>
          } />

          {/* Vozač */}
          <Route path="/driver/today" element={
            <ProtectedRoute roles={['driver', 'admin']}>
              <DriverToday />
            </ProtectedRoute>
          } />
          <Route path="/driver/trip/:bookingId" element={
            <ProtectedRoute roles={['driver', 'admin']}>
              <DriverTripNav />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/fleet" element={
            <ProtectedRoute roles={['admin']}>
              <AdminFleet />
            </ProtectedRoute>
          } />
          <Route path="/admin/stops" element={
            <ProtectedRoute roles={['admin']}>
              <AdminStops />
            </ProtectedRoute>
          } />
          <Route path="/admin/distances" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDistances />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/qrcodes" element={
            <ProtectedRoute roles={['admin']}>
              <AdminQRCodes />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute roles={['admin']}>
              <AdminSettings />
            </ProtectedRoute>
          } />

          {/* Izveštaji */}
          <Route path="/reports/overview" element={
            <ProtectedRoute roles={['admin', 'dispatcher']}>
              <ReportsOverview />
            </ProtectedRoute>
          } />
          <Route path="/reports/financial" element={
            <ProtectedRoute roles={['admin']}>
              <ReportsFinancial />
            </ProtectedRoute>
          } />
          <Route path="/reports/urbact" element={
            <ProtectedRoute roles={['admin']}>
              <ReportsUrbact />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
