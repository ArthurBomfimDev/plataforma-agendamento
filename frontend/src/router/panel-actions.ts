import { errorMessage } from '@lib/api/errors'
import { toast } from '@lib/toast'

/**
 * Executa uma ação do painel. Deu certo: `true` (a tela mostra o sucesso). Falhou: o erro vira
 * mensagem em português — 409 de pedido já respondido, 403, 404, rede — e volta `false`. A lista é
 * buscada de novo nos dois casos (`usePanelAction`).
 */
export const performPanelAction = async (
  send: () => Promise<unknown>,
  notify: { error: (message: string) => void } = toast,
) => {
  try {
    await send()
    return true
  } catch (error) {
    notify.error(errorMessage(error))
    return false
  }
}
