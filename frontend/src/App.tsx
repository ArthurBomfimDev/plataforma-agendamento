import { AppRoutes } from './router/route'
import { Toaster } from '@components/toaster'
import { useApplyTheme } from '@hooks/use-theme'

export default function App() {
  useApplyTheme()

  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  )
}
