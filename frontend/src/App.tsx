import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginComponent from './components/auth/LoginComponent'
import AuthenticatedApp from './components/app/AuthenticatedApp'
import AppLayout from './components/layout/AppLayout'
import './App.css'

function AppContent() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginComponent />
  }

  return <AuthenticatedApp />
}

function App() {
  return (
    <AuthProvider>
      <AppLayout>
        <AppContent />
      </AppLayout>
    </AuthProvider>
  )
}

export default App
