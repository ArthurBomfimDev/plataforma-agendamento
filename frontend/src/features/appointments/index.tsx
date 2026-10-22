import type { AppointmentsScreenProps, CustomerAppointment } from './types'
import { Hourglass, MapPin, Star } from 'lucide-react'
import { MOCK_REVIEW_WINDOW_DAYS, createMockAppointments } from './mock'
import { addHours, addMinutes, differenceInMinutes, format, parse } from 'date-fns'

import { AppointmentCard } from '@components/appointment-card'
import { BottomNavigation } from '@components/bottom-navigation'
import { Button } from '@components/button'
import { CONTENT_BOTTOM_PADDING } from '@components/bottom-navigation/conts'
import { ConfirmDialog } from '@components/confirm-dialog'
import { MOCK_CONFIRMATION_HOURS } from '@features/availability/mock'
import { PageContainer } from '@components/page-container'
import { TabBar } from '@components/tab-bar'
import { distanceFormat } from '@components/card-establishment/consts'
import { ptBR } from 'date-fns/locale/pt-BR'
import { toast } from '@lib/toast'
import { useAddToCalendar } from '@hooks/use-add-to-calendar'
import { useNow } from '@hooks/use-now'
import { useState } from 'react'

const UPCOMING = ['pending', 'confirmed']

const parseDay = (date: string) => parse(date, 'yyyy-MM-dd', new Date())

/** Próximos levam o dia da semana ("sex, 11 set"); passados não ("22 ago"). */
const dayLabel = ({ date, status }: CustomerAppointment) =>
  format(parseDay(date), UPCOMING.includes(status) ? 'EEEEEE, d MMM' : 'd MMM', { locale: ptBR })

/** Celular: "Corte masculino · sex, 11 set · 09:30". */
const summary = (appointment: CustomerAppointment) =>
  `${appointment.serviceName} · ${dayLabel(appointment)} · ${appointment.time}`

/** Desktop: "sex, 11 set · 09:30 — 10:00"; passados só com o início, como no 08D. */
const whenLine = (appointment: CustomerAppointment) => {
  const { time, durationMinutes, status } = appointment
  if (!UPCOMING.includes(status)) return `${dayLabel(appointment)} · ${time}`
  const end = format(addMinutes(parse(time, 'HH:mm', new Date(0)), durationMinutes), 'HH:mm')
  return `${dayLabel(appointment)} · ${time} — ${end}`
}

/** "11 h", "40 min". */
const expiryLabel = (remainingMinutes: number) =>
  remainingMinutes >= 60 ? `${Math.floor(remainingMinutes / 60)} h` : `${remainingMinutes} min`

const emptyState = (text: string) => <p className="type-body text-(--text-muted)">{text}</p>

/** Desktop (08D): "Adicionar à agenda" vira a ação principal do card confirmado. */
const PRIMARY_ON_DESKTOP =
  'lg:border-transparent lg:bg-(--action-primary) lg:text-(--text-on-action) lg:hover:bg-(--action-primary-hover) lg:hover:text-(--text-on-action)'

/**
 * Tela 08 · Meus agendamentos (Figma, 390px; desktop: 08D, 1440px).
 */
