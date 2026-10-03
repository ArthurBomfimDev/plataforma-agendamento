import { ChevronLeft, Clock } from 'lucide-react'
import { MOCK_FREE_CANCELLATION_HOURS, NOTE_MAX_LENGTH } from './consts'
import { addMinutes, format, parse } from 'date-fns'

import type { BookingReviewScreenProps } from './types'
import { Button } from '../../components/button'
import { MOCK_BUSINESSES } from '../business-detail/mock'
import { MOCK_PROFESSIONALS } from '../choose-professional/mock'
import { NotFoundScreen } from '../not-found'
import { TextAreaField } from '../../components/text-area-field'
import { VerifiedBadge } from '../../components/card-establishment/components/VerifiedBadge'
import { cn } from 'cn'
import { getMockDaySlots } from '../availability/mock'
import { priceFormat } from '../../components/service-card/consts'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useState } from 'react'

/** "09:30 — 10:00": o fim é o início mais a duração do serviço. */
const timeRange = (time: string, durationMinutes: number) => {
  const start = parse(time, 'HH:mm', new Date(0))
  return `${time} — ${format(addMinutes(start, durationMinutes), 'HH:mm')}`
}

const SummaryRow = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => (
  <div className="flex items-start gap-(--space-12)">
    <dt className="type-caption w-24 shrink-0 text-(--text-muted)">{label}</dt>
    <dd
      className={cn(
        'type-body tabular min-w-0 flex-1',
        muted ? 'text-(--text-body)' : 'text-(--text-strong)',
      )}
    >
      {value}
    </dd>
  </div>
)

const divider = <hr aria-hidden="true" className="h-px w-full border-0 bg-(--border-subtle)" />

/**
 * Tela 06 · Confirmação do pedido (Figma, 390px).
 */
export const BookingReviewScreen = (props: BookingReviewScreenProps) => {
  const { businessId, serviceId, professionalId, date, time, today, onBack, onSubmit } = props

  const [note, setNote] = useState('')

  const business = MOCK_BUSINESSES[businessId]
  const service = business?.services.find(({ id }) => id === serviceId)
  const professional = MOCK_PROFESSIONALS[businessId]?.find(({ id }) => id === professionalId)
  const slots = getMockDaySlots(date, today)
  const slotIsFree = Object.values(slots ?? {})
    .flat()
    .some((slot) => slot.time === time && !slot.unavailable)

  // Link montado à mão ou horário que deixou de existir: não há pedido para revisar.
  if (!business || !service || (professionalId && !professional) || !slotIsFree) {
    return <NotFoundScreen />
  }

  return (
    <div className="min-h-dvh bg-(--bg-page) pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <header className="border-b border-(--border-subtle) bg-(--bg-surface) px-(--space-16) pt-[calc(var(--space-12)+env(safe-area-inset-top))] pb-(--space-12)">
        {/* Linha de 24px no Figma; a margem negativa mantém os 44px de toque sem crescer o cabeçalho. */}
        <button
          type="button"
          onClick={onBack}
          className="type-body -my-2.5 -ml-(--space-4) flex min-h-(--size-touch-min) items-center gap-(--space-12) pr-(--space-8) pl-(--space-4) text-(--text-body) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
        >
          <ChevronLeft aria-hidden="true" className="size-5 text-(--text-strong)" />
          Voltar
        </button>
      </header>

      <main className="flex flex-col gap-(--space-12) p-(--space-16)">
        <h1 className="type-title text-(--text-strong)">Revise seu pedido</h1>

        <section
          aria-label="Resumo do pedido"
          className="flex flex-col gap-(--space-8) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16)"
        >
          <div className="flex items-center gap-(--space-12)">
            {business.coverUrl ? (
              <img
                src={business.coverUrl}
                alt=""
                className="size-10 shrink-0 rounded-md object-cover"
              />
            ) : (
              <div aria-hidden="true" className="size-10 shrink-0 rounded-md bg-(--bg-disabled)" />
            )}
            <h2 className="type-body min-w-0 flex-1 text-(--text-strong)">{business.name}</h2>
            {business.verified && <VerifiedBadge />}
          </div>

          {divider}

          <dl className="flex flex-col gap-(--space-8)">
            <SummaryRow label="Serviço" value={service.name} />
            <SummaryRow
              label="Profissional"
              value={professional?.name ?? 'Sem preferência'}
              muted={!professional}
            />
            <SummaryRow
              label="Data"
              value={format(date, "EEEEEE, d 'de' MMMM", { locale: ptBR })}
            />
            <SummaryRow label="Horário" value={timeRange(time, service.durationMinutes)} />
          </dl>

          {divider}

          <dl>
            <SummaryRow label="Valor" value={priceFormat.format(service.priceCents / 100)} />
          </dl>
          <p className="type-caption text-(--text-muted)">Pagamento direto no estabelecimento.</p>
        </section>

        <TextAreaField
          id="booking-note"
          label="Observação (opcional)"
          placeholder="Algo que o profissional precise saber"
          helper={`Máx. ${NOTE_MAX_LENGTH} caracteres`}
          maxLength={NOTE_MAX_LENGTH}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        {/* TODO(figma): `border/accent` e `text/accent` não existem em tokens.css; os valores do
            Figma coincidem com `border-interactive` e `text-body`. */}
        <section
          aria-labelledby="booking-cancellation"
          className="flex flex-col gap-(--space-8) rounded-md border border-(--border-interactive) bg-(--bg-accent-soft) px-(--space-16) py-(--space-12)"
        >
          <h2
            id="booking-cancellation"
            className="type-label flex items-center gap-(--space-8) text-(--text-body)"
          >
            <Clock aria-hidden="true" className="size-4 shrink-0" />
            Política de cancelamento
          </h2>
          <p className="type-caption text-(--text-body)">
            Cancelamento gratuito até {MOCK_FREE_CANCELLATION_HOURS} h antes. Depois disso, só com
            aprovação do estabelecimento.
          </p>
        </section>
      </main>

      {/* TODO(figma): a sombra para cima não tem token; o valor é o do Figma. */}
      <footer className="fixed inset-x-0 bottom-0 flex flex-col gap-(--space-8) border-t border-(--border-subtle) bg-(--bg-surface) px-(--space-16) pt-(--space-12) pb-[calc(var(--space-16)+env(safe-area-inset-bottom))] shadow-[0_-2px_8px_0_#1c1a1714]">
        <Button
          onClick={() => onSubmit?.(note.trim())}
          className="type-body w-full px-(--space-24) py-(--space-16)"
        >
          Enviar pedido
        </Button>
        <p className="type-caption text-center text-(--text-muted)">
          O pedido fica pendente até a empresa aprovar. Você é avisado por e-mail e no app.
        </p>
      </footer>
    </div>
  )
}
