import { Slide, ToastContainer } from './lib/toast'

import { AppRoutes } from './router/route'

export default function App() {
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
