import type { ImageSet } from '@api/models'

export type ProfessionalAvatarProps = {
  name: string
  /** O `photo` do DTO do profissional. Nulo ou ausente: iniciais. */
  photo?: ImageSet | null
  /** `sm` 32 px, `md` 40 px (padrão), `lg` 56 px, `xl` 80 px. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}
