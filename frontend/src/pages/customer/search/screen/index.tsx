import { MAX_SEARCH_RADIUS_KM, distanceChipLabel } from '@api/services/business/search'
import {
  CATEGORY_LABELS,
  PRICE_CEILINGS,
  areaLabel,
  emptyAction,
  hasNarrowingFilters,
  priceCeilingLabel,
  resultsCount,
} from './consts'
import { ChevronLeftIcon, CloseIcon, LocationIcon } from '@assets/icons'
import { useState } from 'react'

import { Button } from '@components/button'
import { CardEstablishment } from '@components/card-establishment'
import { FilterChip } from '@components/filter-chip'
import { SearchButton } from '@components/search-button'
import { SearchField } from '@components/search-field'
import { SearchResultCard } from '@components/search-result-card'
import type { SearchResultsScreenProps } from './types'
import { locationReference } from '@components/top-bar/consts'

/**
 * Tela 02 · Resultados da busca (Figma, 390px), ligada à API na Onda 6C. Só os filtros que o backend suporta:
 * categoria, termo, distância (Cidade ou 1 a 20 km, Onda 7C), preço máximo e ordenação. "Disponível hoje" e "★ 4,5+" saíram (trabalho futuro no
 * contrato §4.4). Os filtros aplicados aparecem como chips que se removem.
 */
