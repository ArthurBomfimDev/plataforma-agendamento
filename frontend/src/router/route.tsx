import { Route, Routes } from 'react-router'

import { BusinessDetailRoute } from './business-detail-route'
import { ChooseProfessionalRoute } from './choose-professional-route'
import { HomeScreen } from '../features/home'
import { NotFoundScreen } from '../features/not-found'
import { ROUTES } from './consts'

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
      <Route path={ROUTES.home} element={<HomeScreen />} />
      <Route path={ROUTES.business} element={<BusinessDetailRoute />} />
      <Route path={ROUTES.chooseProfessional} element={<ChooseProfessionalRoute />} />
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  )
}
