import { Avatar } from '@components/avatar'
import type { ProfessionalAvatarProps } from './types'
import { initialsOf } from '@components/image-defaults/initials-of'
import { mediaUrl } from '@api/services/media'

/** Tamanho pedido → arquivo do `ImageSet`: `small` tem 160 px, o bastante até 56 px; acima disso, `medium`. */
const PHOTO_SIZE = { sm: 'small', md: 'small', lg: 'small', xl: 'medium' } as const

/**
 * Único jeito de mostrar um profissional como pessoa: a foto quando existe e, sem ela (ou se falhar ao carregar), as
 * iniciais. Todo lugar que lista, escolhe ou cita um profissional usa este componente com o `photo` que o DTO traz
 * (`ImageSetResponse`, o mesmo campo em todos os endpoints). Decorativo: o nome está escrito ao lado.
 *
 * A URL da foto passa por `mediaUrl`, a camada única que resolve `/media/...` contra a base da API (regra de
 * empacotamento 1): nunca `window.location.origin`.
 */
export const ProfessionalAvatar = (props: ProfessionalAvatarProps) => {
  const { name, photo, size = 'md', className } = props

  return (
    <Avatar
      alt=""
      size={size}
      src={photo ? mediaUrl(photo[PHOTO_SIZE[size]]) : undefined}
      initials={initialsOf(name)}
      className={className}
    />
  )
}
