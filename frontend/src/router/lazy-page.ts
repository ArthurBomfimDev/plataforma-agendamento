import { type ComponentType, lazy } from 'react'

/**
 * Página carregada sob demanda: cada uma vira um chunk próprio e só baixa quando a rota abre. As páginas exportam
 * por nome (`export const HomeRoute`), então aqui o export nomeado vira o `default` que o `lazy` espera.
 */
export const lazyPage = <TModule extends Record<TName, ComponentType>, TName extends keyof TModule>(
  load: () => Promise<TModule>,
  name: TName,
) => lazy(async () => ({ default: (await load())[name] }))
