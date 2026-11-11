import { ActionFooter } from '@components/action-footer'
import { CheckIcon, HourglassIcon, ScheduleIcon } from '@assets/icons'
import { addMinutes, differenceInMinutes, format, parse } from 'date-fns'

import type { BookingSentScreenProps } from './types'
import { Button } from '@components/button'
import { ConfirmDialog } from '@components/confirm-dialog'
import { MOCK_REMINDER_HOURS } from './consts'
import { PageContainer } from '@components/page-container'
import { StatusChip } from '@components/status-chip'
import { cn } from 'cn'
import { priceFormat } from '@components/service-card/consts'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useNow } from '@hooks/use-now'
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

/** "09:30 — 10:00": o fim é o início mais a duração do serviço. */
const timeRange = (time: string, durationMinutes: number) =>
  `${time} — ${format(addMinutes(parse(time, 'HH:mm', new Date(0)), durationMinutes), 'HH:mm')}`

const SummaryRow = ({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn('flex items-center gap-(--space-12) lg:gap-(--space-16)', className)}>
    <dt className="type-caption w-24 shrink-0 text-(--text-muted) lg:w-30">{label}</dt>
    <dd className="type-body tabular min-w-0 flex-1 text-(--text-strong)">{children}</dd>
  </div>
)

/**
 * Tela 07 · Pedido enviado, pendente (Figma, 390px; desktop: 07D, 1440px).
 */
