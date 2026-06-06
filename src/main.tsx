import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './context/AppContext'   // ← thêm dòng này
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>    {/* ← bao App lại */}
      <App />
    </AppProvider>
  </StrictMode>,
)