import { ImageUploader } from '@components/image-uploader'
import type { ImageUploaderProps } from '@components/image-uploader/types'
import type { TeamMember } from '../../types'

/** Enviar e remover a foto de um profissional: as mesmas funções da aba Fotos. */
export type MemberPhotoActions = {
  onUpload: (professionalId: string) => ImageUploaderProps['onUpload']
  onRemove: (professionalId: string) => NonNullable<ImageUploaderProps['onRemove']>
}

export type MemberPhotoProps = MemberPhotoActions & {
  /** Distingue os dois lugares em que a foto aparece, para o `id` do campo não se repetir. */
  place: 'detail' | 'sheet'
  member: TeamMember
}

const noteOf = (member: TeamMember) => {
  if (!member.hasAccount && !member.authorizationDeclared) {
    return 'Para enviar, marque antes a declaração de autorização em Editar.'
  }
  return member.photo ? 'Aparece na página pública' : 'Sem foto, aparecem as iniciais'
}

/** A foto do profissional na aba Equipe. Mesma rota e mesmo cache da aba Fotos: uma fonte só. */
export const MemberPhoto = ({ place, member, onUpload, onRemove }: MemberPhotoProps) => (
  <ImageUploader
    id={`team-photo-${place}-${member.id}`}
    label="Foto"
    note={noteOf(member)}
    removeOf={`de ${member.displayName}`}
    shape="card"
    current={member.photo ?? null}
    fallback={
      <span className="type-caption flex size-full items-center justify-center text-(--text-muted)">
        sem foto
      </span>
    }
    onUpload={onUpload(member.id)}
    onRemove={onRemove(member.id)}
  />
)
