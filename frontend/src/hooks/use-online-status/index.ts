import { useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/**
 * O aparelho tem rede? Atrás de hook próprio (regra 5): nenhum componente lê `navigator.onLine`. É uma dica do
 * navegador, não garantia: "online" não prova que a API responde, e cada tela mantém o próprio estado de erro.
 * Fora do navegador, como na renderização dos testes, responde `true`.
 */
export const useOnlineStatus = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
