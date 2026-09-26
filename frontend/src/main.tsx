import './styles/tokens.css'
import './index.css'

import App from './App.tsx'
import { HashRouter } from 'react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
