import type { CardEstablishmentImageProps } from './types'

export const CardEstablishmentImage = (props: CardEstablishmentImageProps) => {
  const { className } = props

  return (
    <img
      src="https://blog.explorersclub.com.br/wp-content/uploads/2025/12/Gojo-Satoru-Jujutsu-Kaisen.webp"
      alt="gojo"
      className={className}
    />
  )
}
