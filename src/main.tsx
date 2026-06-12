import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import ErrorBoundary from './components/shared/ErrorBoundary'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 phút
      retry: 2,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeProvider>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
              <ToastProvider>
                <AppProvider>
                  <App />
                </AppProvider>
              </ToastProvider>
            </ErrorBoundary>
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
          </QueryClientProvider>
        </BrowserRouter>
      </ThemeProvider>
    </NextThemesProvider>
  </StrictMode>,
)
