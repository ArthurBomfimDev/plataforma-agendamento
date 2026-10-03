import { Check, Clock, Hourglass } from 'lucide-react'
import { addHours, differenceInMinutes, format } from 'date-fns'

import type { BookingSentScreenProps } from './types'
import { Button } from '../../components/button'
import { ConfirmDialog } from '../../components/confirm-dialog'
import { MOCK_BUSINESSES } from '../business-detail/mock'
import { MOCK_CONFIRMATION_HOURS } from '../availability/mock'
import { MOCK_PROFESSIONALS } from '../choose-professional/mock'
import { MOCK_REMINDER_HOURS } from './consts'
import { NotFoundScreen } from '../not-found'
import { StatusChip } from '../../components/status-chip'
import { cn } from 'cn'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useNow } from '../../hooks/useNow'
import { useState } from 'react'

/** "11 h 58 min", "12 h", "40 min". */
const durationLabel = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return [hours > 0 && `${hours} h`, (minutes > 0 || hours === 0) && `${minutes} min`]
    .filter(Boolean)
    .join(' ')
}

/** "agora", "há 5 min", "há 2 h". */
const elapsedLabel = (since: Date, now: Date) => {
  const minutes = Math.max(0, differenceInMinutes(now, since))
  if (minutes < 1) return 'agora'
  return minutes < 60 ? `há ${minutes} min` : `há ${Math.floor(minutes / 60)} h`
}

const SummaryRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-(--space-12)">
    <dt className="type-caption w-24 shrink-0 text-(--text-muted)">{label}</dt>
    <dd className="type-body tabular min-w-0 flex-1 text-(--text-strong)">{children}</dd>
  </div>
)

/**
 * Tela 07 · Pedido enviado, pendente (Figma, 390px).
 */
export const BookingSentScreen = (props: BookingSentScreenProps) => {
  const {
    businessId,
    serviceId,
    professionalId,
    date,
    time,
    sentAt,
    onViewAppointments,
    onCancel,
  } = props

  const now = useNow()
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const business = MOCK_BUSINESSES[businessId]
  const service = business?.services.find(({ id }) => id === serviceId)
  const professional = MOCK_PROFESSIONALS[businessId]?.find(({ id }) => id === professionalId)

  if (!business || !service || (professionalId && !professional)) {
    return <NotFoundScreen />
  }

  const remainingMinutes = differenceInMinutes(addHours(sentAt, MOCK_CONFIRMATION_HOURS), now)
  const weekday = format(date, 'EEEEEE', { locale: ptBR })

  const steps = [
    { label: 'Pedido enviado', detail: elapsedLabel(sentAt, now), done: true },
    { label: 'Empresa confirma', detail: `até ${MOCK_CONFIRMATION_HOURS} h`, done: false },
    {
      label: 'Lembrete',
      detail: `${MOCK_REMINDER_HOURS.map((hours) => `${hours} h`).join(' e ')} antes`,
      done: false,
    },
    { label: 'Atendimento', detail: `${weekday}, ${time}`, done: false },
  ]

  return (
    <div className="min-h-dvh bg-(--bg-page) pb-[calc(9rem+env(safe-area-inset-bottom))]">
      {/* TODO(figma): o Figma usa `space-32`, que não existe em tokens.css; pt-8 = 32px. */}
      <main className="flex flex-col gap-(--space-20) px-(--space-16) pt-[calc(--spacing(8)+env(safe-area-inset-top))] pb-(--space-16)">
        <header className="flex flex-col items-center gap-(--space-12) text-center">
          <span className="flex size-12 items-center justify-center rounded-(--radius-full) border border-(--status-pending-fg) bg-(--status-pending-bg) text-(--status-pending-fg)">
            <Clock aria-hidden="true" className="size-7" />
          </span>
          <h1 className="type-title text-(--text-strong)">Pedido enviado</h1>
          <p className="type-body text-(--text-muted)">Aguardando confirmação do {business.name}</p>
        </header>

        <section
          aria-label="Resumo do pedido"
          className="flex flex-col gap-(--space-12) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16)"
        >
          <dl className="flex flex-col gap-(--space-12)">
            <SummaryRow label="Status">
              <StatusChip status="pending" />
            </SummaryRow>
            <SummaryRow label="Serviço">{service.name}</SummaryRow>
            {professional && <SummaryRow label="Profissional">{professional.name}</SummaryRow>}
            <SummaryRow label="Quando">
              {format(date, "EEEEEE, d 'de' MMMM", { locale: ptBR })} · {time}
            </SummaryRow>
          </dl>

          {/* Marcador "urgente": além da cor, a ampulheta e o texto do prazo carregam o sentido. */}
          <p className="type-label tabular flex items-center gap-(--space-8) rounded-md border border-l-3 border-(--marker-urgent-fg) bg-(--marker-urgent-bg) px-(--space-12) py-(--space-8) text-(--marker-urgent-fg)">
            <Hourglass aria-hidden="true" className="size-4 shrink-0" />
            {remainingMinutes > 0
              ? `Expira em ${durationLabel(remainingMinutes)}`
              : 'Prazo de confirmação encerrado'}
          </p>
        </section>

        <section
          aria-label="Próximos passos"
          className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16)"
        >
          <ol className="flex flex-col gap-(--space-12)">
            {steps.map(({ label, detail, done }) => (
              <li key={label} className="flex items-center gap-(--space-12)">
                {/* TODO(figma): no Figma o passo concluído tem 16px e os pendentes 28px, o que
                    desalinha o texto; aqui os dois têm 28px. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-(--radius-full) border',
                    done
                      ? 'border-(--status-confirmed-fg) bg-(--status-confirmed-bg) text-(--status-confirmed-fg)'
                      : 'border-(--border-interactive) bg-(--bg-surface-raised)',
                  )}
                >
                  {done && <Check className="size-4" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                  <span
                    className={cn(
                      'type-body',
                      done ? 'text-(--text-strong)' : 'text-(--text-body)',
                    )}
                  >
                    {label}
                    <span className="sr-only">{done ? ', concluído' : ', pendente'}</span>
                  </span>
                  <span className="type-caption tabular text-(--text-muted)">{detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>

      {/* TODO(figma): a sombra para cima não tem token; o valor é o do Figma. */}
      <footer className="fixed inset-x-0 bottom-0 flex flex-col gap-(--space-8) border-t border-(--border-subtle) bg-(--bg-surface) px-(--space-16) pt-(--space-12) pb-[calc(var(--space-16)+env(safe-area-inset-bottom))] shadow-[0_-2px_8px_0_#1c1a1714]">
        <Button size="lg" className="w-full" onClick={onViewAppointments}>
          Ver meus agendamentos
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => setConfirmingCancel(true)}>
          Cancelar pedido
        </Button>
      </footer>

      <ConfirmDialog
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title="Cancelar este pedido?"
        description={`O pedido de ${service.name} em ${format(date, "EEEEEE, d 'de' MMMM", { locale: ptBR })} às ${time} será cancelado. Para outro horário, é preciso fazer um novo pedido.`}
        confirmLabel="Cancelar pedido"
        dismissLabel="Manter pedido"
        onConfirm={() => {
          setConfirmingCancel(false)
          onCancel?.()
        }}
      />
    </div>
  )
}
