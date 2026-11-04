import { errorMessage } from '@api/base'
import { toast } from 'react-toastify/unstyled'

/**
 * Ponto único das notificações. Nenhum módulo importa `react-toastify` direto.
 *
 * Por que `unstyled`: a entrada padrão da v11 injeta o CSS da lib no fim do `<head>`, depois do nosso, e anularia os
 * tokens de `styles/toast.css`. O CSS é importado explicitamente em `main.tsx`, antes das sobrescritas. E `toast()` e
 * o `<Toaster>` precisam vir da MESMA entrada, senão cada um tem o próprio estado e o toast nunca aparece.
 */
export const notify = {
  success: (message: string) => toast.success(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),
  /** Texto pronto ou o erro de uma chamada, já traduzido pela mensagem do código da API. */
  error: (error: unknown) => toast.error(typeof error === 'string' ? error : errorMessage(error)),
}
