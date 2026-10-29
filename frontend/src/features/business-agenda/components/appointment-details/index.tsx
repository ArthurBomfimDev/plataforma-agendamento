import { Clock, User, X } from 'lucide-react'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@components/ui/sheet'
import { addHours, differenceInMinutes } from 'date-fns'
import { entryEnd, expiryLabel, firstName, initials, placeableStarts, toTime } from '../../consts'
import { useState } from 'react'

import type { AppointmentDetailsProps } from './types'
import { Avatar } from '@components/avatar'
import { Button } from '@components/button'
import { MOCK_CONFIRMATION_HOURS } from '@features/availability/mock'
import { SegmentedControl } from '@components/segmented-control'
import { StatusChip } from '@components/status-chip'
import { TimeSlotGroup } from '@components/time-slot-group'
import { cn } from 'cn'

/**
 * Detalhe de um agendamento do painel, num Sheet do shadcn (Base UI): lateral no desktop, de baixo
 * no celular. A lib dá foco preso, Esc e devolução do foco.
 *
 * Pedido pendente: confirmar ou recusar. Confirmado: remarcar escolhendo profissional e horário —
 * a alternativa a arrastar o bloco na grade, para quem não usa ponteiro (WCAG 2.5.7).
 *
 * TODO(figma): não há wireframe deste painel; segue os componentes e tokens existentes.
 */
export const AppointmentDetails = (props: AppointmentDetailsProps) => {
  const { selection, professionals, side, now, onClose, onConfirm, onReject, onMove } = props

  const [targetId, setTargetId] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)

  // O Sheet anima a saída; enquanto isso, mantém o último conteúdo na tela.
  const [shown, setShown] = useState(selection)
  if (selection && selection !== shown) {
    // Cada agendamento aberto começa sem remarcação escolhida.
    if (selection.entry.id !== shown?.entry.id) {
      setTargetId(null)
      setTime(null)
    }
    setShown(selection)
  }
  if (!shown) return null

  const { entry, professional } = shown
  const target =
    professionals.find(({ id }) => id === (targetId ?? professional.id)) ?? professional
  const starts = placeableStarts(target, entry.durationMinutes, entry.id)
  const remaining = entry.requestedAt
    ? differenceInMinutes(addHours(entry.requestedAt, MOCK_CONFIRMATION_HOURS), now)
    : 0

  const row = (icon: React.ReactNode, label: string, value: React.ReactNode) => (
    <div className="flex items-center gap-(--space-12)">
      {icon}
      <div className="flex min-w-0 flex-col">
        <span className="type-caption text-(--text-muted)">{label}</span>
        <span className="type-body text-(--text-strong)">{value}</span>
      </div>
    </div>
  )

  return (
    <Sheet open={selection !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={side}
        showCloseButton={false}
        className={cn(
          'gap-(--space-20) overflow-y-auto border-(--border-subtle) bg-(--bg-surface) p-(--space-24) text-(--text-body)',
          side === 'bottom'
            ? 'max-h-[85dvh] rounded-t-lg pb-[calc(var(--space-24)+env(safe-area-inset-bottom))]'
            : 'w-full sm:max-w-md',
        )}
      >
        <div className="flex items-start gap-(--space-12)">
          <div className="flex min-w-0 flex-1 flex-col gap-(--space-8)">
            <StatusChip status={entry.status} className="self-start" />
            <SheetTitle className="type-heading text-(--text-strong)">
              {entry.serviceName}
            </SheetTitle>
            <SheetDescription className="type-body tabular text-(--text-muted)">
              {entry.start} — {toTime(entryEnd(entry))} · {entry.durationMinutes} min
            </SheetDescription>
          </div>
          <SheetClose
            aria-label="Fechar"
            className="flex size-(--size-touch-min) shrink-0 items-center justify-center rounded-md text-(--text-muted) hover:bg-(--bg-surface-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
          >
            <X aria-hidden="true" className="size-5" />
          </SheetClose>
        </div>

        <div className="flex flex-col gap-(--space-16) rounded-md border border-(--border-subtle) p-(--space-16)">
          {row(
            <Avatar alt="" initials={initials(entry.customerName)} size="sm" />,
            'Consumidor',
            entry.customerName,
          )}
          {row(
            <User aria-hidden="true" className="mx-(--space-4) size-6 text-(--text-muted)" />,
            'Profissional',
            professional.name,
          )}
        </div>

        {entry.status === 'pending' ? (
          <>
            <p className="type-caption tabular flex items-center gap-(--space-4) text-(--status-pending-fg)">
              <Clock aria-hidden="true" className="size-4 shrink-0" />
              {remaining > 0
                ? `Aguardando sua resposta — expira em ${expiryLabel(remaining)}`
                : 'Prazo de confirmação encerrado'}
            </p>
            <div className="flex flex-col gap-(--space-8)">
              <Button size="lg" className="w-full" onClick={() => onConfirm(entry.id)}>
                Confirmar agendamento
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => onReject(entry.id)}>
                Recusar pedido
              </Button>
            </div>
          </>
        ) : (
          <section aria-labelledby="reschedule-title" className="flex flex-col gap-(--space-12)">
            <div className="flex flex-col gap-(--space-2)">
              <h3 id="reschedule-title" className="type-label text-(--text-strong)">
                Remarcar
              </h3>
              {side === 'right' && (
                <p className="type-caption text-(--text-muted)">
                  Você também pode arrastar o bloco na agenda.
                </p>
              )}
            </div>
            {professionals.length > 1 && (
              <SegmentedControl
                label="Profissional"
                options={professionals.map(({ id, name }) => ({
                  value: id,
                  label: firstName(name),
                }))}
                value={target.id}
                onValueChange={(id) => {
                  setTargetId(id)
                  setTime(null)
                }}
              />
            )}
            {starts.length > 0 ? (
              <TimeSlotGroup
                label={`Horários livres com ${target.name}`}
                slots={starts.map((start) => ({ time: start }))}
                value={time}
                onValueChange={setTime}
              />
            ) : (
              <p className="type-caption text-(--text-muted)">
                Nenhum horário livre com {firstName(target.name)} neste dia.
              </p>
            )}
            <Button
              size="lg"
              className="w-full"
              disabled={time === null}
              onClick={() =>
                time && onMove({ entryId: entry.id, professionalId: target.id, start: time })
              }
            >
              Remarcar {time ? `para ${time}` : ''}
            </Button>
          </section>
        )}
      </SheetContent>
    </Sheet>
  )
}
