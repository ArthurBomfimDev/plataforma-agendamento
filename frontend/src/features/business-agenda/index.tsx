import type { AgendaMove, BusinessAgendaScreenProps } from './types'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import {
  COUNTER_BOOKING_LABEL,
  ICON_BUTTON,
  SLIDE,
  SWIPE_THRESHOLD,
  confirmAppointment,
  dayLabel,
  findAppointment,
  firstName,
  fullDayLabel,
  initials,
  moveAppointment,
  rejectAppointment,
  shiftDay,
  summaryCards,
  toMinutes,
} from './consts'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { MOCK_AGENDA_DATE, MOCK_BUSINESS, createMockAgendaDay } from './mock'
import { useRef, useState } from 'react'

import { AppointmentDetails } from './components/appointment-details'
import { Avatar } from '@components/avatar'
import { Button } from '@components/button'
import { ConfirmDialog } from '@components/confirm-dialog'
import { DESKTOP_QUERY } from '@hooks/use-media-query/consts'
import { DayGrid } from './components/day-grid'
import { DayList } from './components/day-list'
import { PANEL_CONTENT_BOTTOM_PADDING_WITH_ACTION } from '@components/panel-bottom-navigation/consts'
import { PENDING_BADGE } from '@components/panel-sidebar/consts'
import { cn } from 'cn'
import { format } from 'date-fns'
import { toast } from '@lib/toast'
import { useMediaQuery } from '@hooks/use-media-query'
import { useNow } from '@hooks/use-now'

/**
 * Tela 09 · Painel — Agenda do dia (Figma: 09, desktop; P01, 390px).
 *
 * Desktop: navegação lateral, indicadores e uma coluna por profissional, com arrastar para
 * remarcar. Celular: um profissional por vez, seletor horizontal no topo (ou deslizar o dedo) e o
 * dia como lista cronológica (PROJECT-CONTEXT §4.1). Nos dois, tocar num agendamento abre o detalhe.
 *
 * TODO: confirmar, recusar e remarcar dependem da API de Scheduling; por enquanto só mudam o
 * estado local. Remarcar um confirmado sem o aceite do consumidor é regra de domínio ainda aberta.
 */
