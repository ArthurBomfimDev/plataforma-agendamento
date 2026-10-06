import { ChevronLeft, Clock } from 'lucide-react'
import type { DayPeriod, AvailabilityScreenProps } from './types'
import { MOCK_CONFIRMATION_HOURS, MOCK_MONTHS_AHEAD, getMockDayInfo, getMockDaySlots } from './mock'
import { addDays, addMinutes, addMonths, format, parse, startOfMonth } from 'date-fns'

import { AvailabilityCalendar } from '../../components/availability-calendar'
import { Breadcrumb } from '../../components/breadcrumb'
import { Button } from '../../components/button'
import { MOCK_BUSINESSES } from '../business-detail/mock'
import { MOCK_PROFESSIONALS } from '../choose-professional/mock'
import { NotFoundScreen } from '../not-found'
import { PageContainer } from '../../components/page-container'
import { SlotPeriod } from '../../components/slot-period'
import { TimeSlotGroup } from '../../components/time-slot-group'
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

const countLabel = (count: number) => `${count} ${count === 1 ? 'horário' : 'horários'}`

/** "09:30 — 10:00": o fim é o início mais a duração do serviço. */
const timeRange = (time: string, durationMinutes: number) =>
  `${time} — ${format(addMinutes(parse(time, 'HH:mm', new Date(0)), durationMinutes), 'HH:mm')}`

/** Primeiro dia com horário a partir de hoje, dentro da janela navegável. */
const firstAvailableDay = (today: Date, lastDay: Date) => {
  for (let day = today; day <= lastDay; day = addDays(day, 1)) {
    if (getMockDayInfo(day, today).status === 'available') return day
  }
  return undefined
}

/**
 * Tela 05 · Calendário e horários (Figma, 390px; desktop: 05D, 1440px).
 */
