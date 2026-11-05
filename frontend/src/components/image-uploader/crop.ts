/** Lado da área de recorte na tela, em pixels. */
export const CROP_VIEWPORT = 280
export const MAX_ZOOM = 3
/** Lado máximo do arquivo gerado: o backend ainda faz as três variantes a partir dele. */
export const CROP_OUTPUT_MAX = 1024

export type CropState = { zoom: number; x: number; y: number }
export type ImageSize = { width: number; height: number }

export const INITIAL_CROP: CropState = { zoom: 1, x: 0, y: 0 }

/** Pixels da tela por pixel da imagem: com zoom 1, o lado menor preenche a área. */
export const scaleOf = ({ width, height }: ImageSize, zoom: number) =>
  (CROP_VIEWPORT / Math.min(width, height)) * zoom

/** A imagem nunca deixa vazio dentro da área: o deslocamento para na borda dela. */
export const clampCrop = (image: ImageSize, crop: CropState): CropState => {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, crop.zoom))
  const scale = scaleOf(image, zoom)
  const limitX = (image.width * scale - CROP_VIEWPORT) / 2
  const limitY = (image.height * scale - CROP_VIEWPORT) / 2
  return {
    zoom,
    x: Math.min(limitX, Math.max(-limitX, crop.x)),
    y: Math.min(limitY, Math.max(-limitY, crop.y)),
  }
}

/** O quadrado da imagem original que está dentro da área, em pixels da imagem. */
export const cropRect = (image: ImageSize, crop: CropState) => {
  const scale = scaleOf(image, crop.zoom)
  const size = CROP_VIEWPORT / scale
  return {
    x: (image.width - size) / 2 - crop.x / scale,
    y: (image.height - size) / 2 - crop.y / scale,
    size,
  }
}

/** Desenha o recorte e devolve um arquivo novo, no mesmo formato do original. */
export const cropToFile = async (image: HTMLImageElement, file: File, crop: CropState) => {
  const rect = cropRect({ width: image.naturalWidth, height: image.naturalHeight }, crop)
  const side = Math.min(CROP_OUTPUT_MAX, Math.round(rect.size))
  const canvas = document.createElement('canvas')
  canvas.width = side
  canvas.height = side
  canvas.getContext('2d')?.drawImage(image, rect.x, rect.y, rect.size, rect.size, 0, 0, side, side)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type, 0.92))
  if (!blob) throw new Error('crop_failed')
  return new File([blob], file.name, { type: blob.type })
}
