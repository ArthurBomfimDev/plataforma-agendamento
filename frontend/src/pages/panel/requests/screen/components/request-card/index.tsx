import {
  AddIcon,
  ArrowOutwardIcon,
  CalendarTodayIcon,
  HourglassIcon,
  PersonIcon,
  ScheduleIcon,
} from '@assets/icons'
import {
  MARKER,
  OVERFLOW_MARKER,
  URGENT_MARKER,
  URGENT_REMAINING_MINUTES,
  expiryLabel,
  historyLabel,
  professionalLabel,
  remainingMinutes,
  requestedLabel,
  serviceLabel,
  whenLabel,
} from '../../consts'

import { Avatar } from '@components/avatar'
import { Button } from '@components/button'
import type { RequestCardProps } from './types'
import { StatusChip } from '@components/status-chip'
import { cn } from 'cn'
import { durationLabel, initials } from '@pages/panel/agenda/screen/consts'

/**
 * Um pedido pendente (Figma: 10, desktop; P03, 390px). No desktop, ações no cabeçalho e detalhes
 * em colunas; no celular, detalhes em lista, prazo em destaque e ações largas no rodapé.
 * O pedido perto de expirar ganha a borda de 2px no tom "urgente".
 */
export const RequestCard = (props: RequestCardProps) => {
  const { request, now, busy = false, onAccept, onReject } = props

  const remaining = remainingMinutes(request, now)
  const urgent = remaining < URGENT_REMAINING_MINUTES
  const expiry = expiryLabel(remaining)
  const titleId = `${request.id}-title`

  const actions = (size: 'md' | 'lg') => (
    <>
      <Button
        variant="secondary"
        size={size}
        className={cn(size === 'lg' && 'flex-1')}
        disabled={busy}
        onClick={() => onReject(request)}
      >
        Recusar<span className="sr-only"> pedido de {request.customerName}</span>
      </Button>
      <Button
        size={size}
        className={cn(size === 'lg' && 'flex-1')}
        disabled={busy}
        onClick={() => onAccept(request)}
      >
        Aceitar<span className="sr-only"> pedido de {request.customerName}</span>
      </Button>
    </>
  )

  const overflowMarker = request.outsideWorkingHours && (
    <span className={cn(MARKER, OVERFLOW_MARKER)}>
      <ArrowOutwardIcon aria-hidden="true" className="size-4 shrink-0" />
      Fora do horário
    </span>
  )

  const service = { label: 'Serviço', value: serviceLabel(request), icon: AddIcon }
  const when = { label: 'Quando', value: whenLabel(request), icon: CalendarTodayIcon }
  const professional = {
    label: 'Profissional',
    value: professionalLabel(request),
    icon: PersonIcon,
  }

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'flex flex-col gap-(--space-12) rounded-lg bg-(--bg-surface) p-(--space-16)',
        urgent ? 'border-2 border-(--marker-urgent-fg)' : 'border border-(--border-subtle)',
      )}
    >
      {/* Sem espaço para tudo numa linha (desktop estreito), marcadores e ações descem. */}
      <div className="flex items-center gap-(--space-12) lg:flex-wrap">
        <Avatar alt="" initials={initials(request.customerName)} className="shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-(--space-2) lg:min-w-48">
          <h2 id={titleId} className="type-body truncate text-(--text-strong)">
            {request.customerName}
          </h2>
          {request.customerHistory !== undefined && (
            <p className="type-caption text-(--text-muted)">
              {historyLabel(request.customerHistory)}
            </p>
          )}
        </div>

        {/* Desktop (10): marcadores e ações na mesma linha do consumidor. */}
        <div className="hidden items-center gap-(--space-12) lg:flex">
          {overflowMarker}
          {urgent && remaining > 0 && (
            <span className={cn(MARKER, URGENT_MARKER)}>
              <ScheduleIcon aria-hidden="true" className="size-4 shrink-0" />
              Expira em {durationLabel(remaining)}
            </span>
          )}
        </div>
        <StatusChip status="pending" className="shrink-0" />
        <div className="hidden gap-(--space-12) lg:ml-auto lg:flex">{actions('md')}</div>
      </div>

      {/* Desktop (10): divisória e detalhes em colunas. */}
      <hr className="hidden border-(--border-subtle) lg:block" />
      <dl className="hidden grid-cols-4 gap-(--space-32) lg:grid">
        {[service, when, professional].map(({ label, value }) => (
          <div key={label} className="flex min-w-0 flex-col gap-(--space-2)">
            <dt className="type-caption text-(--text-muted)">{label}</dt>
            <dd className="type-label text-(--text-body)">{value}</dd>
          </div>
        ))}
        <div className="flex min-w-0 flex-col gap-(--space-2)">
          <dt className="type-caption text-(--text-muted)">Status</dt>
          <dd
            className={cn(
              'type-label tabular',
              urgent ? 'text-(--marker-urgent-fg)' : 'text-(--text-body)',
            )}
          >
            {requestedLabel(request, now)} · {expiry}
          </dd>
        </div>
      </dl>

      {/* Celular (P03): detalhes em lista, na ordem do wireframe. */}
      <dl className="flex flex-col gap-(--space-4) lg:hidden">
        {[when, professional, service].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-(--space-8)">
            <dt>
              <Icon aria-hidden="true" className="size-4 shrink-0 text-(--text-body)" />
              <span className="sr-only">{label}</span>
            </dt>
            <dd className="type-caption min-w-0 flex-1 text-(--text-body)">{value}</dd>
          </div>
        ))}
      </dl>
      {overflowMarker && <div className="flex lg:hidden">{overflowMarker}</div>}
      <p
        className={cn(
          'type-label tabular flex items-center gap-(--space-8) rounded-md border px-(--space-12) py-(--space-8) lg:hidden',
          urgent
            ? 'border-l-3 border-(--marker-urgent-fg) bg-(--marker-urgent-bg) text-(--marker-urgent-fg)'
            : 'border-(--border-subtle) bg-(--bg-surface-raised) text-(--text-muted)',
        )}
      >
        <HourglassIcon aria-hidden="true" className="size-4 shrink-0" />
        {expiry}
      </p>
      <div className="flex gap-(--space-8) lg:hidden">{actions('lg')}</div>
    </article>
  )
}
