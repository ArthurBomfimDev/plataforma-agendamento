import type { AgendaAction, BusinessAgendaScreenProps } from './types'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import {
  ACTION_SUCCESS,
  ICON_BUTTON,
  SLIDE,
  SWIPE_THRESHOLD,
  dayLabel,
  findAppointment,
  firstName,
  fullDayLabel,
  initials,
  occupancyOf,
  shiftDay,
  summaryCards,
  summarize,
  toMinutes,
} from './consts'
import { ChevronLeftIcon, ChevronRightIcon, ScheduleIcon } from '@assets/icons'
import { ErrorState, LoadingState } from '@components/screen-state'
import { useRef, useState } from 'react'

import { AgendaHeader } from '../components/agenda-header'
import { AppointmentDetails } from './components/appointment-details'
import { Avatar } from '@components/avatar'
import { ConfirmDialog } from '@components/confirm-dialog'
import { DESKTOP_QUERY } from '@hooks/use-media-query/consts'
import { DayGrid } from './components/day-grid'
import { DayList } from './components/day-list'
import { PANEL_CONTENT_BOTTOM_PADDING_WITH_ACTION } from '@components/bottom-navigation/consts'
import { PendingBadge } from '@components/pending-badge'
import { cn } from 'cn'
import { format } from 'date-fns'
import { notify } from '@components/toaster/notify'
import { useMediaQuery } from '@hooks/use-media-query'
import { useNow } from '@hooks/use-now'

/** Ações que pedem confirmação antes: o texto do diálogo de cada uma. */
const ASK: Partial<
  Record<AgendaAction, { title: string; confirmLabel: string; dismissLabel: string; tail: string }>
> = {
  reject: {
    title: 'Recusar este pedido?',
    confirmLabel: 'Recusar pedido',
    dismissLabel: 'Manter pedido',
    tail: 'O horário volta a ficar livre.',
  },
  noShow: {
    title: 'Marcar falta?',
    confirmLabel: 'Marcar falta',
    dismissLabel: 'Voltar',
    tail: 'Fica registrado que o consumidor não veio.',
  },
  cancel: {
    title: 'Cancelar este agendamento?',
    confirmLabel: 'Cancelar agendamento',
    dismissLabel: 'Manter agendamento',
    tail: 'O horário volta a ficar livre e o consumidor é avisado.',
  },
}

/**
 * Tela 09 · Painel — Agenda do dia (Figma: 09, desktop; P01, 390px).
 *
 * Desktop: navegação lateral, indicadores e uma coluna por profissional. Celular: um profissional
 * por vez, seletor horizontal no topo (ou deslizar o dedo) e o dia como lista cronológica
 * (PROJECT-CONTEXT §4.1). Nos dois, tocar num agendamento abre o detalhe.
 *
 * Os dados vêm da API pela rota (`panel-agenda-route`). Remarcar não existe no backend (Onda 7A): o
 * detalhe oferece cancelar, e o consumidor agenda de novo.
 */