export const AppointmentsScreen = (props: AppointmentsScreenProps) => {
  const { onNavigate } = props

  const now = useNow()
  const addToCalendar = useAddToCalendar()
  const [appointments, setAppointments] = useState(() => createMockAppointments())
  const [cancelTarget, setCancelTarget] = useState<CustomerAppointment | null>(null)

  const upcoming = appointments.filter(({ status }) => UPCOMING.includes(status))
  const toReview = appointments.filter(
    ({ status, reviewable }) => status === 'completed' && reviewable,
  )
  const past = appointments.filter(
    ({ status }) => !UPCOMING.includes(status) && status !== 'cancelled',
  )
  const cancelled = appointments.filter(({ status }) => status === 'cancelled')

  // TODO: cancelar de verdade depende da API de Scheduling; por enquanto só muda o estado local.
  const confirmCancel = () => {
    if (!cancelTarget) return
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === cancelTarget.id ? { ...appointment, status: 'cancelled' } : appointment,
      ),
    )
    toast.success(cancelTarget.status === 'pending' ? 'Pedido cancelado' : 'Agendamento cancelado')
    setCancelTarget(null)
  }

  const renderCard = (appointment: CustomerAppointment) => {
    const { id, businessName, serviceName, durationMinutes, status, requestedAt } = appointment
    const { address, distanceKm } = appointment

    const common = {
      businessName,
      status,
      summary: summary(appointment),
      serviceLine: `${serviceName} · ${durationMinutes} min`,
      whenLine: whenLine(appointment),
    }

    if (status === 'pending') {
      const remaining = requestedAt
        ? differenceInMinutes(addHours(requestedAt, MOCK_CONFIRMATION_HOURS), now)
        : 0

      return (
        <AppointmentCard
          {...common}
          highlight
          detail={
            <p className="type-caption tabular flex items-center gap-(--space-4) text-(--marker-urgent-fg)">
              <Hourglass aria-hidden="true" className="size-4 shrink-0" />
              {remaining > 0
                ? `Aguardando confirmação — expira em ${expiryLabel(remaining)}`
                : 'Prazo de confirmação encerrado'}
            </p>
          }
          actions={
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setCancelTarget(appointment)}
            >
              Cancelar pedido
            </Button>
          }
        />
      )
    }

    if (status === 'confirmed') {
      return (
        <AppointmentCard
          {...common}
          detail={
            address && (
              <p className="type-caption tabular flex items-center gap-(--space-4) text-(--text-muted)">
                <MapPin aria-hidden="true" className="size-4 shrink-0" />
                {address}
                {distanceKm !== undefined && ` — ${distanceFormat.format(distanceKm)} km`}
              </p>
            )
          }
          actions={
            // TODO: a regra 7 do modelo de domínio só deixa o consumidor cancelar até
            // `CancellationWindowHours` antes; sem API, o botão aparece sempre.
            <div className="flex gap-(--space-8)">
              <Button
                variant="secondary"
                className="min-w-0 flex-1 lg:flex-none"
                aria-label={`Cancelar agendamento em ${businessName}`}
                onClick={() => setCancelTarget(appointment)}
              >
                Cancelar
              </Button>
              <Button
                variant="secondary"
                className={`min-w-0 flex-1 lg:flex-none ${PRIMARY_ON_DESKTOP}`}
                onClick={() =>
                  addToCalendar({
                    id,
                    title: `${serviceName} — ${businessName}`,
                    location: address,
                    date: appointment.date,
                    time: appointment.time,
                    durationMinutes,
                    timeZone: appointment.timeZone,
                  })
                }
              >
                Adicionar à agenda
              </Button>
            </div>
          }
        />
      )
    }

    const reviewable = status === 'completed' && appointment.reviewable
    const reviewWindow = `Você tem ${MOCK_REVIEW_WINDOW_DAYS} dias para avaliar.`

    return (
      <AppointmentCard
        {...common}
        detail={
          reviewable && (
            <p className="type-caption hidden items-center gap-(--space-4) text-(--text-muted) lg:flex">
              <Star aria-hidden="true" className="size-4 shrink-0" />
              {reviewWindow}
            </p>
          )
        }
        actions={
          reviewable && (
            // TODO: a tela de avaliação ainda não existe; o botão não faz nada.
            <div className="flex flex-col gap-(--space-12)">
              <Button className="w-full">Avaliar atendimento</Button>
              <p className="type-caption text-(--text-muted) lg:hidden">{reviewWindow}</p>
            </div>
          )
        }
      />
    )
  }

  const list = (items: CustomerAppointment[]) => (
    <ul className="flex flex-col gap-(--space-16)">
      {items.map((appointment) => (
        <li key={appointment.id}>{renderCard(appointment)}</li>
      ))}
    </ul>
  )

  return (
    <div className={`min-h-dvh bg-(--bg-page) ${CONTENT_BOTTOM_PADDING}`}>
      <PageContainer width="medium">
        <header className="bg-(--bg-surface) px-(--space-16) pt-[calc(var(--space-20)+env(safe-area-inset-top))] pb-(--space-12) md:bg-transparent lg:px-0 lg:pt-(--space-24) lg:pb-(--space-20)">
          <h1 className="type-title text-(--text-strong) lg:text-(length:--size-display)! lg:leading-(--line-height-display)!">
            Meus agendamentos
          </h1>
        </header>

        <main>
          <TabBar
            label="Agendamentos"
            listClassName="md:bg-transparent lg:gap-(--space-32) lg:px-0"
            panelClassName="p-(--space-16) lg:px-0 lg:pt-(--space-16)"
            items={[
              {
                id: 'upcoming',
                label: 'Próximos',
                content: (
                  <div className="flex flex-col gap-(--space-16)">
                    {upcoming.length > 0
                      ? list(upcoming)
                      : emptyState('Nenhum agendamento próximo.')}
                    {toReview.length > 0 && (
                      <section
                        aria-labelledby="appointments-to-review"
                        className="flex flex-col gap-(--space-16)"
                      >
                        {/* No desktop (08D) os concluídos seguem na mesma lista, sem título. */}
                        <h2
                          id="appointments-to-review"
                          className="type-heading text-(--text-strong) lg:sr-only"
                        >
                          Concluídos
                        </h2>
                        {list(toReview)}
                      </section>
                    )}
                  </div>
                ),
              },
              {
                id: 'past',
                label: 'Passados',
                content: past.length > 0 ? list(past) : emptyState('Nenhum agendamento passado.'),
              },
              {
                id: 'cancelled',
                label: 'Cancelados',
                content:
                  cancelled.length > 0
                    ? list(cancelled)
                    : emptyState('Nenhum agendamento cancelado.'),
              },
            ]}
          />
        </main>
      </PageContainer>

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title={
          cancelTarget?.status === 'pending'
            ? 'Cancelar este pedido?'
            : 'Cancelar este agendamento?'
        }
        description={
          cancelTarget
            ? `${summary(cancelTarget)}, em ${cancelTarget.businessName}. Para outro horário, é preciso fazer um novo pedido.`
            : ''
        }
        confirmLabel={
          cancelTarget?.status === 'pending' ? 'Cancelar pedido' : 'Cancelar agendamento'
        }
        dismissLabel={cancelTarget?.status === 'pending' ? 'Manter pedido' : 'Manter agendamento'}
        onConfirm={confirmCancel}
      />

      <BottomNavigation activeItem="appointments" onNavigate={onNavigate} />
    </div>
  )
}
