import { HOME_CATEGORIES, HOME_NEARBY_ESTABLISHMENTS } from './mock'

import { BottomNavigation } from '../../components/bottom-navigation'
import { CONTENT_BOTTOM_PADDING } from './consts'
import { CardEstablishment } from '../../components/card-establishment'
import { CategoryCard } from '../../components/category-card'
import { MapPin } from 'lucide-react'
import { SearchField } from '../../components/search-field'

/**
 * Tela 01 · Home — busca e descoberta (Figma, 390px).
 */
export const HomeScreen = () => {
  return (
    <div className="min-h-dvh bg-(--bg-page)">
      <header className="flex flex-col gap-(--space-12) bg-(--bg-surface) p-(--space-16) pt-[calc(var(--space-16)+env(safe-area-inset-top))]">
        <p className="type-caption flex items-center gap-(--space-4) text-(--text-muted)">
          <MapPin aria-hidden="true" className="size-4" />
          <span>Agendando em</span>
          <span className="text-(--text-link)">Duartina, SP</span>
        </p>
        <h1 className="type-title text-(--text-strong)">O que você quer agendar?</h1>
        <SearchField label="Buscar" placeholder="Buscar serviço, local ou profissional" />
      </header>

      <main
        className={`flex flex-col gap-(--space-24) px-(--space-16) pt-(--space-20) ${CONTENT_BOTTOM_PADDING}`}
      >
        <section aria-labelledby="home-categories" className="flex flex-col gap-(--space-12)">
          <h2 id="home-categories" className="type-heading text-(--text-strong)">
            Categorias
          </h2>
          <ul className="grid grid-cols-2 gap-(--space-12)">
            {HOME_CATEGORIES.map(({ id, label, icon }) => (
              <li key={id}>
                <CategoryCard label={label} icon={icon} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="home-nearby" className="flex flex-col gap-(--space-12)">
          <h2 id="home-nearby" className="type-heading text-(--text-strong)">
            Perto de você
          </h2>
          <ul className="flex flex-col gap-(--space-12)">
            {HOME_NEARBY_ESTABLISHMENTS.map(({ id, ...establishment }) => (
              <li key={id}>
                <CardEstablishment {...establishment} />
              </li>
            ))}
          </ul>
        </section>
      </main>

      <BottomNavigation activeItem="search" />
    </div>
  )
}
