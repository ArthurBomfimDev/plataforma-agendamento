import { Slide, ToastContainer } from 'react-toastify/unstyled'

/** Onde as notificações de `notify` aparecem. Montado uma vez, no `App`. */
export const Toaster = () => (
  <ToastContainer
    position="bottom-center"
    autoClose={4000}
    hideProgressBar
    closeOnClick
    newestOnTop
    transition={Slide}
  />
)
