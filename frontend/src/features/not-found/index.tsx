import { ROUTES } from '@router/consts'
import { useNavigate } from 'react-router'

/**
 * Página 404. Não existe wireframe no Figma; o texto é provisório.
 */
export const NotFoundScreen = () => {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-dvh flex-col items-start gap-(--space-8) bg-(--bg-page) p-(--space-16) pt-[calc(var(--space-16)+env(safe-area-inset-top))]">
      <h1 className="type-heading text-(--text-strong)">Página não encontrada</h1>
      <p className="type-body text-(--text-muted)">
        O endereço pode estar errado ou a página não existe mais.
      </p>
      <button
        type="button"
        onClick={() => navigate(ROUTES.home)}
        className="type-label flex min-h-(--size-touch-min) items-center text-(--text-link) underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)"
      >
        Voltar ao início
      </button>
    </main>
  )
}
