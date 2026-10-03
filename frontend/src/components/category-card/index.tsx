import type { CategoryCardProps } from './types'
import { cn } from 'cn'

export const CategoryCard = (props: CategoryCardProps) => {
  const { label, icon: Icon, onClick, className } = props

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-(--size-touch-min) w-full flex-col items-start gap-(--space-12) rounded-lg bg-(--bg-surface-raised) p-(--space-16) text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
        className,
      )}
    >
      <span className="flex items-center justify-center rounded-(--radius-full) bg-(--bg-surface)">
        <Icon aria-hidden="true" className="size-5 text-(--action-primary)" />
      </span>
      <span className="type-label text-(--text-strong)">{label}</span>
    </button>
  )
}
