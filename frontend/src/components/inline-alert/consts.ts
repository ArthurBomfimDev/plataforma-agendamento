import { CheckCircleIcon, ErrorIcon } from '@assets/icons'

/** Cada tom tem o próprio ícone: o estado nunca depende só da cor. */
export const TONES = {
  error: {
    icon: ErrorIcon,
    role: 'alert',
    box: 'bg-(--status-rejected-bg) text-(--status-rejected-fg)',
    bar: 'bg-(--status-rejected-fg)',
  },
  success: {
    icon: CheckCircleIcon,
    role: 'status',
    box: 'bg-(--status-confirmed-bg) text-(--status-confirmed-fg)',
    bar: 'bg-(--status-confirmed-fg)',
  },
} as const
