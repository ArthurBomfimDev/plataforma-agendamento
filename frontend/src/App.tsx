import { Slide, ToastContainer } from './lib/toast'

import { AppRoutes } from './router/route'
import { useApplyTheme } from '@hooks/use-theme'

export default function App() {
  useApplyTheme()

  return (
    <>
      <AppRoutes />
      <ToastContainer
        position="bottom-center"
        autoClose={4000}
        hideProgressBar
        closeOnClick
        newestOnTop
        transition={Slide}
      />
    </>
  )
}
