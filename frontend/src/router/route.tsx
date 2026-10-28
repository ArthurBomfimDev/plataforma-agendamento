import { Route, Routes } from 'react-router'

import { AppLayout } from './app-layout'
import { AppointmentsRoute } from './appointments-route'
import { AvailabilityRoute } from './availability-route'
import { BookingReviewRoute } from './booking-review-route'
import { BookingSentRoute } from './booking-sent-route'
import { BusinessDetailRoute } from './business-detail-route'
import { ChooseProfessionalRoute } from './choose-professional-route'
import { HomeRoute } from './home-route'
import { NotFoundScreen } from '@features/not-found'
import { ROUTES } from './consts'
import { SignInRoute } from './sign-in-route'
import { SignUpRoute } from './sign-up-route'
import { CheckEmailRoute } from './check-email-route'
import { ConfirmEmailRoute } from './confirm-email-route'
import { ForgotPasswordRoute } from './forgot-password-route'
import { ResetPasswordRoute } from './reset-password-route'

/**
 * Rotas da aplicação, no modo declarativo do React Router. O `<HashRouter>` fica em `main.tsx`.
 *
 * Hash de propósito: o build usa `base: './'` (regra 4 de empacotamento) e o mesmo build roda no
 * Capacitor e no Tauri. Com caminho "limpo", recarregar /businesses/x resolve `./assets/…` a
 * partir de /businesses/ e o servidor devolve HTML no lugar do JavaScript. Ver ADR-012.
 */
export const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={ROUTES.home} element={<HomeRoute />} />
        <Route path={ROUTES.business} element={<BusinessDetailRoute />} />
        <Route path={ROUTES.chooseProfessional} element={<ChooseProfessionalRoute />} />
        <Route path={ROUTES.availability} element={<AvailabilityRoute />} />
        <Route path={ROUTES.bookingReview} element={<BookingReviewRoute />} />
        <Route path={ROUTES.bookingSent} element={<BookingSentRoute />} />
        <Route path={ROUTES.appointments} element={<AppointmentsRoute />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
      {/* Fora da moldura: entrar e criar conta não têm barra superior. */}
      <Route path={ROUTES.signIn} element={<SignInRoute />} />
      <Route path={ROUTES.signUp} element={<SignUpRoute />} />
      <Route path={ROUTES.checkEmail} element={<CheckEmailRoute />} />
      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordRoute />} />
      <Route path={ROUTES.confirmEmail} element={<ConfirmEmailRoute />} />
      <Route path={ROUTES.resetPassword} element={<ResetPasswordRoute />} />
    </Routes>
  )
}
