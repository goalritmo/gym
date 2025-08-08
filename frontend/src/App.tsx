import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TabProvider, useTab } from './contexts/TabContext'
import LoginComponent from './components/auth/LoginComponent'
import AuthenticatedApp from './components/app/AuthenticatedApp'
import AppLayout from './components/layout/AppLayout'
import './App.css'

function AppContent() {
  const { isAuthenticated } = useAuth()
  const { activeTab } = useTab()
  
  return (
    <AppLayout isAuthenticated={isAuthenticated} activeTab={activeTab}>
      <AppContentInner />
    </AppLayout>
  )
}

function AppContentInner() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginComponent />
  }

  return <AuthenticatedApp />
}

function App() {
  return (
    <AuthProvider>
      <TabProvider>
        <AppContent />
      </TabProvider>
    </AuthProvider>
  )
}

export default App
