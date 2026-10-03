import { ChevronLeft, Clock } from 'lucide-react'
import type { DayPeriod, AvailabilityScreenProps } from './types'
import { MOCK_CONFIRMATION_HOURS, MOCK_MONTHS_AHEAD, getMockDayInfo, getMockDaySlots } from './mock'
import { addDays, addMonths, format, startOfMonth } from 'date-fns'

import { AvailabilityCalendar } from '../../components/availability-calendar'
import { Button } from '../../components/button'
import { MOCK_BUSINESSES } from '../business-detail/mock'
import { MOCK_PROFESSIONALS } from '../choose-professional/mock'
import { NotFoundScreen } from '../not-found'
import { SlotPeriod } from '../../components/slot-period'
import { priceFormat } from '../../components/service-card/consts'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useState } from 'react'

const PERIODS: { id: DayPeriod; label: string }[] = [
  { id: 'morning', label: 'Manhã' },
  { id: 'afternoon', label: 'Tarde' },
  { id: 'evening', label: 'Noite' },
]

/** "sexta, 11 de setembro" — o Figma corta o "-feira". */
const dayHeading = (date: Date) =>
  format(date, "EEEE, d 'de' MMMM", { locale: ptBR }).replace('-feira', '')

/** Primeiro dia com horário a partir de hoje, dentro da janela navegável. */
const firstAvailableDay = (today: Date, lastDay: Date) => {
  for (let day = today; day <= lastDay; day = addDays(day, 1)) {
    if (getMockDayInfo(day, today).status === 'available') return day
  }
  return undefined
}

/**
 * Tela 05 · Calendário e horários (Figma, 390px).
 */
export const AvailabilityScreen = (props: AvailabilityScreenProps) => {
  const { businessId, serviceId, professionalId, today, onBack, onContinue } = props

  const startMonth = startOfMonth(today)
  const endMonth = addMonths(startMonth, MOCK_MONTHS_AHEAD)

  const [selectedDate, setSelectedDate] = useState(() =>
    firstAvailableDay(today, addDays(addMonths(endMonth, 1), -1)),
  )
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const service = MOCK_BUSINESSES[businessId]?.services.find(({ id }) => id === serviceId)
  const professional = MOCK_PROFESSIONALS[businessId]?.find(({ id }) => id === professionalId)

  if (!service || (professionalId && !professional)) {
    return <NotFoundScreen />
  }

  const slots = selectedDate ? getMockDaySlots(selectedDate, today) : null
  const periods = PERIODS.filter(({ id }) => slots?.[id].length)
  const firstOpenPeriod = periods.find(({ id }) => slots?.[id].some((slot) => !slot.unavailable))

  const selectDate = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  return (
    <div className="min-h-dvh bg-(--bg-page) pb-[calc(8rem+env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-(--space-12) border-b border-(--border-subtle) bg-(--bg-surface) px-(--space-16) pt-[calc(var(--space-12)+env(safe-area-inset-top))] pb-(--space-12)">
        {/* Ícone de 20px, área de toque de 44px; a margem negativa mantém o alinhamento do Figma. */}
        <button
          type="button"
          aria-label="Voltar"
          onClick={onBack}
          className="-m-(--space-12) flex size-(--size-touch-min) shrink-0 items-center justify-center text-(--text-strong) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
          <p className="type-body truncate text-(--text-strong)">{service.name}</p>
          <p className="type-caption tabular truncate text-(--text-muted)">
            {service.durationMinutes} min · {priceFormat.format(service.priceCents / 100)} ·{' '}
            {professional?.name ?? 'Sem preferência'}
          </p>
        </div>
      </header>

      <main className="flex flex-col gap-(--space-20) p-(--space-16)">
        <h1 className="sr-only">Escolha o dia e o horário</h1>

        <AvailabilityCalendar
          selected={selectedDate}
          onSelect={selectDate}
          startMonth={startMonth}
          endMonth={endMonth}
          getDayInfo={(date) => getMockDayInfo(date, today)}
        />

        {selectedDate && (
          <section aria-labelledby="availability-slots" className="flex flex-col gap-(--space-12)">
            <h2 id="availability-slots" className="type-heading text-(--text-strong)">
              Horários — {dayHeading(selectedDate)}
            </h2>
            {/* `key`: ao trocar de dia, os períodos voltam ao estado inicial (só o primeiro aberto). */}
            <div key={selectedDate.toISOString()} className="flex flex-col gap-(--space-12)">
              {periods.map(({ id, label }) => (
                <SlotPeriod
                  key={id}
                  label={label}
                  slots={slots?.[id] ?? []}
                  defaultOpen={id === firstOpenPeriod?.id}
                  value={selectedTime}
                  onValueChange={setSelectedTime}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* TODO(figma): a sombra para cima não tem token; o valor é o do Figma. */}
      <footer className="fixed inset-x-0 bottom-0 flex flex-col gap-(--space-8) border-t border-(--border-subtle) bg-(--bg-surface) px-(--space-16) pt-(--space-12) pb-[calc(var(--space-16)+env(safe-area-inset-bottom))] shadow-[0_-2px_8px_0_#1c1a1714]">
        <Button
          disabled={!selectedDate || !selectedTime}
          onClick={() => selectedDate && selectedTime && onContinue?.(selectedDate, selectedTime)}
          size="lg"
          className="w-full"
        >
          Continuar
        </Button>
        <p className="type-caption flex items-center justify-center gap-(--space-4) text-(--text-muted)">
          <Clock aria-hidden="true" className="size-4 shrink-0" />
          <span>O estabelecimento confirma em até {MOCK_CONFIRMATION_HOURS} h.</span>
        </p>
      </footer>
    </div>
  )
}
