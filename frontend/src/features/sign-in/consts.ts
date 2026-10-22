import { CalendarCheck, MapPin, Search } from 'lucide-react'
import type { SignInErrors, SignInRole, SignInValues } from './types'

import type { Variants } from 'framer-motion'

export const ROLE_OPTIONS: readonly { value: SignInRole; label: string }[] = [
  { value: 'customer', label: 'Sou consumidor' },
  { value: 'business', label: 'Sou estabelecimento' },
]

/** O subtítulo acompanha o seletor: diz o que cada lado faz depois de entrar. */
export const ROLE_SUBTITLES: Record<SignInRole, string> = {
  customer: 'Faça login para agendar seus serviços.',
  business: 'Faça login para gerenciar sua agenda.',
}

export const PASSWORD_MIN_LENGTH = 8

/** Algo antes e depois do `@` e um ponto no domínio. A validação real é o e-mail chegar. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Valida no envio. Não diz se a conta existe — isso é da API, e só depois da tentativa. */
export const validateSignIn = (values: SignInValues): SignInErrors => {
  const errors: SignInErrors = {}

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Informe um e-mail válido'
  }
  if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `A senha tem no mínimo ${PASSWORD_MIN_LENGTH} caracteres`
  }

  return errors
}

export const PILLARS = [
  { icon: CalendarCheck, title: 'Agende', description: 'sem ligar para ninguém' },
  { icon: Search, title: 'Escolha', description: 'o horário que te serve' },
  { icon: MapPin, title: 'Vá', description: 'e aproveite' },
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
