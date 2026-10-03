import { Button } from '../button'
import { MOCK_LOCATION } from './consts'
import { MapPin } from 'lucide-react'
import { SearchField } from '../search-field'
import type { TopBarProps } from './types'

/**
 * Barra superior do desktop (Figma, frames 01D–08D). Só aparece a partir de 1024px; no celular a
 * navegação é a barra inferior e o cabeçalho de cada tela.
 *
 * O fundo ocupa a tela toda; o conteúdo para em 1440px + respiro (a largura do frame do Figma).
 * Em 1920px isso alinha a barra com a coluna larga das telas.
 */
export const TopBar = (props: TopBarProps) => {
  const { showSearch, onHome, onAppointments, onSignIn } = props

  return (
    <header className="hidden border-b border-(--border-subtle) bg-(--bg-surface) lg:block">
      <div className="mx-auto flex max-w-[calc(1440px+2*var(--space-40))] items-center gap-(--space-24) px-(--space-40) py-(--space-12)">
        {/* TODO(figma): marca ainda não existe; o quadrado neutro é o placeholder do wireframe. */}
        <button
          type="button"
          aria-label="Página inicial"
          onClick={onHome}
          className="size-11 shrink-0 rounded-md p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
        >
          <span aria-hidden="true" className="block size-9 rounded-md bg-(--bg-disabled)" />
        </button>

        <p className="type-label flex shrink-0 items-center gap-(--space-4) text-(--text-link)">
          <MapPin aria-hidden="true" className="size-4" />
          {MOCK_LOCATION}
        </p>

        {showSearch ? (
          <SearchField
            label="Buscar"
            placeholder="Buscar serviço, local ou profissional"
            className="min-w-0 flex-1 rounded-(--radius-full) py-(--space-8)"
          />
        ) : (
          <div className="flex-1" />
        )}

        <Button variant="ghost" className="shrink-0" onClick={onAppointments}>
          Meus agendamentos
        </Button>
        {/* TODO: autenticação ainda não existe; "Entrar" não faz nada. Logado, vira o avatar. */}
        <Button className="shrink-0" onClick={onSignIn}>
          Entrar
        </Button>
      </div>
    </header>
  )
}