export const AvailabilityScreen = (props: AvailabilityScreenProps) => {
  const { businessId, serviceId, professionalId, today, onBack, onOpenBusiness, onContinue } = props

  const startMonth = startOfMonth(today)
  const endMonth = addMonths(startMonth, MOCK_MONTHS_AHEAD)

  const [selectedDate, setSelectedDate] = useState(() =>
    firstAvailableDay(today, addDays(addMonths(endMonth, 1), -1)),
  )
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const business = MOCK_BUSINESSES[businessId]
  const service = business?.services.find(({ id }) => id === serviceId)
  const professional = MOCK_PROFESSIONALS[businessId]?.find(({ id }) => id === professionalId)

  if (!business || !service || (professionalId && !professional)) {
    return <NotFoundScreen />
  }

  const professionalName = professional?.name ?? 'Sem preferência'
  const price = priceFormat.format(service.priceCents / 100)
  const slots = selectedDate ? getMockDaySlots(selectedDate, today) : null
  const periods = PERIODS.filter(({ id }) => slots?.[id].length)
  const firstOpenPeriod = periods.find(({ id }) => slots?.[id].some((slot) => !slot.unavailable))
  const canContinue = Boolean(selectedDate && selectedTime)

  const selectDate = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  const continueButton = (className: string) => (
    <Button
      disabled={!canContinue}
      onClick={() => selectedDate && selectedTime && onContinue?.(selectedDate, selectedTime)}
      size="lg"
      className={className}
    >
      Continuar
    </Button>
  )

  return (
    <div className="min-h-dvh bg-(--bg-page) pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-(--space-40)">
      <header className="flex items-center gap-(--space-12) border-b border-(--border-subtle) bg-(--bg-surface) px-(--space-16) md:px-[max(var(--space-16),calc((100%-40rem)/2+var(--space-16)))] pt-[calc(var(--space-12)+env(safe-area-inset-top))] pb-(--space-12) lg:hidden">
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
            {service.durationMinutes} min · {price} · {professionalName}
          </p>
        </div>
      </header>

      <PageContainer>
        <main className="flex flex-col gap-(--space-20) p-(--space-16) lg:px-0 lg:pt-(--space-32) lg:pb-0">
          <Breadcrumb
            className="hidden lg:block"
            items={[
              { label: business.name, onClick: onOpenBusiness },
              {
                label: `${service.name} · ${service.durationMinutes} min · ${price} · ${professionalName}`,
              },
            ]}
          />

          <h1 className="sr-only lg:not-sr-only lg:text-(length:--size-display)! lg:leading-(--line-height-display)! lg:font-semibold! lg:text-(--text-strong)">
            Escolha a data e o horário
          </h1>

          <div className="flex flex-col gap-(--space-20) lg:flex-row lg:items-start lg:gap-(--space-24)">
            <AvailabilityCalendar
              selected={selectedDate}
              onSelect={selectDate}
              startMonth={startMonth}
              endMonth={endMonth}
              getDayInfo={(date) => getMockDayInfo(date, today)}
              className="lg:w-110 lg:shrink-0 lg:gap-(--space-12) lg:p-(--space-20)"
            />

            <div className="flex min-w-0 flex-col gap-(--space-16) lg:flex-1">
              {selectedDate && (
                <section
                  aria-labelledby="availability-slots"
                  className="flex flex-col gap-(--space-12) lg:gap-(--space-16) lg:rounded-lg lg:border lg:border-(--border-subtle) lg:bg-(--bg-surface) lg:p-(--space-20)"
                >
                  <h2 id="availability-slots" className="type-heading text-(--text-strong)">
                    Horários — {dayHeading(selectedDate)}
                  </h2>

                  {/* Celular: períodos recolhíveis, só o primeiro aberto. `key`: ao trocar de
                      dia, voltam ao estado inicial. */}
                  <div
                    key={selectedDate.toISOString()}
                    className="flex flex-col gap-(--space-12) lg:hidden"
                  >
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

                  {/* Desktop: há espaço para todos os períodos abertos, seis horários por linha. */}
                  <div className="hidden flex-col gap-(--space-16) lg:flex">
                    {periods.map(({ id, label }) => (
                      <div key={id} className="flex flex-col gap-(--space-8)">
                        <div className="flex items-center gap-(--space-8)">
                          <h3 className="type-label min-w-0 flex-1 text-(--text-body)">{label}</h3>
                          <span className="type-caption tabular text-(--text-muted)">
                            {countLabel(
                              (slots?.[id] ?? []).filter(({ unavailable }) => !unavailable).length,
                            )}
                          </span>
                        </div>
                        <TimeSlotGroup
                          label={`Horários da ${label.toLowerCase()}`}
                          slots={slots?.[id] ?? []}
                          value={selectedTime}
                          onValueChange={setSelectedTime}
                          className="grid-cols-6"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Desktop: o resumo com "Continuar" substitui o rodapé fixo do celular. */}
              <section
                aria-label="Resumo do horário escolhido"
                className="hidden flex-col gap-(--space-12) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-20) lg:flex"
              >
                <div className="flex items-center gap-(--space-16)">
                  <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                    <p className="type-body tabular text-(--text-strong)">
                      {selectedDate && selectedTime
                        ? `${format(selectedDate, "EEEEEE, d 'de' MMMM", { locale: ptBR })} · ${timeRange(selectedTime, service.durationMinutes)}`
                        : 'Escolha um horário'}
                    </p>
                    <p className="type-caption text-(--text-muted)">
                      {service.name} · {professionalName} · {price}
                    </p>
                  </div>
                  {continueButton('shrink-0')}
                </div>
                <p className="type-caption flex items-center gap-(--space-4) text-(--text-muted)">
                  <Clock aria-hidden="true" className="size-4 shrink-0" />
                  <span>
                    O estabelecimento confirma em até {MOCK_CONFIRMATION_HOURS} h. Você é avisado
                    por e-mail e no app.
                  </span>
                </p>
              </section>
            </div>
          </div>
        </main>
      </PageContainer>

      {/* TODO(figma): a sombra para cima não tem token; o valor é o do Figma. */}
      <footer className="fixed inset-x-0 bottom-0 flex flex-col gap-(--space-8) border-t border-(--border-subtle) bg-(--bg-surface) px-(--space-16) md:px-[max(var(--space-16),calc((100%-40rem)/2+var(--space-16)))] pt-(--space-12) pb-[calc(var(--space-16)+env(safe-area-inset-bottom))] shadow-[0_-2px_8px_0_#1c1a1714] lg:hidden">
        {continueButton('w-full')}
        <p className="type-caption flex items-center justify-center gap-(--space-4) text-(--text-muted)">
          <Clock aria-hidden="true" className="size-4 shrink-0" />
          <span>O estabelecimento confirma em até {MOCK_CONFIRMATION_HOURS} h.</span>
        </p>
      </footer>
    </div>
  )
}
