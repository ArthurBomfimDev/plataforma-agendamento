import { Eye, EyeOff, X } from 'lucide-react'

import { Input } from '../ui/input'
import { Label } from '../ui/label'
import type { PasswordFieldProps } from './types'
import { cn } from 'cn'
import { useState } from 'react'

/**
 * Campo de senha com o botão "Mostrar senha" dentro do campo. Mesma aparência e mesmos estados do
 * `TextField` (rótulo visível, ajuda e erro ligados por `aria-describedby`).
 *
 * O botão é um alternador: o nome acessível fica fixo ("Mostrar senha") e o estado vai em
 * `aria-pressed` — trocar o nome e o estado ao mesmo tempo faria o leitor de tela anunciar o
 * contrário do que acontece. É `<button>`, então Enter e Espaço funcionam sem código.
 */
export const PasswordField = (props: PasswordFieldProps) => {
  const { id, label, helper, helperClassName, error, className, ...inputProps } = props
  const [visible, setVisible] = useState(false)

  const helperId = `${id}-helper`
  const describedBy = error || helper ? helperId : undefined

  return (
    <div className={cn('flex flex-col gap-(--space-4)', className)}>
      <Label htmlFor={id} className="type-label leading-(--line-height-label) text-(--text-body)">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          {...inputProps}
          // Senha nunca passa por corretor nem por capitalização automática.
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-auto min-h-(--size-touch-min) rounded-md border-(--border-interactive) bg-(--bg-surface) py-(--space-12) pr-[calc(var(--size-touch-min)+var(--space-4))] pl-(--space-16) text-(length:--size-input) leading-(--line-height-input) text-(--text-strong) placeholder:text-(--text-muted) focus-visible:border-(--border-focus) focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) disabled:bg-(--bg-disabled) disabled:opacity-100 md:text-(length:--size-input)',
            'aria-invalid:border-2 aria-invalid:border-(--border-error) aria-invalid:py-[calc(var(--space-12)-1px)] aria-invalid:pl-[calc(var(--space-16)-1px)] aria-invalid:ring-0',
          )}
        />
        <button
          type="button"
          aria-label="Mostrar senha"
          aria-pressed={visible}
          aria-controls={id}
          title={visible ? 'Ocultar senha' : 'Mostrar senha'}
          disabled={inputProps.disabled}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex min-h-(--size-touch-min) min-w-(--size-touch-min) items-center justify-center rounded-md text-(--text-muted) hover:text-(--text-strong) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--border-focus) disabled:opacity-50"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="size-5" />
          ) : (
            <Eye aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>
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
