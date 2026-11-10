import type { InlineAlertProps } from './types'
import { TONES } from './consts'
import { cn } from 'cn'

/**
 * Alerta em linha do Figma (nó 404:151): resultado dentro do fluxo da página. Não é toast, então
 * fica no lugar e não some sozinho. O tom de erro é anunciado na hora pelo leitor de tela.
 */
export const InlineAlert = (props: InlineAlertProps) => {
  const { tone = 'error', children, className } = props
  const { icon: Icon, role, box, bar } = TONES[tone]

  return (
    <div
      role={role}
      className={cn('flex w-full overflow-hidden rounded-(--radius-md)', box, className)}
    >
      <span aria-hidden="true" className={cn('w-0.75 shrink-0', bar)} />
      <div className="flex min-w-0 flex-1 items-center gap-(--space-12) py-(--space-12) pr-(--space-16) pl-(--space-12)">
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        <p className="type-body min-w-0 flex-1 text-current">{children}</p>
      </div>
    </div>
  )
}
