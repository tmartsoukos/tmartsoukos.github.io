import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { TeamProvider } from './context/TeamContext.jsx'
import { SyncProvider } from './context/SyncContext.jsx'

// HashRouter: το GitHub Pages δεν μπορεί να κάνει rewrite των
// διαδρομών σε index.html, οπότε η πλοήγηση ζει μέσα στο #.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <TeamProvider>
          <SyncProvider>
            <App />
          </SyncProvider>
        </TeamProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
