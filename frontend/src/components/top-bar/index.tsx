import { Button } from '@components/button'
import { Logotype } from '@components/logotype'
import { MapPin } from 'lucide-react'
import { locationReference } from './consts'
import { SearchButton } from '@components/search-button'
import { SearchField } from '@components/search-field'
import { useState } from 'react'
import { ThemeToggle } from '@components/theme-toggle'
import type { TopBarProps } from './types'

/**
 * Barra superior do desktop (Figma, frames 01D–08D). Só aparece a partir de 1024px; no celular a
 * navegação é a barra inferior e o cabeçalho de cada tela.
 *
 * O fundo ocupa a tela toda; o conteúdo para em 1440px + respiro (a largura do frame do Figma).
 * Em 1920px isso alinha a barra com a coluna larga das telas.
 */
export const TopBar = (props: TopBarProps) => {
  const {
    showSearch,
    onHome,
    onAppointments,
    onSignIn,
    signedIn,
    onSignOut,
    locationLabel,
    onChooseLocation,
    onSearch,
    accountMenu,
    onOpenPanel,
  } = props
  const [term, setTerm] = useState('')
  const inPanel = onOpenPanel !== undefined

  return (
    <header className="hidden border-b border-(--border-subtle) bg-(--bg-surface) lg:block">
      <div className="mx-auto flex max-w-[calc(1440px+2*var(--space-40))] items-center gap-(--space-24) px-(--space-40) py-(--space-12)">
        {/* Logotipo com 119×40 na barra (01D). A versão escura só aparece com o tema escuro ligado. */}
        <button
          type="button"
          aria-label="vagoo — página inicial"
          onClick={onHome}
          className="flex min-h-(--size-touch-min) shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
        >
          <Logotype alt="" className="dark:hidden" />
          <Logotype tone="dark" alt="" className="hidden dark:block" />
        </button>

        {!inPanel && (
          <button
            type="button"
            onClick={onChooseLocation}
            aria-haspopup="dialog"
            className="type-label flex min-h-(--size-touch-min) max-w-64 shrink-0 items-center gap-(--space-4) rounded-md px-(--space-4) text-(--text-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
          >
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{locationReference(locationLabel ?? null)}</span>
            {locationLabel && <span className="sr-only">, trocar localização</span>}
          </button>
        )}

        {showSearch && !inPanel ? (
          <form
            role="search"
            className="min-w-0 flex-1"
            onSubmit={(event) => {
              event.preventDefault()
              if (term.trim()) onSearch?.(term.trim())
            }}
          >
            <SearchField
              label="Buscar"
              name="term"
              enterKeyHint="search"
              placeholder="Buscar serviço ou estabelecimento"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              className="rounded-(--radius-full) py-(--space-4) pr-(--space-4)"
              action={<SearchButton disabled={!term.trim()} className="rounded-(--radius-full)" />}
            />
          </form>
        ) : (
          <div className="flex-1" />
        )}

        <ThemeToggle />
        {inPanel ? (
          <Button variant="ghost" className="shrink-0" onClick={onOpenPanel}>
            Voltar ao painel
          </Button>
        ) : (
          <Button variant="ghost" className="shrink-0" onClick={onAppointments}>
            Meus agendamentos
          </Button>
        )}
        {/* TODO(figma): logado, o Figma prevê o avatar com menu; o menu é o da conta, sem avatar. */}
        {signedIn ? (
          (accountMenu ?? (
            <Button variant="secondary" className="shrink-0" onClick={onSignOut}>
              Sair
            </Button>
          ))
        ) : (
          <Button className="shrink-0" onClick={onSignIn}>
            Entrar
          </Button>
        )}
      </div>
    </header>
  )
}
