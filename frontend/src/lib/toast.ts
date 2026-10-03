/**
 * Ponto único de importação do react-toastify. Use daqui, nunca de `react-toastify` direto.
 *
 * Por que `unstyled`: a entrada padrão da v11 injeta o CSS da lib no fim do `<head>`, depois do
 * nosso, e anularia os tokens de `styles/toast.css`. Aqui o CSS é importado explicitamente em
 * `main.tsx`, antes das sobrescritas. E `toast()` e `<ToastContainer>` precisam vir da MESMA
 * entrada, senão cada um tem o próprio estado e o toast nunca aparece.
 */
export { Slide, ToastContainer, toast } from 'react-toastify/unstyled'
