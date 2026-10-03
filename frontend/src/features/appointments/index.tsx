import { Hourglass, MapPin } from 'lucide-react'
import { MOCK_REVIEW_WINDOW_DAYS, createMockAppointments } from './mock'
import type { AppointmentsScreenProps, CustomerAppointment } from './types'
import { addHours, differenceInMinutes, format, parse } from 'date-fns'

import { AppointmentCard } from '../../components/appointment-card'
import { BottomNavigation } from '../../components/bottom-navigation'
import { Button } from '../../components/button'
import { CONTENT_BOTTOM_PADDING } from '../../components/bottom-navigation/conts'
import { ConfirmDialog } from '../../components/confirm-dialog'
import { MOCK_CONFIRMATION_HOURS } from '../availability/mock'
import { TabBar } from '../../components/tab-bar'
import { distanceFormat } from '../../components/card-establishment/consts'
import { ptBR } from 'date-fns/locale/pt-BR'
import { toast } from '../../lib/toast'
import { useAddToCalendar } from '../../hooks/useAddToCalendar'
import { useNow } from '../../hooks/useNow'
import { useState } from 'react'

const UPCOMING = ['pending', 'confirmed']

const parseDay = (date: string) => parse(date, 'yyyy-MM-dd', new Date())

/** "Corte masculino · sex, 11 set · 09:30"; passados sem dia da semana: "… · 22 ago · 10:00". */
const summary = ({ serviceName, date, time, status }: CustomerAppointment) => {
  const pattern = UPCOMING.includes(status) ? 'EEEEEE, d MMM' : 'd MMM'
  return `${serviceName} · ${format(parseDay(date), pattern, { locale: ptBR })} · ${time}`
}

/** "11 h", "40 min". */
const expiryLabel = (remainingMinutes: number) =>
  remainingMinutes >= 60 ? `${Math.floor(remainingMinutes / 60)} h` : `${remainingMinutes} min`

const emptyState = (text: string) => <p className="type-body text-(--text-muted)">{text}</p>

/**
 * Tela 08 · Meus agendamentos (Figma, 390px).
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
  const past = appointments.filter(({ status }) => !UPCOMING.includes(status))

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
    const { id, businessName, status, requestedAt, address, distanceKm } = appointment

    if (status === 'pending') {
      const remaining = requestedAt
        ? differenceInMinutes(addHours(requestedAt, MOCK_CONFIRMATION_HOURS), now)
        : 0

      return (
        <AppointmentCard
          businessName={businessName}
          status={status}
          summary={summary(appointment)}
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
          businessName={businessName}
          status={status}
          summary={summary(appointment)}
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
                className="min-w-0 flex-1"
                aria-label={`Cancelar agendamento em ${businessName}`}
                onClick={() => setCancelTarget(appointment)}
              >
                Cancelar
              </Button>
              <Button
                variant="secondary"
                className="min-w-0 flex-1"
                onClick={() =>
                  addToCalendar({
                    id,
                    title: `${appointment.serviceName} — ${businessName}`,
                    location: address,
                    date: appointment.date,
                    time: appointment.time,
                    durationMinutes: appointment.durationMinutes,
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

    return (
      <AppointmentCard
        businessName={businessName}
        status={status}
        summary={summary(appointment)}
        actions={
          status === 'completed' &&
          appointment.reviewable && (
            // TODO: a tela de avaliação ainda não existe; o botão não faz nada.
            <div className="flex flex-col gap-(--space-12)">
              <Button className="w-full">Avaliar atendimento</Button>
              <p className="type-caption text-(--text-muted)">
                Você tem {MOCK_REVIEW_WINDOW_DAYS} dias para avaliar.
              </p>
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
      <header className="bg-(--bg-surface) px-(--space-16) pt-[calc(var(--space-20)+env(safe-area-inset-top))] pb-(--space-12)">
        <h1 className="type-title text-(--text-strong)">Meus agendamentos</h1>
      </header>

      <main>
        <TabBar
          label="Agendamentos"
          panelClassName="p-(--space-16)"
          items={[
            {
              id: 'upcoming',
              label: 'Próximos',
              content: (
                <div className="flex flex-col gap-(--space-16)">
                  {upcoming.length > 0 ? list(upcoming) : emptyState('Nenhum agendamento próximo.')}
                  {toReview.length > 0 && (
                    <section
                      aria-labelledby="appointments-to-review"
                      className="flex flex-col gap-(--space-16)"
                    >
                      <h2 id="appointments-to-review" className="type-heading text-(--text-strong)">
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
          ]}
        />
      </main>

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