export const BookingSentScreen = (props: BookingSentScreenProps) => {
  const {
    businessName,
    service,
    professionalName,
    date,
    time,
    sentAt,
    expiresAt,
    confirmationHours,
    cancelling,
    onViewAppointments,
    onCancel,
  } = props

  const now = useNow()
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const remainingMinutes = differenceInMinutes(expiresAt, now)
  const weekday = format(date, 'EEEEEE', { locale: ptBR })
  const expiryText =
    remainingMinutes > 0
      ? `Expira em ${durationLabel(remainingMinutes)}`
      : 'Prazo de confirmação encerrado'

  const steps = [
    { label: 'Pedido enviado', detail: elapsedLabel(sentAt, now), done: true },
    { label: 'Empresa confirma', detail: `até ${confirmationHours} h`, done: false },
    {
      label: 'Lembrete',
      detail: `${MOCK_REMINDER_HOURS.map((hours) => `${hours} h`).join(' e ')} antes`,
      done: false,
    },
    { label: 'Atendimento', detail: `${weekday}, ${time}`, done: false },
  ]

  return (
    <div className="min-h-dvh bg-(--bg-page) pb-[calc(9rem+env(safe-area-inset-bottom))] lg:pb-(--space-40)">
      <PageContainer width="narrow">
        <main className="flex flex-col gap-(--space-20) px-(--space-16) pt-[calc(var(--space-32)+env(safe-area-inset-top))] pb-(--space-16) lg:px-0 lg:pt-(--space-24) lg:pb-0">
          <header className="flex flex-col items-center gap-(--space-12) text-center">
            <span className="flex size-12 items-center justify-center rounded-(--radius-full) border border-(--status-pending-fg) bg-(--status-pending-bg) text-(--status-pending-fg) lg:size-14">
              <ScheduleIcon aria-hidden="true" className="size-7 lg:size-8" />
            </span>
            <h1 className="type-title text-(--text-strong) lg:text-(length:--size-display)! lg:leading-(--line-height-display)!">
              Pedido enviado
            </h1>
            <p className="type-body text-(--text-muted) lg:text-(length:--size-body-lg)! lg:leading-(--line-height-body-lg)!">
              Aguardando confirmação do {businessName}
            </p>
          </header>

          <section
            aria-label="Resumo do pedido"
            className="flex flex-col gap-(--space-12) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16) lg:p-(--space-20)"
          >
            <dl className="flex flex-col gap-(--space-12)">
              <SummaryRow label="Status">
                <span className="flex items-center justify-between gap-(--space-8)">
                  <StatusChip status="pending" />
                  {/* Desktop (07D): o prazo vira um selo na linha do status. */}
                  <span className="type-caption tabular hidden items-center gap-(--space-4) rounded-sm bg-(--marker-urgent-bg) px-(--space-8) py-(--space-2) text-(--marker-urgent-fg) lg:inline-flex">
                    <ScheduleIcon aria-hidden="true" className="size-4 shrink-0" />
                    {expiryText}
                  </span>
                </span>
              </SummaryRow>
              <SummaryRow label="Serviço">{service.name}</SummaryRow>
              {professionalName && <SummaryRow label="Profissional">{professionalName}</SummaryRow>}
              <SummaryRow label="Quando">
                <span className="lg:hidden">
                  {format(date, "EEEEEE, d 'de' MMMM", { locale: ptBR })} · {time}
                </span>
                <span className="hidden lg:inline">
                  {format(date, "EEEE, d 'de' MMMM", { locale: ptBR }).replace('-feira', '')} ·{' '}
                  {timeRange(time, service.durationMinutes)}
                </span>
              </SummaryRow>
              <SummaryRow label="Valor" className="hidden lg:flex">
                {priceFormat.format(service.priceCents / 100)}
              </SummaryRow>
            </dl>

            {/* Marcador "urgente": além da cor, a ampulheta e o texto do prazo carregam o sentido. */}
            <p className="type-label tabular flex items-center gap-(--space-8) rounded-md border border-l-3 border-(--marker-urgent-fg) bg-(--marker-urgent-bg) px-(--space-12) py-(--space-8) text-(--marker-urgent-fg) lg:hidden">
              <HourglassIcon aria-hidden="true" className="size-4 shrink-0" />
              {expiryText}
            </p>
          </section>

          <section
            aria-label="Próximos passos"
            className="rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16) lg:p-(--space-20)"
          >
            {/* Celular: passos em coluna. Desktop (07D): em linha, centralizados. */}
            <ol className="flex flex-col gap-(--space-12) lg:flex-row lg:items-start lg:gap-(--space-8)">
              {steps.map(({ label, detail, done }) => (
                <li
                  key={label}
                  className="flex items-center gap-(--space-12) lg:flex-1 lg:flex-col lg:gap-(--space-8) lg:text-center"
                >
                  {/* TODO(figma): no Figma o passo concluído tem 16px e os pendentes 28px, o que
                    desalinha o texto; aqui os dois têm 28px. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-(--radius-full) border lg:size-8',
                      done
                        ? 'border-(--status-confirmed-fg) bg-(--status-confirmed-bg) text-(--status-confirmed-fg)'
                        : 'border-(--border-interactive) bg-(--bg-surface-raised)',
                    )}
                  >
                    {done && <CheckIcon className="size-4" />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-(--space-2) lg:items-center lg:gap-(--space-8)">
                    <span
                      className={cn(
                        'type-body lg:text-(length:--size-label)! lg:leading-(--line-height-label)! lg:font-medium!',
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

          {/* Desktop: as ações ficam no fim da coluna, sem rodapé fixo. */}
          <div className="hidden items-center gap-(--space-12) lg:flex">
            <Button variant="ghost" disabled={cancelling} onClick={() => setConfirmingCancel(true)}>
              {cancelling ? 'Cancelando…' : 'Cancelar pedido'}
            </Button>
            <span className="flex-1" />
            <Button size="lg" onClick={onViewAppointments}>
              Ver meus agendamentos
            </Button>
          </div>
        </main>
      </PageContainer>

      {/* TODO(figma): a sombra para cima não tem token; o valor é o do Figma. */}
      <ActionFooter>
        <Button size="lg" className="w-full" onClick={onViewAppointments}>
          Ver meus agendamentos
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          disabled={cancelling}
          onClick={() => setConfirmingCancel(true)}
        >
          {cancelling ? 'Cancelando…' : 'Cancelar pedido'}
        </Button>
      </ActionFooter>

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
