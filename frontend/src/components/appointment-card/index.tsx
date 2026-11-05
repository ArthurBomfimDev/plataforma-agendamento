import type { AppointmentCardProps } from './types'
import { BusinessIllustration } from '@components/image-defaults/business-illustration'
import { SmartImage } from '@components/smart-image'
import { StatusChip } from '@components/status-chip'
import { cn } from 'cn'

/**
 * Card de agendamento da lista "Meus agendamentos" (Figma, tela 08; desktop: 08D). No celular é
 * empilhado; no desktop vira linha, com miniatura à esquerda e ações à direita.
 */
export const AppointmentCard = (props: AppointmentCardProps) => {
  const {
    businessName,
    status,
    summary,
    serviceLine,
    whenLine,
    detail,
    actions,
    highlight,
    image,
    category,
    className,
  } = props

  return (
    <article
      className={cn(
        'flex flex-col gap-(--space-12) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16) lg:flex-row lg:items-center lg:gap-(--space-20) lg:p-(--space-20)',
        highlight && 'lg:border-2 lg:border-(--marker-urgent-fg)',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-(--space-12) lg:flex-1 lg:items-center lg:gap-(--space-20)">
        {/* Logotipo (ou a capa); sem imagem, a ilustração da categoria, como na revisão do pedido. */}
        <SmartImage
          image={image ?? null}
          alt=""
          sizes="72px"
          width={1}
          height={1}
          fallback={<BusinessIllustration category={category ?? 'Beleza'} />}
          className="size-14 shrink-0 rounded-md lg:size-18"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-(--space-12) lg:gap-(--space-4)">
          <div className="flex items-center gap-(--space-12) lg:gap-(--space-8)">
            <h3 className="type-body min-w-0 flex-1 text-(--text-strong) lg:flex-none">
              {businessName}
            </h3>
            <StatusChip status={status} className="shrink-0" />
          </div>
          <p className="type-caption tabular text-(--text-body) lg:hidden">{summary}</p>
          <p className="type-caption tabular hidden text-(--text-muted) lg:block">{serviceLine}</p>
          <p className="type-label tabular hidden text-(--text-body) lg:block">{whenLine}</p>
          {detail}
        </div>
      </div>

      {actions && <div className="lg:shrink-0">{actions}</div>}
    </article>
  )
}