export const BusinessAgendaScreen = (props: BusinessAgendaScreenProps) => {
  const {
    businessName,
    today,
    date,
    onDateChange,
    agenda,
    onAction,
    onNavigate,
    onCounterBooking,
    controls,
    filtered = false,
  } = props

  const now = useNow()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [dayDirection, setDayDirection] = useState(1)
  const [selectedId, setSelectedId] = useState<string>()
  const [professionalDirection, setProfessionalDirection] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)
  const [asking, setAsking] = useState<{ action: AgendaAction; entryId: string } | null>(null)
  const [busy, setBusy] = useState(false)
  // Soltar o dedo depois de deslizar dispara um toque no card de baixo; esse toque é ignorado.
  const swiped = useRef(false)

  const day = agenda.status === 'ready' ? agenda.day : null
  const professionals = day?.professionals ?? []
  const selectedIndex = Math.max(
    0,
    professionals.findIndex(({ id }) => id === selectedId),
  )
  const selected = professionals[selectedIndex]
  const isToday = date === today
  const title = isToday ? 'Agenda de hoje' : 'Agenda do dia'
  const nowMinutes = isToday ? toMinutes(format(now, 'HH:mm')) : null
  const summary = day?.summary ?? summarize([])

  const opened = openId && day ? findAppointment(day, openId) : null
  const askedFor = asking && day ? findAppointment(day, asking.entryId) : null
  const askText = asking ? ASK[asking.action] : undefined

  const changeDay = (days: number) => {
    setDayDirection(days)
    onDateChange(shiftDay(date, days))
  }

  const selectProfessional = (index: number) => {
    const next = professionals[index]
    if (!next || index === selectedIndex) return
    setProfessionalDirection(index > selectedIndex ? 1 : -1)
    setSelectedId(next.id)
  }

  const run = async (action: AgendaAction, entryId: string) => {
    setBusy(true)
    try {
      if (await onAction(action, entryId)) {
        notify.success(ACTION_SUCCESS[action])
        setOpenId(null)
      }
    } finally {
      setBusy(false)
      setAsking(null)
    }
  }

  const noAppointments = day !== null && summary.appointmentsCount === 0 && (
    <p role="status" className="type-body text-(--text-muted)">
      {filtered
        ? 'Nenhum agendamento com esses filtros neste dia.'
        : isToday
          ? 'Nenhum agendamento hoje.'
          : 'Nenhum agendamento neste dia.'}
    </p>
  )

  const emptyDay =
    agenda.status === 'loading' ? (
      <LoadingState label="Carregando a agenda…" />
    ) : agenda.status === 'error' ? (
      <ErrorState message={agenda.message} onRetry={agenda.onRetry} />
    ) : (
      <p className="type-body text-(--text-muted)">Nenhum profissional atende neste dia.</p>
    )

  return (
    // Quem pediu menos movimento no sistema vê as trocas sem deslizar.
    <MotionConfig reducedMotion="user">
      {/* As navegações e o "+ Marcação de balcão" do celular ficam no `PanelLayout`. */}
      {/* Celular e tablet (P01) */}
      <div className={cn('overflow-x-clip lg:hidden', PANEL_CONTENT_BOTTOM_PADDING_WITH_ACTION)}>
        <header className="sticky top-0 z-10 border-b border-(--border-subtle) bg-(--bg-surface) pt-[calc(var(--space-16)+env(safe-area-inset-top))] pb-(--space-12)">
          <div className="flex flex-col gap-(--space-12) px-(--space-16) md:mx-auto md:max-w-160">
            <div className="flex items-center gap-(--space-12)">
              <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                <h1 className="type-heading text-(--text-strong)">{title}</h1>
                <p className="type-caption truncate text-(--text-muted)">{businessName}</p>
              </div>
              {/* TODO(figma): o ícone de relógio do P01 não tem rótulo; tratado como atalho de Pedidos. */}
              <button
                type="button"
                aria-label="Pedidos pendentes"
                onClick={() => onNavigate?.('requests')}
                className={ICON_BUTTON}
              >
                <ScheduleIcon aria-hidden="true" className="size-6" />
              </button>
            </div>

            <div className="flex min-h-(--size-touch-min) items-center gap-(--space-8) overflow-hidden rounded-md border border-(--border-interactive) bg-(--bg-surface-raised) px-(--space-4)">
              <button
                type="button"
                aria-label="Dia anterior"
                onClick={() => changeDay(-1)}
                className={cn(ICON_BUTTON, 'text-(--text-link)')}
              >
                <ChevronLeftIcon aria-hidden="true" className="size-5" />
              </button>
              <div aria-live="polite" className="relative min-w-0 flex-1 text-center">
                <AnimatePresence mode="popLayout" initial={false} custom={dayDirection}>
                  <motion.p
                    key={date}
                    custom={dayDirection}
                    variants={SLIDE}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="type-label text-(--text-strong)"
                  >
                    {dayLabel(date)}
                  </motion.p>
                </AnimatePresence>
              </div>
              <button
                type="button"
                aria-label="Próximo dia"
                onClick={() => changeDay(1)}
                className={cn(ICON_BUTTON, 'text-(--text-link)')}
              >
                <ChevronRightIcon aria-hidden="true" className="size-5" />
              </button>
            </div>
          </div>

          {professionals.length > 0 && (
            <ul
              aria-label="Profissional"
              className="scrollbar-none mt-(--space-12) flex gap-(--space-8) overflow-x-auto px-(--space-16) md:mx-auto md:max-w-160"
            >
              {professionals.map((professional, index) => {
                const active = index === selectedIndex

                return (
                  <li key={professional.id} className="shrink-0">
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectProfessional(index)}
                      className="type-label relative isolate flex min-h-(--size-touch-min) items-center gap-(--space-8) rounded-(--radius-full) border border-(--border-interactive) bg-(--bg-surface) py-(--space-8) pr-(--space-12) pl-(--space-8) text-(--text-body) transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) aria-pressed:border-transparent aria-pressed:text-(--text-link)"
                    >
                      {/* A pílula escolhida desliza de um profissional para o outro. */}
                      {active && (
                        <motion.span
                          layoutId="agenda-professional-pill"
                          aria-hidden
                          transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
                          className="absolute -inset-px -z-10 rounded-(--radius-full) border-2 border-(--border-focus) bg-(--action-soft)"
                        />
                      )}
                      <Avatar alt="" initials={initials(professional.name)} size="sm" />
                      {firstName(professional.name)}
                      {professional.pendingRequests > 0 && (
                        <PendingBadge
                          count={professional.pendingRequests}
                          className="border border-l-3 border-(--status-pending-fg) px-(--space-4)"
                        />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </header>

        <main className="flex flex-col gap-(--space-12) px-(--space-16) py-(--space-12) md:mx-auto md:max-w-160">
          {/* O dia anda pelo seletor do cabeçalho; aqui, a visão e os filtros. */}
          {controls?.viewSwitch}
          {controls?.filters}
          {noAppointments}
          {selected ? (
            <AnimatePresence mode="popLayout" initial={false} custom={professionalDirection}>
              {/* Deslizar o dedo para os lados troca de profissional; na vertical, rola. */}
              <motion.div
                key={`${date}-${selected.id}`}
                custom={professionalDirection}
                variants={SLIDE}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22 }}
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragStart={() => (swiped.current = true)}
                onDragEnd={(_, info) => {
                  setTimeout(() => (swiped.current = false))
                  if (info.offset.x < -SWIPE_THRESHOLD) selectProfessional(selectedIndex + 1)
                  else if (info.offset.x > SWIPE_THRESHOLD) selectProfessional(selectedIndex - 1)
                }}
                onClickCapture={(event) => {
                  if (!swiped.current) return
                  event.stopPropagation()
                  event.preventDefault()
                }}
                className="touch-pan-y"
              >
                <DayList
                  professional={selected}
                  now={now}
                  onOpen={setOpenId}
                  onFitIn={(time) =>
                    onCounterBooking?.({ professionalId: selected.id, date, time })
                  }
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            emptyDay
          )}
        </main>
      </div>

      {/* Desktop (09) */}
      <main className="hidden min-w-0 flex-1 flex-col gap-(--space-16) p-(--space-24) lg:flex">
        <AgendaHeader
          title={title}
          caption={`${fullDayLabel(date)} · ${businessName}`}
          controls={controls}
          onCounterBooking={() => onCounterBooking?.()}
        />

        <ul className="grid grid-cols-4 gap-(--space-16)">
          {summaryCards(summary, occupancyOf(professionals), isToday).map((card, index) => (
            <motion.li
              key={card.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              className="flex flex-col gap-(--space-4) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16)"
            >
              <p className="type-caption text-(--text-muted)">{card.label}</p>
              <p className="type-title tabular text-(--text-strong)">{card.value}</p>
              <p className={cn('type-caption text-(--text-muted)', card.captionClassName)}>
                {card.caption}
              </p>
            </motion.li>
          ))}
        </ul>

        {noAppointments}
        {professionals.length > 0 ? (
          <DayGrid
            professionals={professionals}
            nowMinutes={nowMinutes}
            onOpen={setOpenId}
            onMove={() => undefined}
            onFitIn={(professionalId, time) => onCounterBooking?.({ professionalId, date, time })}
          />
        ) : (
          emptyDay
        )}
      </main>

      <AppointmentDetails
        selection={opened}
        side={isDesktop ? 'right' : 'bottom'}
        now={now}
        busy={busy}
        onClose={() => setOpenId(null)}
        onAction={(action, entryId) => void run(action, entryId)}
        onAskConfirm={(action, entryId) => setAsking({ action, entryId })}
      />

      <ConfirmDialog
        open={asking !== null}
        onOpenChange={(open) => !open && setAsking(null)}
        title={askText?.title ?? ''}
        description={
          askedFor && askText
            ? `${askedFor.entry.serviceName} de ${askedFor.entry.customerName}, às ${askedFor.entry.start}. ${askText.tail}`
            : ''
        }
        confirmLabel={askText?.confirmLabel ?? ''}
        dismissLabel={askText?.dismissLabel ?? ''}
        onConfirm={() => asking && void run(asking.action, asking.entryId)}
      />
    </MotionConfig>
  )
}
