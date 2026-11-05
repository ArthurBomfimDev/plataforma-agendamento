import { cn } from 'cn'

/**
 * Ilustração padrão do estabelecimento sem imagem (Onda 6D), por categoria. Arte própria, feita aqui: formas
 * simples em SVG pintadas só com tokens da R5 (`var(--…)`), então o tema claro e o escuro vêm de graça — os tokens
 * mudam e o desenho acompanha. Decorativa: a informação (nome, categoria) está no texto ao lado.
 *
 * Proporção 16:9, a mesma da capa; preenche o espaço reservado sem salto de layout.
 */
export const BusinessIllustration = ({
  category,
  className,
}: {
  category: string
  className?: string
}) => {
  const health = category === 'Saude'

  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={cn('block size-full', className)}
      data-category={health ? 'Saude' : 'Beleza'}
    >
      <rect width="320" height="180" fill="var(--bg-accent-soft)" />
      <circle cx="268" cy="34" r="70" fill="var(--action-soft)" />
      <circle cx="40" cy="168" r="56" fill="var(--bg-surface-raised)" />
      {health ? <HealthMark /> : <BeautyMark />}
    </svg>
  )
}

/** Beleza: um pente estilizado e três brilhos. */
const BeautyMark = () => (
  <g>
    <rect x="118" y="64" width="84" height="22" rx="11" fill="var(--text-link)" />
    {Array.from({ length: 7 }, (_, i) => (
      <rect
        key={i}
        x={124 + i * 11}
        y="82"
        width="5"
        height="30"
        rx="2.5"
        fill="var(--text-link)"
      />
    ))}
    <path d="M226 52l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="var(--text-accent)" />
    <path d="M92 104l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="var(--text-accent)" />
    <path
      d="M238 112l2.5 5.5 5.5 2.5-5.5 2.5-2.5 5.5-2.5-5.5-5.5-2.5 5.5-2.5z"
      fill="var(--text-link)"
    />
  </g>
)

/** Saúde: uma cruz de cantos redondos e a linha de um batimento. */
const HealthMark = () => (
  <g>
    <rect x="140" y="46" width="40" height="88" rx="12" fill="var(--text-link)" />
    <rect x="116" y="70" width="88" height="40" rx="12" fill="var(--text-link)" />
    <path
      d="M60 132h44l10-20 14 34 12-26h120"
      fill="none"
      stroke="var(--text-accent)"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </g>
)
