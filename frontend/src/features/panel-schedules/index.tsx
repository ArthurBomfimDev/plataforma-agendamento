import type { ExceptionItem, ScheduleRow, SchedulesScreenProps } from './types'
import {
  KIND_LABELS,
  WEEKDAYS,
  exceptionWhenLabel,
  newScheduleDraft,
  rowsOfDay,
  validityLabel,
} from './consts'
import { ErrorState, LoadingState } from '@components/screen-state'
import { PANEL_CARD, PanelPage } from '@components/panel-page'
import { Pencil, Trash2 } from 'lucide-react'

import { Button } from '@components/button'
import { ConfirmDialog } from '@components/confirm-dialog'
import { ExceptionSheet } from './components/exception-sheet'
import { ICON_BUTTON } from '@features/business-agenda/consts'
import { ScheduleSheet } from './components/schedule-sheet'
import { SelectField } from '@components/select-field'
import { cn } from 'cn'
import { toast } from '@lib/toast'
import { useState } from 'react'

const ROW_BUTTON = cn(ICON_BUTTON, 'text-(--text-body) hover:bg-(--bg-surface-raised)')

/**
 * Painel — Jornadas e bloqueios (Onda 7D). Em cima, a jornada semanal de um profissional por vez (o
 * mesmo padrão "um por vez" da agenda no celular); embaixo, os bloqueios que ainda não terminaram.
 * Só o dono (`RequireOwner`; a API também exige).
 *
 * Bloqueio não tem edição na API: para mudar, remove e cria de novo.
 */
