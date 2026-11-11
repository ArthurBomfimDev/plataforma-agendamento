import { type IconComponent } from '@assets/icons'

export type CategoryCardProps = {
  label: string
  icon: IconComponent
  onClick?: () => void
  className?: string
}
