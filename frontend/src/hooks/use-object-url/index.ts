import { useEffect, useMemo } from 'react'

/**
 * URL local de um arquivo escolhido (pré-visualização antes do envio), revogada quando o arquivo muda ou a tela
 * sai. Atrás de hook pela regra 5: nenhum componente chama `URL.createObjectURL` direto.
 */
export const useObjectUrl = (file: Blob | null) => {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )

  return url
}
