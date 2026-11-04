import './styles/tokens.css'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'
import './styles/toast.css'

import App from './App'
import { HashRouter } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createQueryClient } from './api/base'
import { createRoot } from 'react-dom/client'

const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
)
