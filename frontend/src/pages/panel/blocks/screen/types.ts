import type { ImageSet } from '@api/models'
import type {
  ExceptionChoice,
  ExceptionDraft,
  ExceptionItem,
  AffectedItem,
  Loadable,
  Outcome,
} from '@pages/panel/schedules/screen/types'

export type BlockProfessional = { id: string; name: string; photo?: ImageSet | null }

export type BlocksScreenProps = {
  businessName: string
  /** Hoje, `yyyy-MM-dd`. */
  today: string
  /**
   * Quem pode ser bloqueado: o atendente, toda a equipe; o profissional, só ele mesmo. Carregando ou com erro, a tela
   * mostra o estado e não o formulário.
   */
  professionals: Loadable<BlockProfessional>
  /** O atendente pode bloquear o estabelecimento inteiro; o profissional, não. */
  allowWholeBusiness: boolean
  exceptions: Loadable<ExceptionItem>
  onPreviewBlock?: (draft: ExceptionDraft) => Promise<AffectedItem[] | string>
  onBlock?: (draft: ExceptionDraft, choice: ExceptionChoice) => Outcome
  onRemoveException?: (item: ExceptionItem) => Outcome
}