export const SchedulesScreen = (props: SchedulesScreenProps) => {
  const {
    businessName,
    professionals,
    selectedId,
    onSelect,
    schedules,
    exceptions,
    today,
    onSaveSchedule,
    onRemoveSchedule,
    onPreviewException,
    onAddException,
    onRemoveException,
  } = props

  const [editing, setEditing] = useState<{ row: ScheduleRow | null; day: number } | null>(null)
  const [removing, setRemoving] = useState<ScheduleRow | null>(null)
  const [addingException, setAddingException] = useState(false)
  const [removingException, setRemovingException] = useState<ExceptionItem | null>(null)

  const selected = professionals.find(({ id }) => id === selectedId)
  const rows = schedules.status === 'ready' ? schedules.items : []

  const runRemoval = async (task: Promise<string | null> | undefined, success: string) => {
    const failure = (await task) ?? null
    if (failure) toast.error(failure)
    else toast.success(success)
  }

  return (
    <PanelPage title="Jornadas e bloqueios" subtitle={businessName}>
      <section aria-labelledby="schedules-week" className={PANEL_CARD}>
        <h2 id="schedules-week" className="type-label text-(--text-strong)">
          Jornada semanal
        </h2>

        {professionals.length === 0 ? (
          <p role="status" className="type-body text-(--text-muted)">
            Nenhum profissional ativo. Cadastre a equipe em Profissionais.
          </p>
        ) : (
          <>
            <SelectField
              id="schedules-professional"
              label="Profissional"
              value={selectedId ?? ''}
              options={professionals.map(({ id, name }) => ({ value: id, label: name }))}
              onChange={(event) => onSelect(event.target.value)}
            />

            {schedules.status === 'loading' ? (
              <LoadingState label="Carregando a jornada…" />
            ) : schedules.status === 'error' ? (
              <ErrorState message={schedules.message} onRetry={schedules.onRetry} />
            ) : (
              <>
                {rows.length === 0 && (
                  <p role="status" className="type-body text-(--text-muted)">
                    {selected?.name ?? 'Este profissional'} ainda não tem jornada: não aparece
                    horário para agendar com ele.
                  </p>
                )}
                <ul className="flex flex-col divide-y divide-(--border-subtle)">
                  {WEEKDAYS.map(({ day, label }) => {
                    const ofDay = rowsOfDay(rows, day)
                    return (
                      <li key={day} className="flex flex-col gap-(--space-4) py-(--space-8)">
                        <div className="flex items-center gap-(--space-8)">
                          <h3 className="type-label min-w-0 flex-1 text-(--text-body)">{label}</h3>
                          <Button
                            variant="ghost"
                            aria-label={`Adicionar horário: ${label.toLowerCase()}`}
                            onClick={() => setEditing({ row: null, day })}
                          >
                            Adicionar
                          </Button>
                        </div>
                        {ofDay.length === 0 ? (
                          <p className="type-caption text-(--text-muted)">Fechado</p>
                        ) : (
                          <ul className="flex flex-col gap-(--space-4)">
                            {ofDay.map((row) => (
                              <li key={row.id} className="flex items-center gap-(--space-8)">
                                <div className="flex min-w-0 flex-1 flex-col">
                                  <p className="type-body tabular text-(--text-strong)">
                                    {row.start} – {row.end}
                                  </p>
                                  <p className="type-caption text-(--text-muted)">
                                    {validityLabel(row)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  aria-label={`Editar ${label.toLowerCase()}, ${row.start} às ${row.end}`}
                                  className={ROW_BUTTON}
                                  onClick={() => setEditing({ row, day })}
                                >
                                  <Pencil aria-hidden="true" className="size-5" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Remover ${label.toLowerCase()}, ${row.start} às ${row.end}`}
                                  className={ROW_BUTTON}
                                  onClick={() => setRemoving(row)}
                                >
                                  <Trash2 aria-hidden="true" className="size-5" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="schedules-exceptions" className={PANEL_CARD}>
        <div className="flex items-center gap-(--space-8)">
          <h2 id="schedules-exceptions" className="type-label min-w-0 flex-1 text-(--text-strong)">
            Bloqueios, folgas e férias
          </h2>
          <Button variant="secondary" onClick={() => setAddingException(true)}>
            Novo bloqueio
          </Button>
        </div>

        {exceptions.status === 'loading' ? (
          <LoadingState label="Carregando os bloqueios…" />
        ) : exceptions.status === 'error' ? (
          <ErrorState message={exceptions.message} onRetry={exceptions.onRetry} />
        ) : exceptions.items.length === 0 ? (
          <p role="status" className="type-body text-(--text-muted)">
            Nenhum bloqueio daqui para frente.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-(--border-subtle)">
            {exceptions.items.map((item) => (
              <li key={item.id} className="flex items-center gap-(--space-8) py-(--space-8)">
                <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                  <p className="type-label text-(--text-strong)">
                    {KIND_LABELS[item.kind]} · {item.professionalName ?? 'Estabelecimento inteiro'}
                  </p>
                  <p className="type-caption tabular text-(--text-body)">
                    {exceptionWhenLabel(item)}
                  </p>
                  {item.reason && <p className="type-caption text-(--text-muted)">{item.reason}</p>}
                </div>
                <button
                  type="button"
                  aria-label={`Remover ${KIND_LABELS[item.kind].toLowerCase()} de ${exceptionWhenLabel(item)}`}
                  className={ROW_BUTTON}
                  onClick={() => setRemovingException(item)}
                >
                  <Trash2 aria-hidden="true" className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ScheduleSheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        professionalName={selected?.name ?? ''}
        editing={editing?.row != null}
        initial={
          editing?.row
            ? {
                dayOfWeek: editing.row.dayOfWeek,
                start: editing.row.start,
                end: editing.row.end,
                effectiveFrom: editing.row.effectiveFrom,
                effectiveTo: editing.row.effectiveTo,
              }
            : newScheduleDraft(today, editing?.day)
        }
        onSave={async (draft) => {
          const failure = (await onSaveSchedule?.(editing?.row?.id ?? null, draft)) ?? null
          if (!failure) {
            setEditing(null)
            toast.success('Horário salvo.')
          }
          return failure
        }}
      />

      <ExceptionSheet
        open={addingException}
        onOpenChange={setAddingException}
        professionals={professionals}
        today={today}
        onPreview={async (draft) => (await onPreviewException?.(draft)) ?? []}
        onAdd={async (draft, choice) => {
          const failure = (await onAddException?.(draft, choice)) ?? null
          if (!failure) setAddingException(false)
          return failure
        }}
      />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remover este horário?"
        description="Os agendamentos já marcados continuam. Pedidos novos deixam de ver este horário."
        confirmLabel="Remover horário"
        dismissLabel="Manter horário"
        onConfirm={() => {
          if (removing) void runRemoval(onRemoveSchedule?.(removing), 'Horário removido.')
          setRemoving(null)
        }}
      />

      <ConfirmDialog
        open={removingException !== null}
        onOpenChange={(open) => !open && setRemovingException(null)}
        title="Remover este bloqueio?"
        description="O período volta a ter horário para agendar. Agendamento cancelado pelo bloqueio não volta."
        confirmLabel="Remover bloqueio"
        dismissLabel="Manter bloqueio"
        onConfirm={() => {
          if (removingException)
            void runRemoval(onRemoveException?.(removingException), 'Bloqueio removido.')
          setRemovingException(null)
        }}
      />
    </PanelPage>
  )
}
