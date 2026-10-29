import { Navigate, Route, Routes } from 'react-router'

import { AppLayout } from './app-layout'
import { AppointmentsRoute } from './appointments-route'
import { AvailabilityRoute } from './availability-route'
import { BookingReviewRoute } from './booking-review-route'
import { BookingSentRoute } from './booking-sent-route'
import { BusinessDetailRoute } from './business-detail-route'
import { ChooseProfessionalRoute } from './choose-professional-route'
import { HomeRoute } from './home-route'
import { NotFoundScreen } from '@features/not-found'
import { PanelAgendaRoute } from './panel-agenda-route'
import { PanelLayout } from './panel-layout'
import { PanelServiceFormRoute, PanelServicesRoute } from './panel-services-route'
import { PanelMoreRoute } from './panel-more-route'
import { PanelPhotosRoute } from './panel-photos-route'
import { PanelRequestsRoute } from './panel-requests-route'
import { PanelSchedulesRoute } from './panel-schedules-route'
import { PanelSettingsRoute } from './panel-settings-route'
import { PanelTeamRoute } from './panel-team-route'
import { ROUTES } from './consts'
import { RequireOwner } from './require-owner'
import { SignInRoute } from './sign-in-route'
import { SignUpRoute } from './sign-up-route'
import { CheckEmailRoute } from './check-email-route'
import { ChooseContextRoute } from './choose-context-route'
import { ConfirmEmailRoute } from './confirm-email-route'
import { ForgotPasswordRoute } from './forgot-password-route'
import { ResetPasswordRoute } from './reset-password-route'
import { SearchRoute } from './search-route'

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
        <Route path={ROUTES.search} element={<SearchRoute />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
      {/* Fora da moldura: entrar e criar conta não têm barra superior. */}
      <Route path={ROUTES.signIn} element={<SignInRoute />} />
      <Route path={ROUTES.signUp} element={<SignUpRoute />} />
      <Route path={ROUTES.checkEmail} element={<CheckEmailRoute />} />
      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordRoute />} />
      <Route path={ROUTES.confirmEmail} element={<ConfirmEmailRoute />} />
      <Route path={ROUTES.resetPassword} element={<ResetPasswordRoute />} />
      <Route path={ROUTES.chooseContext} element={<ChooseContextRoute />} />
      <Route
        path={ROUTES.emailPanelRequests}
        element={<Navigate to={ROUTES.panelRequests} replace />}
      />
      <Route path={ROUTES.emailPanelAgenda} element={<Navigate to={ROUTES.panel} replace />} />
      {/* O painel tem a própria navegação: lateral no desktop, inferior no celular. */}
      <Route path={ROUTES.panel} element={<PanelLayout />}>
        <Route index element={<PanelAgendaRoute />} />
        <Route path={ROUTES.panelRequests} element={<PanelRequestsRoute />} />
        <Route path={ROUTES.panelMore} element={<PanelMoreRoute />} />
        {/* Gestão do estabelecimento (Onda 7D): só o dono. */}
        <Route element={<RequireOwner />}>
          <Route path={ROUTES.panelServices} element={<PanelServicesRoute />} />
          <Route path={ROUTES.panelNewService} element={<PanelServiceFormRoute />} />
          <Route path={ROUTES.panelEditService} element={<PanelServiceFormRoute />} />
          <Route path={ROUTES.panelProfessionals} element={<PanelTeamRoute />} />
          <Route path={ROUTES.panelSchedules} element={<PanelSchedulesRoute />} />
          <Route path={ROUTES.panelPhotos} element={<PanelPhotosRoute />} />
          <Route path={ROUTES.panelSettings} element={<PanelSettingsRoute />} />
        </Route>
      </Route>
    </Routes>
  )
}
