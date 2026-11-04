import type {
  Holiday,
  HolidayRule,
  ScheduleProfessional,
  TimeRange,
  WeekSchedule,
  Weekday,
  WorkScheduleScreenProps,
} from './types'
import {
  COMPACT_LABEL,
  KIND_LABELS,
  WEEKDAYS,
  applyRanges,
  exceptionWhenLabel,
  hasSchedule,
  toggleDay,
} from './consts'
import { ErrorState, LoadingState } from '@components/screen-state'
import { type ReactNode, useCallback, useMemo, useState } from 'react'

import { BLOCK_FIELD_IDS } from './components/block-period-card/consts'
import { BlockPeriodCard } from './components/block-period-card'
import { Button } from '@components/button'
import { DateField } from '@components/date-field'
import { HolidaysCard } from './components/holidays-card'
import { MotionConfig } from 'framer-motion'
import { PANEL_CONTENT_BOTTOM_PADDING } from '@components/bottom-navigation/consts'
import { ProfessionalSelector } from './components/professional-selector'
import { RemovableListCard } from './components/removable-list-card'
import { WeekScheduleCard } from './components/week-schedule-card'
import { cn } from 'cn'
import { notify } from '@components/toaster/notify'

const Frame = ({ children }: { children: ReactNode }) => (
  <MotionConfig reducedMotion="user">
    <div
      className={cn(
        'flex flex-col gap-(--space-12) px-(--space-16) pt-[calc(var(--space-16)+env(safe-area-inset-top))] md:mx-auto md:max-w-160 lg:mx-0 lg:max-w-none lg:px-(--space-24) lg:pt-(--space-20)',
        PANEL_CONTENT_BOTTOM_PADDING,
      )}
    >
      {children}
    </div>
  </MotionConfig>
)

/**
 * Tela 12 · Painel — Jornada e bloqueio de período (Onda 7D). Vive dentro do `PanelLayout`: aqui só o conteúdo, ao
 * lado da navegação lateral ou acima da inferior. Só o dono (`RequireOwner`; a API também exige).
 *
 * No celular (não há frame de 390px no Figma) as colunas empilham, a fileira de profissionais rola na horizontal e
 * "Bloquear período" leva até o formulário, que fica depois dos feriados.
 */
export const WorkScheduleScreen = (props: WorkScheduleScreenProps) => {
  const { professionals } = props

  if (professionals.status === 'loading')
    return (
      <Frame>
        <LoadingState label="Carregando as jornadas…" />
      </Frame>
    )
  if (professionals.status === 'error')
    return (
      <Frame>
        <ErrorState message={professionals.message} onRetry={professionals.onRetry} />
      </Frame>
    )
  if (professionals.items.length === 0)
    return (
      <Frame>
        <h1 className="type-heading text-(--text-strong)">Jornada</h1>
        <p role="status" className="type-body text-(--text-muted)">
          Nenhum profissional ativo. Cadastre a equipe em Profissionais.
        </p>
      </Frame>
    )

  return <WorkScheduleEditor {...props} team={professionals.items} />
}

/**
 * A semana de cada profissional fica num rascunho próprio: trocar de profissional não perde o que foi editado.
 * "Salvar jornada" entrega a semana do profissional escolhido, valendo a partir da data escolhida.
 */
