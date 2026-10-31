import type { ChosenLocation } from '@store/location/types'
import type { GeoPlaceResponse } from '@api/models'
import type { SearchDistance } from '@api/services/business/search'

/**
 * Passos do seletor. Os de `device-*` são o caminho "Usar minha localização": aviso antes da permissão, espera,
 * e as três saídas da decisão de 22/09 §5.5 (permitiu com precisão ruim, negou, falhou) — nenhuma é beco sem saída.
 */
export type PickerStep =
  | 'menu'
  | 'device-notice'
  | 'device-pending'
  | 'device-poor'
  | 'device-denied'
  | 'device-failed'
  | 'postal-code'
  | 'search'

export type LocationPickerPanelProps = {
  step: PickerStep
  /** A referência em uso, para a pessoa ver o que vai trocar. */
  current: ChosenLocation | null
  /** Chamada em andamento: botões de envio desligados. */
  busy?: boolean
  /** Erro já em texto para a pessoa. */
  error?: string
  /** Precisão informada pelo navegador, no passo `device-poor`. */
  accuracyMeters?: number
  /** Lugar encontrado pelo CEP, pronto para usar. */
  postalCodeMatch?: string | null
  /** Resultados da busca por texto; nulo antes da primeira busca. */
  results?: GeoPlaceResponse[] | null
  onStep?: (step: PickerStep) => void
  /** Depois do aviso: agora sim o navegador pergunta. */
  onAskDevice?: () => void
  onUsePoorAnyway?: () => void
  onUseDemo?: () => void
  onSubmitPostalCode?: (postalCode: string) => void
  onUsePostalCodeMatch?: () => void
  onSubmitSearch?: (text: string) => void
  onPickResult?: (place: GeoPlaceResponse) => void
  /** Distância da busca (7CF): escolhida aqui, junto do endereço. */
  distance?: SearchDistance
  onDistance?: (distance: SearchDistance) => void
}
