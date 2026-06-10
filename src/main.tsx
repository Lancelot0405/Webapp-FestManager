import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/shared/ErrorBoundary'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeProvider>
        <ErrorBoundary>
          <ToastProvider>
            <AppProvider>
              <App />
            </AppProvider>
          </ToastProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </NextThemesProvider>
  </StrictMode>,
)
