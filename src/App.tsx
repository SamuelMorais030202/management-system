import { Routes, Route, Navigate } from 'react-router-dom'
import { ReactQueryProvider } from './lib/react-query-provider'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from 'sonner'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import TerminalSelectionPage from './pages/TerminalSelectionPage'
import KitchenManagementPage from './pages/KitchenManagementPage'

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ReactQueryProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/private/:tenant" element={<LoginPage />} />
          <Route path="/private/:tenant/:id/view" element={<TerminalSelectionPage />} />
          <Route path="/private/:tenant/:id/view/:terminal" element={<KitchenManagementPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </ReactQueryProvider>
    </ThemeProvider>
  )
}

export default App

