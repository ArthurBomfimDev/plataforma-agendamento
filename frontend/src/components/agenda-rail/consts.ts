import type { AgendaRailVertical } from './types'
import type { Variants } from 'framer-motion'

/** Altura de cada linha da grade, em px. A linha do agora se posiciona por ela. */
export const ROW_HEIGHT = 52

/** Saída rápida e pouso suave. */
const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** Quanto a agenda desliza na troca, em px. `direction` é 1 para a frente e -1 para trás. */
const SLIDE = 48

export const RAIL_VARIANTS = {
  panel: {
    enter: (direction: number) => ({ x: SLIDE * direction, opacity: 0 }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: EASE_OUT, staggerChildren: 0.04, delayChildren: 0.06 },
    },
    exit: (direction: number) => ({
      x: -SLIDE * direction,
      opacity: 0,
      transition: { duration: 0.18, ease: 'easeIn' },
    }),
  },
  row: {
    enter: { y: 12, opacity: 0 },
    center: { y: 0, opacity: 1, transition: { duration: 0.4, ease: EASE_OUT } },
  },
  /** A régua corre da esquerda para a direita até o rótulo "AGORA". */
  rule: {
    enter: { scaleX: 0 },
    center: { scaleX: 1, transition: { duration: 0.6, ease: EASE_OUT } },
  },
  now: {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 0.3 } },
  },
} satisfies Record<string, Variants>

/**
 * Os três recortes do Figma (A01c). Dados estáticos e decorativos: não vêm da API e não representam
 * disponibilidade real.
 */
export const AGENDA_VERTICALS: readonly AgendaRailVertical[] = [
  {
    id: 'barbershop',
    name: 'Barbearia',
    business: 'Estúdio Duartina',
    date: 'sexta, 11 de setembro',
    hours: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
    slots: [
      { kind: 'appointment', time: '09:00', label: 'Corte masculino' },
      { kind: 'appointment', time: '10:00', label: 'Corte + barba' },
      { kind: 'free', time: '10:30' },
      { kind: 'appointment', time: '11:30', label: 'Coloração' },
      { kind: 'break', time: '13:00', label: 'Almoço' },
      { kind: 'appointment', time: '14:00', label: 'Barba' },
    ],
    freeToday: 4,
  },
  {
    id: 'nails',
    name: 'Studio de unhas',
    business: 'Studio Lins Nails',
    date: 'sexta, 11 de setembro',
    hours: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
    slots: [
      { kind: 'appointment', time: '09:00', label: 'Alongamento em gel' },
      { kind: 'free', time: '10:00' },
      { kind: 'appointment', time: '11:00', label: 'Manutenção' },
      { kind: 'appointment', time: '12:00', label: 'Spa dos pés' },
      { kind: 'break', time: '13:00', label: 'Almoço' },
      { kind: 'appointment', time: '14:00', label: 'Esmaltação em gel' },
    ],
    freeToday: 2,
  },
  {
    id: 'physiotherapy',
    name: 'Fisioterapia',
    business: 'Clínica Movimento',
    date: 'sexta, 11 de setembro',
    hours: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'],
    slots: [
      { kind: 'appointment', time: '08:00', label: 'Avaliação postural' },
      { kind: 'appointment', time: '09:00', label: 'Sessão · pós-operatório' },
      { kind: 'free', time: '10:00' },
      { kind: 'appointment', time: '11:00', label: 'Pilates clínico' },
      { kind: 'break', time: '12:00', label: 'Intervalo' },
      { kind: 'appointment', time: '13:00', label: 'Reabilitação de joelho' },
    ],
    freeToday: 3,
  },
]
