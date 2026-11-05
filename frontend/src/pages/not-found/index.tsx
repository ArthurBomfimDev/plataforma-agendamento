import { Button } from '@components/button'
import { Logotype } from '@components/logotype'
import { ROUTES } from '@router/paths'
import { SearchIcon } from '@assets/icons'
import { useLocation, useNavigate } from 'react-router'

/**
 * Página 404: endereço que não casa com nenhuma rota, ou recurso que não existe mais. Não existe wireframe no Figma;
 * segue a moldura das telas de conta (logotipo, título, texto, ações) e os tokens do tema.
 */
export const NotFoundScreen = () => {
  const navigate = useNavigate()
  // Aberta direto por um link, a primeira entrada tem a chave `default`: "Voltar" sairia do app.
  const canGoBack = useLocation().key !== 'default'

  return (
    <main className="flex min-h-dvh items-center justify-center bg-(--bg-page) px-(--space-16) pt-[calc(var(--space-24)+env(safe-area-inset-top))] pb-[calc(var(--space-24)+env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md flex-col items-center gap-(--space-16) text-center">
        <Logotype tone="auto" className="h-10" alt="vagoo" />

        <span
          aria-hidden="true"
          className="flex size-16 items-center justify-center rounded-(--radius-full) bg-(--action-soft) text-(--text-link)"
        >
          <SearchIcon className="size-8" />
        </span>

        <div className="flex flex-col gap-(--space-8)">
          <p className="type-caption text-(--text-muted)">Erro 404</p>
          <h1 className="type-title text-(--text-strong)">Página não encontrada</h1>
          <p className="type-body text-(--text-muted)">
            O endereço pode estar errado ou a página não existe mais.
          </p>
        </div>

        <div className="flex w-full flex-col gap-(--space-8) sm:flex-row sm:justify-center">
          <Button size="lg" className="sm:w-auto" onClick={() => navigate(ROUTES.home)}>
            Ir para o início
          </Button>
          {canGoBack && (
            <Button
              variant="secondary"
              size="lg"
              className="sm:w-auto"
              onClick={() => navigate(-1)}
            >
              Voltar
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
