import { ErrorState, LoadingState } from '@components/screen-state'
import { PANEL_CARD, PanelPage } from '@components/panel-page'

import type { MembersScreenProps } from './types'
import type { TeamMemberResponse } from '@api/models'

const ROLE_LABELS: Record<TeamMemberResponse['role'], string> = {
  Owner: 'Dono',
  Professional: 'Profissional',
  Attendant: 'Atendente',
}

/**
 * Painel — Equipe: quem tem conta no estabelecimento e com que papel. É separada de Profissionais, que lista só quem tem
 * perfil público: o atendente aparece aqui e não lá.
 */
export const MembersScreen = ({ data, businessName }: MembersScreenProps) => (
  <PanelPage title="Equipe" subtitle={businessName}>
    {data.status === 'loading' ? (
      <LoadingState label="Carregando a equipe…" />
    ) : data.status === 'error' ? (
      <ErrorState message={data.message} onRetry={data.onRetry} />
    ) : data.members.length === 0 ? (
      <p role="status" className="type-body text-(--text-muted)">
        Ninguém na equipe ainda. Convide pessoas em Profissionais.
      </p>
    ) : (
      <ul aria-label="Membros da equipe" className={PANEL_CARD}>
        {data.members.map(({ membershipId, name, role }) => (
          <li
            key={membershipId}
            className="flex min-h-(--size-touch-min) items-center justify-between gap-(--space-12)"
          >
            <span className="type-body min-w-0 break-words text-(--text-strong)">{name}</span>
            <span className="type-caption shrink-0 rounded-(--radius-full) border border-(--border-subtle) px-(--space-8) py-(--space-2) text-(--text-body)">
              {ROLE_LABELS[role]}
            </span>
          </li>
        ))}
      </ul>
    )}
  </PanelPage>
)
