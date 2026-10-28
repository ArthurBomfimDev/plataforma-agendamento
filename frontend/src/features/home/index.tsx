import { HOME_CATEGORIES } from './mock'
import { NAVIGATION_PATHS, businessPath } from '@router/consts'

import { BottomNavigation } from '@components/bottom-navigation'
import { Button } from '@components/button'
import { CONTENT_BOTTOM_PADDING } from '@components/bottom-navigation/conts'
import { CardEstablishment } from '@components/card-establishment'
import { CategoryCard } from '@components/category-card'
import type { HomeScreenProps } from './types'
import { MapPin } from 'lucide-react'
import { PageContainer } from '@components/page-container'
import { SearchField } from '@components/search-field'
import { locationReference } from '@components/top-bar/consts'
import { useNavigate } from 'react-router'

/**
 * Tela 01 · Home — busca e descoberta (Figma, 390px; desktop: 01D, 1440px).
 */
export const HomeScreen = (props: HomeScreenProps) => {
  const { locationLabel, nearby, onChooseLocation } = props
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-(--bg-page)">
      <PageContainer>
        <header className="flex flex-col gap-(--space-12) bg-(--bg-surface) p-(--space-16) pt-[calc(var(--space-16)+env(safe-area-inset-top))] md:bg-transparent lg:items-center lg:gap-(--space-16) lg:px-0 lg:pt-(--space-40) lg:pb-0 lg:text-center">
          {/* No desktop a referência fica na barra superior. Sempre clicável para trocar. */}
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={onChooseLocation}
            className="type-caption -my-(--space-12) flex min-h-(--size-touch-min) items-center gap-(--space-4) self-start rounded-md text-(--text-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus) lg:hidden"
          >
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            <span>{locationReference(locationLabel)}</span>
            {locationLabel && <span className="sr-only">, trocar localização</span>}
          </button>
          <h1 className="type-title text-(--text-strong) lg:text-(length:--size-display)! lg:leading-(--line-height-display)!">
            O que você quer agendar?
          </h1>
          <p className="type-body-lg hidden max-w-160 text-(--text-muted) lg:block">
            Escolha o serviço, veja o horário livre e envie o pedido. O estabelecimento confirma.
          </p>
          {/* TODO(figma): a sombra da busca no desktop não tem token; o valor é o do Figma. */}
          <SearchField
            label="Buscar"
            placeholder="Buscar serviço, local ou profissional"
            className="lg:w-full lg:max-w-180 lg:rounded-(--radius-full) lg:bg-(--bg-surface) lg:py-(--space-8) lg:pr-(--space-8) lg:pl-(--space-20) lg:shadow-[0_2px_8px_0_#1c1a170f]"
            inputClassName="lg:text-(length:--size-body-lg)! lg:leading-(--line-height-body-lg)!"
            // TODO: a busca ainda não tem rota; o botão não faz nada.
            action={<Button className="hidden shrink-0 lg:inline-flex">Buscar</Button>}
          />
        </header>

        <main
          className={`flex flex-col gap-(--space-24) px-(--space-16) pt-(--space-20) lg:gap-(--space-40) lg:px-0 lg:pt-(--space-40) ${CONTENT_BOTTOM_PADDING}`}
        >
          <section
            aria-labelledby="home-categories"
            className="flex flex-col gap-(--space-12) lg:gap-(--space-16)"
          >
            <h2 id="home-categories" className="type-heading text-(--text-strong)">
              Categorias
            </h2>
            <ul className="grid grid-cols-2 gap-(--space-12) md:grid-cols-4">
              {HOME_CATEGORIES.map(({ id, label, icon }) => (
                <li key={id}>
                  <CategoryCard label={label} icon={icon} />
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="home-nearby"
            className="flex flex-col gap-(--space-12) lg:gap-(--space-16)"
          >
            <h2 id="home-nearby" className="type-heading text-(--text-strong)">
              Perto de você
            </h2>
            {nearby.status === 'no-location' && (
              <div className="flex flex-col items-start gap-(--space-12)">
                <p className="type-body text-(--text-muted)">
                  Escolha onde você quer agendar para ver os estabelecimentos perto.
                </p>
                <Button onClick={onChooseLocation} aria-haspopup="dialog">
                  <MapPin aria-hidden="true" className="size-4" />
                  Escolher localização
                </Button>
              </div>
            )}
            {nearby.status === 'loading' && (
              <p role="status" className="type-body text-(--text-muted)">
                Buscando estabelecimentos…
              </p>
            )}
            {nearby.status === 'error' && (
              <div role="alert" className="flex flex-col items-start gap-(--space-8)">
                <p className="type-body text-(--text-muted)">{nearby.message}</p>
                {nearby.onRetry && (
                  <Button variant="secondary" onClick={nearby.onRetry}>
                    Tentar de novo
                  </Button>
                )}
              </div>
            )}
            {nearby.status === 'ready' && nearby.items.length === 0 && (
              <p className="type-body text-(--text-muted)">
                Nenhum estabelecimento perto de {locationLabel} ainda.
              </p>
            )}
            {nearby.status === 'ready' && nearby.items.length > 0 && (
              <ul className="flex flex-col gap-(--space-12) md:grid md:grid-cols-2 lg:grid-cols-3 lg:gap-(--space-16)">
                {nearby.items.map(({ id, ...establishment }) => (
                  <li key={id}>
                    <CardEstablishment
                      {...establishment}
                      onClick={() => navigate(businessPath(id))}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </PageContainer>

      <BottomNavigation
        activeItem="search"
        onNavigate={(item) => {
          const path = NAVIGATION_PATHS[item]
          if (path) navigate(path)
        }}
      />
    </div>
  )
}
