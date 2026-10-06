import { Label } from '../ui/label'
import type { TextAreaFieldProps } from './types'
import { Textarea } from '../ui/textarea'
import { cn } from 'cn'

/**
 * Campo do Figma, versão de várias linhas, construído sobre o Textarea e o Label do shadcn. A lib dá
 * o elemento nativo; aqui entram os tokens, o rótulo visível e o texto de ajuda acessível.
 */
export const TextAreaField = (props: TextAreaFieldProps) => {
  const { id, label, helper, className, ...textareaProps } = props

  const helperId = helper ? `${id}-helper` : undefined

  return (
    <div className={cn('flex flex-col gap-(--space-4)', className)}>
      <Label htmlFor={id} className="type-label leading-(--line-height-label) text-(--text-body)">
        {label}
      </Label>
      {/* Campo de formulário é 16px sempre — abaixo disso o Safari do iOS dá zoom no foco. */}
      <Textarea
        {...textareaProps}
        id={id}
        aria-describedby={helperId}
        className="h-25 min-h-(--size-touch-min) rounded-md border-(--border-interactive) bg-(--bg-surface) px-(--space-16) py-(--space-12) text-(length:--size-input) leading-(--line-height-input) text-(--text-strong) field-sizing-fixed placeholder:text-(--text-body) focus-visible:border-(--border-focus) focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) md:text-(length:--size-input)"
      />
      {helper && (
        <p id={helperId} className="type-caption text-(--text-muted)">
          {helper}
        </p>
      )}
    </div>
  )
}
