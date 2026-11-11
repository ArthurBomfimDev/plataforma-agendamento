import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@components/ui/alert-dialog'
import { type CropState, INITIAL_CROP, cropToFile } from './crop'
import { useRef, useState } from 'react'

import { Button } from '@components/button'
import { CropEditor } from './crop-editor'
import { useObjectUrl } from '@hooks/use-object-url'

type CropDialogProps = {
  /** O arquivo escolhido. Nulo: o diálogo fica fechado. */
  file: File | null
  onCancel: () => void
  onConfirm: (cropped: File) => void
}

/** Recorte antes do envio, igual em toda foto quadrada: logotipo, perfil, equipe e serviço. */
export const CropDialog = ({ file, onCancel, onConfirm }: CropDialogProps) => {
  const src = useObjectUrl(file)
  const imageRef = useRef<HTMLImageElement>(null)
  const crop = useRef<CropState>(INITIAL_CROP)
  const [failed, setFailed] = useState(false)

  const confirm = async () => {
    if (!file || !imageRef.current) return
    try {
      setFailed(false)
      onConfirm(await cropToFile(imageRef.current, file, crop.current))
    } catch {
      setFailed(true)
    }
  }

  return (
    <AlertDialog open={file !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="w-[calc(100%-2*var(--space-16))] max-w-sm gap-(--space-16) rounded-lg bg-(--bg-surface) p-(--space-16) text-(--text-body) ring-0 shadow-(--elevation-card) data-[size=default]:max-w-sm">
        <div className="flex flex-col gap-(--space-4)">
          <AlertDialogTitle className="type-heading text-(--text-strong)">
            Ajustar a foto
          </AlertDialogTitle>
          <AlertDialogDescription className="type-caption text-(--text-muted)">
            Arraste a imagem e use o zoom. O círculo mostra como ela aparece.
          </AlertDialogDescription>
        </div>
        {src && (
          <CropEditor
            key={src}
            src={src}
            imageRef={imageRef}
            onChange={(next) => (crop.current = next)}
          />
        )}
        {failed && (
          <p role="alert" className="type-label text-(--status-rejected-fg)">
            Não foi possível recortar esta imagem. Tente outra.
          </p>
        )}
        <div className="flex flex-col gap-(--space-8)">
          <Button size="lg" className="w-full" onClick={() => void confirm()}>
            Usar esta foto
          </Button>
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
