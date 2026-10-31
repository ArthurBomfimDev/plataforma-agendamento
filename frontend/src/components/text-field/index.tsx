import { FIELD_BOX_CLASSES, FIELD_LABEL_CLASSES } from './consts'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import type { TextFieldProps } from './types'
import { X } from 'lucide-react'
import { cn } from 'cn'

/**
 * Campo do Figma (component set "Campo": default, focus, error, disabled), construído sobre o
 * Input e o Label do shadcn (Base UI). A lib dá o elemento nativo; aqui entram os tokens, o rótulo
 * visível e o texto de ajuda e de erro acessíveis.
 */
export const TextField = (props: TextFieldProps) => {
  const { id, label, labelClassName, helper, helperClassName, error, className, ...inputProps } =
    props

  const helperId = `${id}-helper`
  const describedBy = error || helper ? helperId : undefined

  return (
    <div className={cn('flex flex-col gap-(--space-4)', className)}>
      <Label htmlFor={id} className={cn(FIELD_LABEL_CLASSES, labelClassName)}>
        {label}
      </Label>
      {/* Campo de formulário é 16px sempre — abaixo disso o Safari do iOS dá zoom no foco. */}
      <Input
        {...inputProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          FIELD_BOX_CLASSES,
          'placeholder:text-(--text-muted)',
          // Erro: borda de 2px na cor de recusa; o padding cai 1px para o texto não pular.
          'aria-invalid:border-2 aria-invalid:border-(--border-error) aria-invalid:px-[calc(var(--space-16)-1px)] aria-invalid:py-[calc(var(--space-12)-1px)] aria-invalid:ring-0',
        )}
      />
      {error ? (
        <p
          id={helperId}
          className="type-caption flex items-center gap-(--space-4) text-(--status-rejected-fg)"
        >
          <X aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      ) : (
        helper && (
          <p id={helperId} className={cn('type-caption text-(--text-muted)', helperClassName)}>
            {helper}
          </p>
        )
      )}
    </div>
  )
}
