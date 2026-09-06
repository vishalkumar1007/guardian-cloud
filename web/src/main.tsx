import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './theme/ThemeProvider'
import { NavPrefsProvider } from './theme/navPrefs'
import { AdminThemeProvider } from './theme/adminTheme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <NavPrefsProvider>
        <AdminThemeProvider>
          <App />
        </AdminThemeProvider>
      </NavPrefsProvider>
    </ThemeProvider>
  </StrictMode>,
)
