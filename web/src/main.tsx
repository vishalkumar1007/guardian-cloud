import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './theme/ThemeProvider'

// Only the brand theme is global. It reads the public /api/v1/platform/theme
// endpoint, which every page needs for its colours and is safe to call
// unauthenticated.
//
// The identity and per-admin preference providers are deliberately NOT here.
// Mounted at the root they made the public landing page call staff endpoints;
// they are now scoped to the routes that need them (see auth/PlaneScopes.tsx).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
