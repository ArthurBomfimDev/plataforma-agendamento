import { PHOTOS_CARD, PHOTOS_OVERLINE, professionalNote } from '../../consts'

import { ImageUploader } from '@components/image-uploader'
import type { TeamPhotosCardProps } from './types'

/** Foto de cada profissional ativo (Figma 19, segundo cartão): quatro por linha no desktop. */
export const TeamPhotosCard = (props: TeamPhotosCardProps) => {
  const { professionals, onUpload, onRemove } = props

  return (
    <section aria-labelledby="photos-team" className={PHOTOS_CARD}>
      <h2 id="photos-team" className={PHOTOS_OVERLINE}>
        Fotos da equipe
      </h2>
      {professionals.length === 0 ? (
        <p role="status" className="type-body text-(--text-muted)">
          Nenhum profissional ativo. Cadastre a equipe em Profissionais.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {professionals.map((professional) => (
            <li key={professional.id} className="min-w-0">
              <ImageUploader
                id={`photo-professional-${professional.id}`}
                label={professional.name}
                description={professional.specialty ?? undefined}
                note={professionalNote(professional)}
                removeOf={`de ${professional.name}`}
                shape="card"
                current={professional.photo}
                fallback={
                  <span className="type-caption flex size-full items-center justify-center text-(--text-muted)">
                    sem foto
                  </span>
                }
                onUpload={onUpload(professional.id)}
                onRemove={onRemove(professional.id)}
              />
            </li>
          ))}
        </ul>
      )}
      <p className="type-caption text-(--text-muted)">
        Todo profissional ativo aparece na página pública — a foto é opcional. O próprio
        profissional também pode trocar a dele pela conta dele. A foto só aparece com o perfil
        completo, que depende do consentimento do próprio profissional.
      </p>
    </section>
  )
}
