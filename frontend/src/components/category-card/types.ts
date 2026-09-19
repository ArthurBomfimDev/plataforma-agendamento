import type { LucideIcon } from 'lucide-react'

export type CategoryCardProps = {
  label: string
  icon: LucideIcon
  onClick?: () => void
  className?: string
}
