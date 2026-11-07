import { EventAvailableIcon, LocationIcon, SearchIcon } from '@assets/icons'
import type { SignInErrors, SignInValues } from './types'

import type { Variants } from 'framer-motion'

/**
 * O foco e o desabilitado dos campos desta tela (Figma, A01s): borda de 2px com halo de 3px a 16%,
 * em vez do contorno dos outros formulários. O padding cai 1px para o texto não pular.
 */
export const FORM_CLASSES =
  'flex flex-col gap-(--space-16) auth:gap-4.5 [&_input:disabled]:border-(--border-subtle) [&_input:disabled]:text-(--text-disabled) [&_input:focus-visible:not([aria-invalid])]:border-2 [&_input:focus-visible:not([aria-invalid])]:py-[calc(var(--space-12)-1px)] [&_input:focus-visible:not([aria-invalid])]:pl-[calc(var(--space-16)-1px)] [&_input:focus-visible:not([aria-invalid])]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--border-focus)_16%,transparent)] [&_input:focus-visible:not([aria-invalid])]:outline-none'

/** Link de texto com alvo de toque de 44px. */
export const LINK_CLASSES =
  'type-body inline-flex min-h-(--size-touch-min) items-center rounded-(--radius-sm) text-(--text-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)'

export const PASSWORD_MIN_LENGTH = 8

export const EMAIL_FORMAT_ERROR = 'Digite um e-mail completo, com @ e domínio.'

/** Algo antes e depois do `@` e um ponto no domínio. A validação real é o e-mail chegar. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email.trim())

/** Mesmos limites do backend (`IdentityPolicy`). */
export const PASSWORD_MAX_LENGTH = 128

/** Valida no envio. Não diz se a conta existe — isso é da API, e só depois da tentativa. */
export const validateSignIn = (values: SignInValues): SignInErrors => {
  const errors: SignInErrors = {}

  if (!isValidEmail(values.email)) {
    errors.email = EMAIL_FORMAT_ERROR
  }
  if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Digite sua senha, com no mínimo ${PASSWORD_MIN_LENGTH} caracteres.`
  }

  return errors
}

export const PILLARS = [
  { icon: EventAvailableIcon, title: 'Agende', description: 'sem ligar para ninguém' },
  { icon: SearchIcon, title: 'Escolha', description: 'o horário que te serve' },
  { icon: LocationIcon, title: 'Vá', description: 'e aproveite' },
]

/** Saída rápida e pouso suave: o elemento chega quase todo no começo e assenta no fim. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** Entrada em cascata: os filhos aparecem um depois do outro. */
export const stagger = (delayChildren: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren } },
})

/** Cada filho da cascata sobe 16px enquanto aparece. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
}
