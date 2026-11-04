import { Navigate, Route, Routes } from 'react-router'

import { LoadingScreen } from '@components/screen-state'
import { Suspense } from 'react'
import { lazyPage } from './lazy-page'

import { AppLayout } from '@layouts/public-layout'
import { NotFoundScreen } from '@pages/not-found'
import { PANEL_PAGE_LOADERS } from './panel-pages'
import { ROUTES } from './paths'
import { RequireOwner } from './guards/require-owner'
import { RequireRoles } from './guards/require-roles'

// Moldura do consumidor e 404 vão no chunk inicial (são a porta de entrada); o painel inteiro e cada página, não.
const AdminBusinessesRoute = lazyPage(
  () => import('@pages/admin/businesses'),
  'AdminBusinessesRoute',
)
const RegisterBusinessRoute = lazyPage(
  () => import('@pages/onboarding/register'),
  'RegisterBusinessRoute',
)
const AppointmentsRoute = lazyPage(
  () => import('@pages/customer/appointments'),
  'AppointmentsRoute',
)
const AvailabilityRoute = lazyPage(
  () => import('@pages/customer/booking/availability'),
  'AvailabilityRoute',
)
const BookingReviewRoute = lazyPage(
  () => import('@pages/customer/booking/review'),
  'BookingReviewRoute',
)
const BookingSentRoute = lazyPage(() => import('@pages/customer/booking/sent'), 'BookingSentRoute')
const BusinessDetailRoute = lazyPage(
  () => import('@pages/customer/business-detail'),
  'BusinessDetailRoute',
)
const CheckEmailRoute = lazyPage(() => import('@pages/auth/check-email'), 'CheckEmailRoute')
const ChooseContextRoute = lazyPage(
  () => import('@pages/auth/choose-context'),
  'ChooseContextRoute',
)
const ChooseProfessionalRoute = lazyPage(
  () => import('@pages/customer/booking/choose-professional'),
  'ChooseProfessionalRoute',
)
const ConfirmEmailRoute = lazyPage(() => import('@pages/auth/confirm-email'), 'ConfirmEmailRoute')
const ForgotPasswordRoute = lazyPage(
  () => import('@pages/auth/forgot-password'),
  'ForgotPasswordRoute',
)
const HomeRoute = lazyPage(() => import('@pages/customer/home'), 'HomeRoute')
const InvitationRoute = lazyPage(() => import('@pages/auth/invitation'), 'InvitationRoute')
const MyAccountRoute = lazyPage(() => import('@pages/account'), 'MyAccountRoute')
const PanelAgendaRoute = lazyPage(PANEL_PAGE_LOADERS.agenda, 'PanelAgendaRoute')
const PanelBlocksRoute = lazyPage(PANEL_PAGE_LOADERS.blocks, 'PanelBlocksRoute')
const PanelProfileRoute = lazyPage(PANEL_PAGE_LOADERS.profile, 'PanelProfileRoute')
const PanelLayout = lazyPage(() => import('@layouts/panel-layout'), 'PanelLayout')
const PanelMoreRoute = lazyPage(PANEL_PAGE_LOADERS.more, 'PanelMoreRoute')
const PanelPhotosRoute = lazyPage(PANEL_PAGE_LOADERS.photos, 'PanelPhotosRoute')
const PanelRequestsRoute = lazyPage(PANEL_PAGE_LOADERS.requests, 'PanelRequestsRoute')
const PanelSchedulesRoute = lazyPage(PANEL_PAGE_LOADERS.schedules, 'PanelSchedulesRoute')
const PanelServiceFormRoute = lazyPage(PANEL_PAGE_LOADERS.services, 'PanelServiceFormRoute')
const PanelServicesRoute = lazyPage(PANEL_PAGE_LOADERS.services, 'PanelServicesRoute')
const PanelSettingsRoute = lazyPage(PANEL_PAGE_LOADERS.settings, 'PanelSettingsRoute')
const PanelTeamRoute = lazyPage(PANEL_PAGE_LOADERS.team, 'PanelTeamRoute')
const ResetPasswordRoute = lazyPage(
  () => import('@pages/auth/reset-password'),
  'ResetPasswordRoute',
)
const ProfessionalPageRoute = lazyPage(
  () => import('@pages/customer/professional'),
  'ProfessionalPageRoute',
)
const SearchRoute = lazyPage(() => import('@pages/customer/search'), 'SearchRoute')
const SignInRoute = lazyPage(() => import('@pages/auth/sign-in'), 'SignInRoute')
const SignUpRoute = lazyPage(() => import('@pages/auth/sign-up'), 'SignUpRoute')

/**
 * Rotas da aplicação, no modo declarativo do React Router. O `<HashRouter>` fica em `main.tsx`.
 *
 * Hash de propósito: o build usa `base: './'` (regra 4 de empacotamento) e o mesmo build roda no
 * Capacitor e no Tauri. Com caminho "limpo", recarregar /businesses/x resolve `./assets/…` a
 * partir de /businesses/ e o servidor devolve HTML no lugar do JavaScript. Ver ADR-012.
 */
export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
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
          <Route path={ROUTES.professional} element={<ProfessionalPageRoute />} />
          <Route path="*" element={<NotFoundScreen />} />
        </Route>
        {/* Fora da moldura: entrar e criar conta não têm barra superior. */}
        <Route path={ROUTES.signIn} element={<SignInRoute />} />
        <Route path={ROUTES.signUp} element={<SignUpRoute />} />
        <Route path={ROUTES.checkEmail} element={<CheckEmailRoute />} />
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordRoute />} />
        <Route path={ROUTES.confirmEmail} element={<ConfirmEmailRoute />} />
        <Route path={ROUTES.resetPassword} element={<ResetPasswordRoute />} />
        <Route path={ROUTES.invitation} element={<InvitationRoute />} />
        <Route path={ROUTES.chooseContext} element={<ChooseContextRoute />} />
        <Route path={ROUTES.account} element={<MyAccountRoute />} />
        <Route path={ROUTES.registerBusiness} element={<RegisterBusinessRoute />} />
        <Route path={ROUTES.adminBusinesses} element={<AdminBusinessesRoute />} />
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
          {/* Atendente e profissional (o dono tem Jornadas); o servidor recusa o resto com 403. */}
          <Route element={<RequireRoles allow={['Attendant', 'Professional']} />}>
            <Route path={ROUTES.panelBlocks} element={<PanelBlocksRoute />} />
          </Route>
          <Route element={<RequireRoles allow={['Professional']} />}>
            <Route path={ROUTES.panelProfile} element={<PanelProfileRoute />} />
          </Route>
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
    </Suspense>
  )
}