export const BusinessAgendaScreen = (props: BusinessAgendaScreenProps) => {
  const { onNavigate, onCounterBooking, onWeekView } = props

  const now = useNow()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [agenda, setAgenda] = useState(() => createMockAgendaDay())
  const [date, setDate] = useState(MOCK_AGENDA_DATE)
  const [dayDirection, setDayDirection] = useState(1)
  const [selectedId, setSelectedId] = useState(agenda.professionals[0]?.id)
  const [professionalDirection, setProfessionalDirection] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<AgendaMove | null>(null)
  // Soltar o dedo depois de deslizar dispara um toque no card de baixo; esse toque é ignorado.
  const swiped = useRef(false)

  // TODO: sem API, só o dia dos wireframes tem dados — e ele faz o papel de "hoje".
  const professionals = date === agenda.date ? agenda.professionals : []
  const selectedIndex = Math.max(
    0,
    professionals.findIndex(({ id }) => id === selectedId),
  )
  const selected = professionals[selectedIndex]
  const pendingRequests = agenda.professionals.reduce((sum, p) => sum + p.pendingRequests, 0)
  const isToday = date === MOCK_AGENDA_DATE
  const title = isToday ? 'Agenda de hoje' : 'Agenda do dia'
  const nowMinutes = isToday ? toMinutes(format(now, 'HH:mm')) : null

  const opened = openId ? findAppointment(agenda, openId) : null
  const rejecting = rejectId ? findAppointment(agenda, rejectId) : null
  const moving = pendingMove ? findAppointment(agenda, pendingMove.entryId) : null
  const moveTarget = professionals.find(({ id }) => id === pendingMove?.professionalId)

  const changeDay = (days: number) => {
    setDayDirection(days)
    setDate((current) => shiftDay(current, days))
  }

  const selectProfessional = (index: number) => {
    const next = professionals[index]
    if (!next || index === selectedIndex) return
    setProfessionalDirection(index > selectedIndex ? 1 : -1)
    setSelectedId(next.id)
  }

  const confirm = (entryId: string) => {
    setAgenda((current) => confirmAppointment(current, entryId))
    setOpenId(null)
    toast.success('Agendamento confirmado')
  }

  const reject = () => {
    if (!rejectId) return
    setAgenda((current) => rejectAppointment(current, rejectId))
    setRejectId(null)
    setOpenId(null)
    toast.success('Pedido recusado. O horário voltou a ficar livre.')
  }

  const move = (next: AgendaMove) => {
    setAgenda((current) => moveAppointment(current, next))
    setPendingMove(null)
    setOpenId(null)
    toast.success(`Agendamento remarcado para ${next.start}`)
  }

  const emptyDay = (
    <p className="type-body text-(--text-muted)">Nenhum dado de agenda para este dia.</p>
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
                <p className="type-caption truncate text-(--text-muted)">{MOCK_BUSINESS.name}</p>
              </div>
              {/* TODO(figma): o ícone de relógio do P01 não tem rótulo; tratado como atalho de Pedidos. */}
              <button
                type="button"
                aria-label="Pedidos pendentes"
                onClick={() => onNavigate?.('requests')}
                className={ICON_BUTTON}
              >
                <Clock aria-hidden="true" className="size-6" />
              </button>
            </div>

            <div className="flex min-h-(--size-touch-min) items-center gap-(--space-8) overflow-hidden rounded-md border border-(--border-interactive) bg-(--bg-surface-raised) px-(--space-4)">
              <button
                type="button"
                aria-label="Dia anterior"
                onClick={() => changeDay(-1)}
                className={cn(ICON_BUTTON, 'text-(--text-link)')}
              >
                <ChevronLeft aria-hidden="true" className="size-5" />
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
                <ChevronRight aria-hidden="true" className="size-5" />
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
                        <span
                          className={cn(
                            PENDING_BADGE,
                            'border border-l-3 border-(--status-pending-fg) px-(--space-4)',
                          )}
                        >
                          {professional.pendingRequests}
                          <span className="sr-only"> pendentes</span>
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </header>

        <main className="px-(--space-16) py-(--space-12) md:mx-auto md:max-w-160">
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
        <div className="flex items-center gap-(--space-16)">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
            <h1 className="type-title text-(--text-strong)">{title}</h1>
            <p className="type-caption text-(--text-muted)">
              {fullDayLabel(date)} · {MOCK_BUSINESS.name}
            </p>
          </div>
          <div role="group" aria-label="Visualização" className="flex gap-(--space-8)">
            <button
              type="button"
              aria-pressed="true"
              className="type-label min-h-(--size-touch-min) rounded-md border border-(--border-focus) bg-(--action-soft) px-(--space-16) py-(--space-8) text-(--text-link) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
            >
              Dia
            </button>
            <button
              type="button"
              aria-pressed="false"
              onClick={onWeekView}
              className="type-label min-h-(--size-touch-min) rounded-md border border-(--border-interactive) bg-(--bg-surface) px-(--space-16) py-(--space-8) text-(--text-body) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
            >
              Semana
            </button>
          </div>
          <Button onClick={() => onCounterBooking?.()}>{COUNTER_BOOKING_LABEL}</Button>
        </div>

        <ul className="grid grid-cols-4 gap-(--space-16)">
          {summaryCards(agenda.summary, pendingRequests).map((card, index) => (
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

        {professionals.length > 0 ? (
          <DayGrid
            professionals={professionals}
            nowMinutes={nowMinutes}
            onOpen={setOpenId}
            onMove={setPendingMove}
            onFitIn={(professionalId, time) => onCounterBooking?.({ professionalId, date, time })}
          />
        ) : (
          emptyDay
        )}
      </main>

      <AppointmentDetails
        selection={opened}
        professionals={professionals}
        side={isDesktop ? 'right' : 'bottom'}
        now={now}
        onClose={() => setOpenId(null)}
        onConfirm={confirm}
        onReject={setRejectId}
        onMove={move}
      />

      <ConfirmDialog
        open={rejecting !== null}
        onOpenChange={(open) => !open && setRejectId(null)}
        title="Recusar este pedido?"
        description={
          rejecting
            ? `${rejecting.entry.serviceName} de ${rejecting.entry.customerName}, às ${rejecting.entry.start}. O horário volta a ficar livre.`
            : ''
        }
        confirmLabel="Recusar pedido"
        dismissLabel="Manter pedido"
        onConfirm={reject}
      />

      <ConfirmDialog
        open={pendingMove !== null}
        onOpenChange={(open) => !open && setPendingMove(null)}
        title="Remarcar este agendamento?"
        description={
          moving && pendingMove
            ? `${moving.entry.serviceName} de ${moving.entry.customerName} passa das ${moving.entry.start} para as ${pendingMove.start}${moveTarget && moveTarget.id !== moving.professional.id ? `, com ${moveTarget.name}` : ''}.`
            : ''
        }
        confirmLabel="Remarcar"
        dismissLabel="Manter horário"
        onConfirm={() => pendingMove && move(pendingMove)}
      />
    </MotionConfig>
  )
}
