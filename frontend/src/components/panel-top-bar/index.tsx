import { BusinessIllustration } from '@components/image-defaults/business-illustration'
import type { ImageSet } from '@api/models'
import { SmartImage } from '@components/smart-image'
import { ThemeToggle } from '@components/theme-toggle'

type PanelTopBarProps = {
  businessName: string
  logo: ImageSet | null
  category: string
}

/**
 * Barra superior do painel no celular e no tablet: o estabelecimento e o tema, em todas as telas do painel. No desktop
 * os dois moram na barra lateral. Rola com a tela, para não somar altura ao cabeçalho fixo de cada uma.
 */
export const PanelTopBar = ({ businessName, logo, category }: PanelTopBarProps) => (
  <div className="flex items-center gap-(--space-8) border-b border-(--border-subtle) bg-(--bg-surface) px-(--space-16) pt-[env(safe-area-inset-top)] lg:hidden">
    <SmartImage
      image={logo}
      alt=""
      sizes="32px"
      width={1}
      height={1}
      fallback={<BusinessIllustration category={category} square />}
      className="size-8 shrink-0 rounded-md"
    />
    <p className="type-label min-w-0 flex-1 truncate text-(--text-strong)">{businessName}</p>
    <ThemeToggle />
  </div>
)