export const SearchResultsScreen = (props: SearchResultsScreenProps) => {
  const {
    filters,
    results,
    searching,
    locationLabel,
    cityName,
    onChange,
    onBack,
    onOpen,
    onChooseLocation,
  } = props
  const [term, setTerm] = useState(filters.term ?? '')
  const [urlTerm, setUrlTerm] = useState(filters.term)

  // O termo da URL manda: voltar no histórico ou remover o filtro troca o campo. Ajustado na renderização,
  // não num efeito, para não pintar a tela duas vezes.
  if (filters.term !== urlTerm) {
    setUrlTerm(filters.term)
    setTerm(filters.term ?? '')
  }

  const applied = [
    filters.category && {
      key: 'category',
      label: CATEGORY_LABELS[filters.category],
      remove: () => onChange?.({ category: null }),
    },
    filters.term && {
      key: 'term',
      label: `“${filters.term}”`,
      remove: () => onChange?.({ term: null }),
    },
  ].filter((chip): chip is { key: string; label: string; remove: () => void } => Boolean(chip))

  return (
    <div className="min-h-dvh bg-(--bg-page)">
      <header className="flex flex-col gap-(--space-12) border-b border-(--border-subtle) bg-(--bg-surface) px-(--space-16) pt-[calc(var(--space-16)+env(safe-area-inset-top))] pb-(--space-12) lg:px-(--space-40)">
        <div className="mx-auto flex w-full max-w-360 flex-col gap-(--space-12)">
          <div className="flex items-center gap-(--space-12)">
            <button
              type="button"
              aria-label="Voltar"
              onClick={onBack}
              className="flex size-(--size-touch-min) shrink-0 items-center justify-center rounded-md text-(--text-strong) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
            >
              <ChevronLeftIcon aria-hidden="true" className="size-6" />
            </button>
            <form
              role="search"
              className="min-w-0 flex-1"
              onSubmit={(event) => {
                event.preventDefault()
                onChange?.({ term: term.trim() || null })
              }}
            >
              <SearchField
                label="Buscar"
                name="term"
                enterKeyHint="search"
                placeholder="Buscar serviço ou estabelecimento"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                className="py-(--space-4) pr-(--space-4)"
                action={<SearchButton loading={searching} />}
              />
            </form>
          </div>

          <button
            type="button"
            aria-haspopup="dialog"
            onClick={onChooseLocation}
            className="type-caption -my-(--space-8) flex min-h-(--size-touch-min) items-center gap-(--space-4) self-start rounded-md text-(--text-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
          >
            <LocationIcon aria-hidden="true" className="size-4 shrink-0" />
            <span>{locationReference(locationLabel)}</span>
            {locationLabel && <span className="sr-only">, trocar localização</span>}
          </button>

          {applied.length > 0 && (
            <ul aria-label="Filtros aplicados" className="flex flex-wrap gap-(--space-8)">
              {applied.map((chip) => (
                <li key={chip.key}>
                  <FilterChip
                    selected
                    onClick={chip.remove}
                    aria-label={`Remover filtro ${chip.label}`}
                  >
                    {chip.label}
                    <CloseIcon aria-hidden="true" className="size-4" />
                  </FilterChip>
                </li>
              ))}
            </ul>
          )}

          {filters.distance === 'city' && !cityName && locationLabel && (
            <p className="type-caption text-(--text-muted)">
              Não sabemos a cidade desta localização: mostrando a até {MAX_SEARCH_RADIUS_KM} km.
              Escolha a localização de novo para buscar só na cidade.
            </p>
          )}

          <div
            role="group"
            aria-label="Filtros"
            className="-mx-(--space-16) flex gap-(--space-8) overflow-x-auto px-(--space-16) lg:mx-0 lg:flex-wrap lg:px-0"
          >
            {/* A distância mora no seletor de endereço (7CF): aqui, só mostra e reabre o seletor. */}
            {locationLabel && (
              <FilterChip
                selected
                aria-haspopup="dialog"
                aria-label={`Distância: ${distanceChipLabel(filters.distance, cityName)}. Trocar no seletor de endereço`}
                onClick={onChooseLocation}
              >
                <LocationIcon aria-hidden="true" className="size-4" />
                {distanceChipLabel(filters.distance, cityName)}
              </FilterChip>
            )}
            {PRICE_CEILINGS.map((cents) => (
              <FilterChip
                key={cents}
                selected={filters.maxPriceCents === cents}
                onClick={() =>
                  onChange?.({ maxPriceCents: filters.maxPriceCents === cents ? null : cents })
                }
              >
                {priceCeilingLabel(cents)}
              </FilterChip>
            ))}
          </div>

          <div role="group" aria-label="Ordenar por" className="flex gap-(--space-8)">
            <FilterChip
              selected={filters.sortBy === 'distance'}
              onClick={() => onChange?.({ sortBy: 'distance' })}
            >
              Mais perto
            </FilterChip>
            <FilterChip
              selected={filters.sortBy === 'price'}
              onClick={() => onChange?.({ sortBy: 'price' })}
            >
              Menor preço
            </FilterChip>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-360 flex-col gap-(--space-12) p-(--space-16) pb-[calc(var(--space-16)+env(safe-area-inset-bottom))] lg:px-(--space-40)">
        <h1 className="sr-only">Resultados da busca</h1>

        {results.status === 'no-location' && (
          <div className="flex flex-col items-start gap-(--space-12)">
            <p className="type-body text-(--text-muted)">
              Escolha onde você quer agendar para ver os resultados perto.
            </p>
            <Button onClick={onChooseLocation} aria-haspopup="dialog">
              <LocationIcon aria-hidden="true" className="size-4" />
              Escolher localização
            </Button>
          </div>
        )}

        {results.status === 'loading' && (
          <p role="status" className="type-body text-(--text-muted)">
            Buscando…
          </p>
        )}

        {results.status === 'error' && (
          <div role="alert" className="flex flex-col items-start gap-(--space-8)">
            <p className="type-body text-(--text-muted)">{results.message}</p>
            {results.onRetry && (
              <Button variant="secondary" onClick={results.onRetry}>
                Tentar de novo
              </Button>
            )}
          </div>
        )}

        {results.status === 'ready' && (
          <>
            <p aria-live="polite" className="type-caption tabular text-(--text-muted)">
              {resultsCount(results.total)}
            </p>
            {results.items.length === 0 ? (
              <div className="flex flex-col items-start gap-(--space-12)">
                <p className="type-body text-(--text-muted)">
                  Nenhum estabelecimento {areaLabel(filters.distance, cityName)}
                  {hasNarrowingFilters(filters) ? ' com esses filtros' : ''}.
                </p>
                {emptyAction(filters) === 'widen' ? (
                  <Button onClick={() => onChange?.({ distance: MAX_SEARCH_RADIUS_KM })}>
                    Ampliar para {MAX_SEARCH_RADIUS_KM} km
                  </Button>
                ) : emptyAction(filters) === 'clear' ? (
                  <Button
                    variant="secondary"
                    onClick={() => onChange?.({ term: null, category: null, maxPriceCents: null })}
                  >
                    Limpar filtros
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={onChooseLocation} aria-haspopup="dialog">
                    <LocationIcon aria-hidden="true" className="size-4" />
                    Trocar localização
                  </Button>
                )}
              </div>
            ) : (
              <ul className="flex flex-col gap-(--space-12) md:grid md:grid-cols-2 lg:grid-cols-3">
                {results.items.map((item) => (
                  <li key={item.id}>
                    {item.service ? (
                      <SearchResultCard
                        name={item.name}
                        serviceName={item.service.name}
                        durationMinutes={item.service.durationMinutes}
                        priceCents={item.service.fromPriceCents}
                        priceFrom
                        image={item.image}
                        category={item.category}
                        distanceKm={item.distanceKm}
                        onOpen={() => onOpen?.(item.id)}
                      />
                    ) : (
                      <CardEstablishment
                        name={item.name}
                        distanceKm={item.distanceKm}
                        neighborhood={item.neighborhood}
                        verified={item.verified}
                        image={item.cover}
                        category={item.category}
                        onClick={() => onOpen?.(item.id)}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  )
}
