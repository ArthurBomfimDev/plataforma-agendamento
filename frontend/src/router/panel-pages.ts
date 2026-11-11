/**
 * Chunks das telas do painel, num lugar só: as rotas os usam para `lazy` e o painel os baixa em segundo plano
 * assim que abre. `import()` repetido reaproveita o módulo, então chamar de novo não custa nada.
 */
export const PANEL_PAGE_LOADERS = {
  agenda: () => import('@pages/panel/agenda'),
  blocks: () => import('@pages/panel/blocks'),
  profile: () => import('@pages/panel/profile'),
  members: () => import('@pages/panel/members'),
  more: () => import('@pages/panel/more'),
  photos: () => import('@pages/panel/photos'),
  requests: () => import('@pages/panel/requests'),
  reviews: () => import('@pages/panel/reviews'),
  schedules: () => import('@pages/panel/schedules'),
  services: () => import('@pages/panel/services'),
  settings: () => import('@pages/panel/settings'),
  team: () => import('@pages/panel/team'),
}

/** Baixa as telas do painel quando o navegador está ocioso; falha de rede aqui não é erro, a rota tenta de novo. */
export const prefetchPanelPages = () => {
  const run = () => Object.values(PANEL_PAGE_LOADERS).forEach((load) => void load().catch(() => {}))
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(run, { timeout: 3000 })
    return () => window.cancelIdleCallback(handle)
  }
  const handle = window.setTimeout(run, 1500)
  return () => window.clearTimeout(handle)
}
