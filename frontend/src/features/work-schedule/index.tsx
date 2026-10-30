import type {
  Holiday,
  HolidayRule,
  TimeRange,
  WeekSchedule,
  Weekday,
  WorkScheduleScreenProps,
} from './types'
import { MotionConfig } from 'framer-motion'
import { WEEKDAYS, applyRanges, hasSchedule, toggleDay } from './consts'
import { useCallback, useMemo, useState } from 'react'

import { BLOCK_FIELD_IDS } from './components/block-period-card/consts'
import { BlockPeriodCard } from './components/block-period-card'
import { Button } from '@components/button'
import { HolidaysCard } from './components/holidays-card'
import { PANEL_CONTENT_BOTTOM_PADDING } from '@components/panel-bottom-navigation/consts'
import { ProfessionalSelector } from './components/professional-selector'
import { WeekScheduleCard } from './components/week-schedule-card'
import { cn } from 'cn'
import { toast } from '@lib/toast'

/**
 * Tela 12 · Painel — Jornada e bloqueio de período (Figma: 12, desktop). Vive dentro do
 * `PanelLayout`: aqui só o conteúdo, ao lado da navegação lateral ou acima da inferior.
 *
 * A semana de cada profissional fica num rascunho próprio: trocar de profissional não perde o que
 * foi editado. "Salvar jornada" entrega a semana do profissional escolhido.
 *
 * TODO(figma): não há frame de 390px. No celular as colunas empilham, a fileira de profissionais
 * rola na horizontal e "Bloquear período" leva até o formulário, que fica depois dos feriados.
 *
 * TODO: salvar, bloquear e a regra de feriado dependem da API de Availability; por enquanto a tela
 * só entrega os dados validados.
 */
export const WorkScheduleScreen = (props: WorkScheduleScreenProps) => {
  const {
    professionals,
    appointments,
    holidays,
    initialHolidayRules,
    today,
    initialBlock,
    onSaveSchedule,
    onBlockPeriod,
    onHolidayRuleChange,
  } = props

  const [selectedId, setSelectedId] = useState(professionals[0].id)
  const [schedules, setSchedules] = useState<Record<string, WeekSchedule>>(() =>
    Object.fromEntries(professionals.map(({ id, schedule }) => [id, schedule])),
  )
  const [editingDay, setEditingDay] = useState<Weekday | null>(null)
  const [holidayRules, setHolidayRules] = useState(initialHolidayRules)

  const selected = professionals.find(({ id }) => id === selectedId) ?? professionals[0]
  const schedule = schedules[selected.id]

  // Abrir e fechar o editor do dia ou mudar um feriado não recria a lista do seletor memorizado.
  const selectorOptions = useMemo(
    () =>
      professionals.map(({ id, name }) => ({ id, name, hasSchedule: hasSchedule(schedules[id]) })),
    [professionals, schedules],
  )

  const selectProfessional = useCallback((professionalId: string) => {
    setSelectedId(professionalId)
    setEditingDay(null)
  }, [])

  const updateSchedule = (update: (current: WeekSchedule) => WeekSchedule) =>
    setSchedules((current) => ({ ...current, [selected.id]: update(current[selected.id]) }))

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

  const saveSchedule = () => {
    if (editingDay) {
      const label = WEEKDAYS.find(({ id }) => id === editingDay)?.label.toLowerCase()
      toast.warning(`Salve ou cancele a edição de ${label} antes de salvar a jornada.`)
      return
    }
    onSaveSchedule?.(selected.id, schedule)
  }

  const goToBlock = () => {
    const field = document.getElementById(BLOCK_FIELD_IDS.type)
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    field?.focus({ preventScroll: true })
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          'flex flex-col gap-(--space-12) px-(--space-16) pt-[calc(var(--space-16)+env(safe-area-inset-top))] md:mx-auto md:max-w-160 lg:mx-0 lg:max-w-none lg:px-(--space-24) lg:pt-(--space-20)',
          PANEL_CONTENT_BOTTOM_PADDING,
        )}
      >
        <header className="flex flex-col gap-(--space-12) lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            {/* Desktop (12): o título sobe de `heading` para `title`. */}
            <h1 className="type-heading text-(--text-strong) lg:text-(length:--size-title)! lg:leading-(--line-height-title)!">
              Jornada — {selected.name}
            </h1>
            <p className="type-caption text-(--text-muted)">Definida pelo estabelecimento</p>
          </div>
          <div className="flex gap-(--space-12)">
            <Button variant="secondary" className="flex-1 lg:flex-none" onClick={goToBlock}>
              Bloquear período
            </Button>
            <Button className="flex-1 lg:flex-none" onClick={saveSchedule}>
              Salvar jornada
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
            />
            <HolidaysCard
              holidays={holidays}
              rules={holidayRules}
              onRuleChange={changeHolidayRule}
            />
          </div>

          <BlockPeriodCard
            professionalId={selected.id}
            appointments={appointments}
            today={today}
            initialValues={initialBlock}
            onConfirm={(draft) => onBlockPeriod?.(draft)}
            className="xl:sticky xl:top-(--space-24) xl:w-110 xl:shrink-0"
          />
        </div>
      </div>
    </MotionConfig>
  )
}
