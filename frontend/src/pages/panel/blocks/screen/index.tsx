import { KIND_LABELS, exceptionWhenLabel } from '@pages/panel/schedules/screen/consts'
import { useState } from 'react'

import { BlockPeriodCard } from '@pages/panel/schedules/screen/components/block-period-card'
import type { BlocksScreenProps } from './types'
import { ErrorState, LoadingState } from '@components/screen-state'
import { PanelPage } from '@components/panel-page'
import { ProfessionalSelector } from '@pages/panel/schedules/screen/components/professional-selector'
import { RemovableListCard } from '@pages/panel/schedules/screen/components/removable-list-card'

/**
 * Painel — Folgas e bloqueios (ADR-030), para o atendente e para o profissional. O atendente bloqueia qualquer
 * profissional ou o estabelecimento todo; o profissional, só a própria agenda. A jornada semanal continua só do dono
 * (por isso esta tela não a edita). Usa o mesmo formulário e a mesma lista das Jornadas do dono, com a prévia do que
 * o bloqueio atinge e a escolha de manter ou cancelar o que já está marcado.
 */
export const BlocksScreen = (props: BlocksScreenProps) => {
  const {
    businessName,
    today,
    professionals,
    allowWholeBusiness,
    exceptions,
    onPreviewBlock,
    onBlock,
    onRemoveException,
  } = props
  const [chosenId, setChosenId] = useState<string>()

  const subtitle = `${businessName} · bloqueios, folgas e férias`

  if (professionals.status === 'loading') {
    return (
      <PanelPage title="Folgas e bloqueios" subtitle={subtitle}>
        <LoadingState label="Carregando…" />
      </PanelPage>
    )
  }

  if (professionals.status === 'error') {
    return (
      <PanelPage title="Folgas e bloqueios" subtitle={subtitle}>
        <ErrorState message={professionals.message} onRetry={professionals.onRetry} />
      </PanelPage>
    )
  }

  if (professionals.items.length === 0) {
    return (
      <PanelPage title="Folgas e bloqueios" subtitle={subtitle}>
        <p className="type-body text-(--text-muted)">
          Nenhum profissional ativo. Quem pode ser bloqueado aparece aqui quando houver equipe.
        </p>
      </PanelPage>
    )
  }

  const selected = professionals.items.find(({ id }) => id === chosenId) ?? professionals.items[0]!

  const upcoming =
    exceptions.status === 'ready'
      ? {
          status: 'ready' as const,
          items: exceptions.items.map((item) => ({
            id: item.id,
            title: `${KIND_LABELS[item.kind]} · ${item.professionalName ?? 'Estabelecimento inteiro'}`,
            detail: exceptionWhenLabel(item),
            note: item.reason,
            removeLabel: `Remover ${KIND_LABELS[item.kind].toLowerCase()} de ${exceptionWhenLabel(item)}`,
          })),
        }
      : exceptions

  return (
    <PanelPage title="Folgas e bloqueios" subtitle={subtitle}>
      {professionals.items.length > 1 && (
        <ProfessionalSelector
          professionals={professionals.items.map(({ id, name, photo }) => ({
            id,
            name,
            photo,
            hasSchedule: true,
          }))}
          selectedId={selected.id}
          onSelect={setChosenId}
        />
      )}

      <BlockPeriodCard
        professionalId={selected.id}
        today={today}
        allowWholeBusiness={allowWholeBusiness}
        onPreview={async (draft) => (await onPreviewBlock?.(draft)) ?? []}
        onConfirm={async (draft, choice) => (await onBlock?.(draft, choice)) ?? null}
      />

      <RemovableListCard
        id="upcoming-blocks"
        title="Próximos bloqueios"
        items={upcoming}
        emptyText="Nenhum bloqueio daqui para frente."
        confirm={{
          title: 'Remover este bloqueio?',
          description:
            'O período volta a ter horário para agendar. Agendamento cancelado pelo bloqueio não volta.',
          confirmLabel: 'Remover bloqueio',
          dismissLabel: 'Manter bloqueio',
        }}
        removedMessage="Bloqueio removido."
        onRemove={async (id) => {
          if (exceptions.status !== 'ready' || !onRemoveException) return null
          const item = exceptions.items.find((exception) => exception.id === id)
          return item ? onRemoveException(item) : null
        }}
      />
    </PanelPage>
  )
}
