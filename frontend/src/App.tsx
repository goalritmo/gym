import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginComponent from './components/auth/LoginComponent'
import AuthenticatedApp from './components/app/AuthenticatedApp'
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
      <AppContent />
    </AuthProvider>
  )
}

export default App
