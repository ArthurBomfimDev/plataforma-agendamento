import type { TONE_CLASSES } from '../../consts'

export type VerificationProgressProps = {
  done: number
  total: number
  tone: keyof typeof TONE_CLASSES
  /** Estica os segmentos pela largura disponível (modal), em vez da largura fixa da faixa. */
  fill?: boolean
  className?: string
}
