import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HeroUIProvider } from '@heroui/react'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/shared/ErrorBoundary'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HeroUIProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <ToastProvider>
            <AppProvider>
              <App />
            </AppProvider>
          </ToastProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </HeroUIProvider>
  </StrictMode>,
)
