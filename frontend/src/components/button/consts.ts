import type { ButtonProps } from './types'

export const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-(--action-primary) text-(--text-on-action) hover:bg-(--action-primary-hover)',
  secondary:
    'border-(--border-interactive) bg-(--bg-surface) text-(--text-link) hover:bg-(--bg-surface) hover:text-(--text-link)',
  ghost: 'bg-transparent text-(--text-link) hover:bg-transparent hover:text-(--text-link)',
}

export const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  md: 'type-label px-(--space-16) py-(--space-12)',
  lg: 'type-body px-(--space-24) py-(--space-16)',
}