const WorkScheduleEditor = (props: WorkScheduleScreenProps & { team: ScheduleProfessional[] }) => {
  const {
    team,
    exceptions,
    holidays,
    initialHolidayRules,
    today,
    onSaveSchedule,
    onRemoveChange,
    onPreviewBlock,
    onBlock,
    onRemoveException,
    onHolidayRuleChange,
  } = props

  const [selectedId, setSelectedId] = useState(team[0].id)
  const [drafts, setDrafts] = useState<Record<string, WeekSchedule>>({})
  const [editingDay, setEditingDay] = useState<Weekday | null>(null)
  const [holidayRules, setHolidayRules] = useState(initialHolidayRules)
  const [from, setFrom] = useState(today)
  const [saving, setSaving] = useState(false)

  // Profissional desativado enquanto a tela estava aberta: volta para o primeiro.
  const selected = team.find(({ id }) => id === selectedId) ?? team[0]
  const schedule = drafts[selected.id] ?? selected.schedule
  const dirty = selected.id in drafts

  // Abrir e fechar o editor do dia ou mudar um feriado não recria a lista do seletor memorizado.
  const selectorOptions = useMemo(
    () =>
      team.map(({ id, name, schedule: saved }) => ({
        id,
        name,
        hasSchedule: hasSchedule(drafts[id] ?? saved),
      })),
    [team, drafts],
  )

  const selectProfessional = useCallback((professionalId: string) => {
    setSelectedId(professionalId)
    setEditingDay(null)
  }, [])

  const updateSchedule = (update: (current: WeekSchedule) => WeekSchedule) =>
    setDrafts((current) => ({
      ...current,
      [selected.id]: update(current[selected.id] ?? selected.schedule),
    }))

  const toggle = (day: Weekday, enabled: boolean) => {
    updateSchedule((current) => toggleDay(current, day, enabled))
    // Desligar o dia em edição fecha o editor; o que estava nele é descartado.
    if (!enabled && editingDay === day) setEditingDay(null)
  }

  const saveDay = (day: Weekday, ranges: TimeRange[], toWorkdays: boolean) => {
    updateSchedule((current) => applyRanges(current, day, ranges, toWorkdays))
    setEditingDay(null)
  }

  const changeHolidayRule = useCallback(
    (holiday: Holiday, rule: HolidayRule) => {
      setHolidayRules((current) => ({ ...current, [holiday.date]: rule }))
      onHolidayRuleChange?.(holiday, rule)
    },
    [onHolidayRuleChange],
  )

  const saveSchedule = async () => {
    if (editingDay) {
      const label = WEEKDAYS.find(({ id }) => id === editingDay)?.label.toLowerCase()
      notify.warning(`Salve ou cancele a edição de ${label} antes de salvar a jornada.`)
      return
    }
    if (!from || from < today) {
      notify.warning('Escolha a partir de quando a jornada vale: hoje ou depois.')
      return
    }
    if (!onSaveSchedule) return
    setSaving(true)
    const failure = await onSaveSchedule(selected.id, schedule, from)
    setSaving(false)
    if (failure) return notify.error(failure)
    notify.success(`Jornada de ${selected.name} salva.`)
    setDrafts(({ [selected.id]: _saved, ...rest }) => rest)
    setFrom(today)
  }

  const goToBlock = () => {
    const field = document.getElementById(BLOCK_FIELD_IDS.kind)
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    field?.focus({ preventScroll: true })
  }

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
    <Frame>
      <header className="flex flex-col gap-(--space-12) lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
          {/* Desktop (12): o título sobe de `heading` para `title`. */}
          <h1 className="type-heading text-(--text-strong) lg:text-(length:--size-title)! lg:leading-(--line-height-title)!">
            Jornada — {selected.name}
          </h1>
          <p className="type-caption text-(--text-muted)">
            {dirty ? 'Alterações ainda não salvas' : 'Definida pelo estabelecimento'}
          </p>
        </div>
        <div className="flex gap-(--space-12)">
          <Button variant="secondary" className="flex-1 lg:flex-none" onClick={goToBlock}>
            Bloquear período
          </Button>
          <Button className="flex-1 lg:flex-none" onClick={saveSchedule} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar jornada'}
          </Button>
        </div>
      </header>

      <ProfessionalSelector
        professionals={selectorOptions}
        selectedId={selected.id}
        onSelect={selectProfessional}
      />

      <div className="flex flex-col gap-(--space-12) xl:flex-row xl:items-start xl:gap-(--space-16)">
        <div className="flex min-w-0 flex-1 flex-col gap-(--space-12)">
          <WeekScheduleCard
            // Trocar de profissional recomeça o cartão, sem editor aberto de quem saiu.
            key={selected.id}
            schedule={schedule}
            editingDay={editingDay}
            onToggleDay={toggle}
            onEditDay={setEditingDay}
            onCancelEdit={() => setEditingDay(null)}
            onSaveDay={saveDay}
            footer={
              <DateField
                id="schedule-effective-from"
                label="Vale a partir de"
                labelClassName={COMPACT_LABEL}
                value={from}
                fromDate={today}
                onValueChange={setFrom}
                className="sm:w-44 sm:shrink-0"
              />
            }
          />
          {selected.changes.length > 0 && (
            <RemovableListCard
              id="scheduled-changes"
              title="Mudanças programadas"
              items={{
                status: 'ready',
                items: selected.changes.map((change) => ({
                  id: change.id,
                  title: change.label,
                  detail: change.validity,
                  removeLabel: `Remover ${change.label.toLowerCase()}, ${change.validity.toLowerCase()}`,
                })),
              }}
              emptyText=""
              confirm={{
                title: 'Remover esta faixa?',
                description:
                  'Os agendamentos já marcados continuam. Pedidos novos deixam de ver este horário.',
                confirmLabel: 'Remover faixa',
                dismissLabel: 'Manter faixa',
              }}
              removedMessage="Faixa removida."
              onRemove={async (id) => {
                const change = selected.changes.find((item) => item.id === id)
                return change && onRemoveChange ? onRemoveChange(change) : null
              }}
            />
          )}
          <HolidaysCard
            holidays={holidays}
            rules={holidayRules}
            onRuleChange={changeHolidayRule}
            note="As regras especiais ainda não são salvas: valem só nesta tela."
          />
        </div>

        <div className="flex flex-col gap-(--space-12) xl:sticky xl:top-(--space-24) xl:w-110 xl:shrink-0">
          <BlockPeriodCard
            professionalId={selected.id}
            today={today}
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
        </div>
      </div>
    </Frame>
  )
}
