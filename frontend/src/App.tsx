import { AppRoutes } from './router/route'
import { DemoBanner } from '@components/demo-banner'
import { PwaNotices } from '@components/pwa-notices'
import { Toaster } from '@components/toaster'
import { useApplyTheme } from '@hooks/use-theme'

export default function App() {
  useApplyTheme()

  return (
    <>
      <DemoBanner />
      <AppRoutes />
      <PwaNotices />
      <Toaster />
    </>
  )
}
