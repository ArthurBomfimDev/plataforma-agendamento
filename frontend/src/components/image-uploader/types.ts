import type { ImageSet } from '@api/models'
import type { ReactNode } from 'react'

/** `idle`: nada em andamento. `uploading`: enviando, com progresso. `done`: acabou de enviar. */
export type UploadStatus = 'idle' | 'uploading' | 'done'

export type ImageUploaderProps = {
  /** Prefixo dos ids (rótulo, ajuda, progresso). */
  id: string
  /** O que é a imagem: "Logotipo", "Capa", "Foto do profissional". */
  label: string
  /** Imagem atual, vinda da API. Nula: mostra o `fallback`. */
  current: ImageSet | null
  /** Padrão visual sem imagem (ilustração, iniciais). */
  fallback: ReactNode
  /** Formato da pré-visualização. */
  shape?: 'cover' | 'square' | 'round'
  /**
   * Envia o arquivo e devolve a imagem nova. A tela liga isto à rota certa — por exemplo
   * `managementService.uploadBusinessImage('logo', file, onProgress)`.
   */
  onUpload: (file: File, onProgress: (fraction: number) => void) => Promise<ImageSet | null>
  /** Remove a imagem. Ausente: sem botão de remover. */
  onRemove?: () => Promise<void>
  disabled?: boolean
}

export type ImageUploaderViewProps = {
  id: string
  label: string
  shape: 'cover' | 'square' | 'round'
  /** O que mostrar agora: a pré-visualização local, a imagem atual ou o padrão. */
  preview: ReactNode
  hasImage: boolean
  status: UploadStatus
  /** De 0 a 1, enquanto envia. */
  progress: number
  error?: string
  canRemove: boolean
  disabled?: boolean
  onChoose?: () => void
  onRemove?: () => void
}
