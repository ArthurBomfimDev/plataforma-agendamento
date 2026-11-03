import { ChevronRightIcon } from '@assets/icons'
import type { SettingRowProps } from './types'
import { cn } from 'cn'

const ROW = 'flex min-h-14 w-full items-center gap-(--space-12) py-(--space-12) text-left'

/**
 * "Linha de ajuste" do Figma: rótulo, o valor atual embaixo e, à direita, um chevron (abre algo) ou um
 * texto curto. Com `onClick` vira botão do tamanho do alvo de toque; sem ele, é só informação.
 */
export const SettingRow = (props: SettingRowProps) => {
  const { label, value, trailing, onClick, className } = props

  const content = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
        <span className="type-label text-(--text-strong)">{label}</span>
        <span className="type-caption text-(--text-muted)">{value}</span>
      </span>
      {trailing && <span className="type-label shrink-0 text-(--text-muted)">{trailing}</span>}
      {onClick && (
        <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-(--text-body)" />
      )}
    </>
  )

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        ROW,
        'cursor-pointer rounded-(--radius-sm) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
        className,
      )}
    >
      {content}
    </button>
  ) : (
    <div className={cn(ROW, className)}>{content}</div>
  )
}
