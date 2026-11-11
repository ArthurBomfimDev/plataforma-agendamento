import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@components/ui/sheet'
import { useId, useState } from 'react'

import { Button } from '@components/button'
import { LoadingState } from '@components/screen-state'
import type { CounterBookingDialogProps } from './types'
import { TextField } from '@components/text-field'
import { CloseIcon } from '@assets/icons'
import { cn } from 'cn'

const SELECT =
  'min-h-(--size-touch-min) w-full rounded-md border border-(--border-interactive) bg-(--bg-surface) px-(--space-16) py-(--space-12) text-(length:--size-input) text-(--text-strong) focus-visible:border-(--border-focus) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)'

/**
 * Marcação de balcão (tela P04): o estabelecimento marca para quem chegou ou ligou. Num Sheet, como o
 * detalhe da agenda — lateral no desktop, de baixo no celular; foco preso, Esc e devolução do foco
 * vêm da lib.
 *
 * TODO(figma): não há wireframe da P04 nesta base; segue os campos e tokens existentes.
 */
export const CounterBookingDialog = (props: CounterBookingDialogProps) => {
  const {
    open,
    onOpenChange,
    side,
    dayLabel,
    initial,
    professionals,
    services,
    servicesLoading = false,
    submitting,
    error,
    onSubmit,
  } = props

  const id = useId()
  const [professionalId, setProfessionalId] = useState(initial?.professionalId ?? '')
  const [serviceId, setServiceId] = useState('')
  const [time, setTime] = useState(initial?.time ?? '')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [touched, setTouched] = useState(false)

  // Cada abertura começa do horário e do profissional de onde veio (o Sheet fica montado fechado).
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setProfessionalId(initial?.professionalId ?? '')
      setTime(initial?.time ?? '')
      setServiceId('')
      setName('')
      setPhone('')
      setTouched(false)
    }
  }

  // Sem escolha válida (lista ainda chegando, profissional que saiu), vale o primeiro da lista.
  const chosenId = professionals.some(({ id: candidate }) => candidate === professionalId)
    ? professionalId
    : (professionals[0]?.id ?? '')
  const available = services.filter(({ professionalIds }) => professionalIds.includes(chosenId))
  const service = available.find(({ id: candidate }) => candidate === serviceId) ?? available[0]
  const nameError = touched && !name.trim() ? 'Informe o nome de quem vai ser atendido.' : undefined
  const timeError = touched && !time ? 'Escolha o horário.' : undefined

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        showCloseButton={false}
        className={cn(
          'gap-(--space-20) overflow-y-auto border-(--border-subtle) bg-(--bg-surface) p-(--space-24) text-(--text-body)',
          side === 'bottom'
            ? 'max-h-[90dvh] rounded-t-lg pb-[calc(var(--space-24)+env(safe-area-inset-bottom))]'
            : 'w-full sm:max-w-md',
        )}
      >
        <div className="flex items-start gap-(--space-12)">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-4)">
            <SheetTitle className="type-heading text-(--text-strong)">
              Marcação de balcão
            </SheetTitle>
            <SheetDescription className="type-body text-(--text-muted)">
              {dayLabel}
            </SheetDescription>
          </div>
          <SheetClose
            aria-label="Fechar"
            className="flex size-(--size-touch-min) shrink-0 items-center justify-center rounded-md text-(--text-muted) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
          >
            <CloseIcon aria-hidden="true" className="size-5" />
          </SheetClose>
        </div>

        <form
          noValidate
          className="flex flex-col gap-(--space-16)"
          onSubmit={(event) => {
            event.preventDefault()
            setTouched(true)
            if (!name.trim() || !time || !service || !chosenId) return
            onSubmit({
              professionalId: chosenId,
              serviceId: service.id,
              time,
              walkInName: name.trim(),
              walkInPhone: phone.trim() || null,
            })
          }}
        >
          <div className="flex flex-col gap-(--space-4)">
            <label htmlFor={`${id}-professional`} className="type-label text-(--text-body)">
              Profissional
            </label>
            <select
              id={`${id}-professional`}
              className={SELECT}
              value={chosenId}
              onChange={(event) => setProfessionalId(event.target.value)}
            >
              {professionals.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-(--space-4)">
            <label htmlFor={`${id}-service`} className="type-label text-(--text-body)">
              Serviço
            </label>
            {servicesLoading ? (
              <LoadingState label="Carregando os serviços…" />
            ) : available.length > 0 ? (
              <select
                id={`${id}-service`}
                className={SELECT}
                value={service?.id ?? ''}
                onChange={(event) => setServiceId(event.target.value)}
              >
                {available.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} · {option.durationMinutes} min
                  </option>
                ))}
              </select>
            ) : (
              <p className="type-caption text-(--text-muted)">
                Este profissional não tem serviço habilitado.
              </p>
            )}
          </div>

          <TextField
            id={`${id}-time`}
            label="Horário"
            type="time"
            step={900}
            value={time}
            error={timeError}
            onChange={(event) => setTime(event.target.value)}
          />
          <TextField
            id={`${id}-name`}
            label="Nome de quem vai ser atendido"
            autoComplete="off"
            value={name}
            error={nameError}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            id={`${id}-phone`}
            label="Telefone (opcional)"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />

          {error && (
            <p role="alert" className="type-label text-(--status-rejected-fg)">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting || !service}>
            {submitting ? 'Marcando…' : 'Marcar'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
