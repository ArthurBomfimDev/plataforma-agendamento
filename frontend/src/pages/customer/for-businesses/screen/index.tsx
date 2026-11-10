import { Button } from '@components/button'
import type { ForBusinessesScreenProps } from './types'
import { PageContainer } from '@components/page-container'

const LINK_CLASSES =
  'type-label -my-(--space-12) min-w-(--size-touch-min) py-(--space-12) text-(--text-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)'

const AUDIENCE = [
  'Salões, barbearias e estúdios de beleza.',
  'Clínicas e consultórios de saúde.',
  'Profissionais que atendem por conta própria.',
]

const STEPS = [
  'Crie a sua conta e confirme o e-mail.',
  'Cadastre o estabelecimento: nome, documento e endereço.',
  'Em beleza, ele aparece na busca na hora. Em saúde, passa por uma análise antes.',
  'No painel, cadastre serviços, profissionais e horários, e responda aos pedidos.',
]

/**
 * "Para estabelecimentos" (ADR-034): a página pública que explica para quem é e leva ao cadastro. Quem não tem conta
 * começa pelo passo "Sua conta" do assistente; quem tem, entra e segue direto.
 */
export const ForBusinessesScreen = (props: ForBusinessesScreenProps) => {
  const { signedIn = false, onRegister, onSignIn } = props

  return (
    <div className="min-h-dvh bg-(--bg-page)">
      <PageContainer>
        <main className="flex flex-col gap-(--space-24) px-(--space-16) py-(--space-24) pb-[calc(var(--space-24)+env(safe-area-inset-bottom))] lg:mx-auto lg:max-w-160 lg:px-0 lg:py-(--space-40)">
          <header className="flex flex-col gap-(--space-8)">
            <h1 className="type-title text-(--text-strong) lg:text-(length:--size-display)! lg:leading-(--line-height-display)!">
              Para estabelecimentos
            </h1>
            <p className="type-body-lg text-(--text-muted)">
              Receba pedidos de agendamento pela Vagoo e organize a agenda do dia, no celular ou no
              computador. O consumidor escolhe o horário livre; você confirma.
            </p>
          </header>

          <section aria-labelledby="business-audience" className="flex flex-col gap-(--space-8)">
            <h2 id="business-audience" className="type-heading text-(--text-strong)">
              Para quem é
            </h2>
            <ul className="type-body flex list-disc flex-col gap-(--space-4) pl-(--space-20) text-(--text-body)">
              {AUDIENCE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="business-steps" className="flex flex-col gap-(--space-8)">
            <h2 id="business-steps" className="type-heading text-(--text-strong)">
              Como funciona
            </h2>
            <ol className="type-body flex list-decimal flex-col gap-(--space-4) pl-(--space-20) text-(--text-body)">
              {STEPS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>

          <p className="type-caption text-(--text-muted)">
            Você usa a mesma conta para agendar como consumidor e para cuidar do seu
            estabelecimento.
          </p>

          <div className="flex flex-col gap-(--space-12)">
            <Button size="lg" className="w-full lg:w-auto lg:self-start" onClick={onRegister}>
              Cadastrar meu estabelecimento
            </Button>
            {!signedIn && (
              <p className="type-label flex gap-(--space-4) text-(--text-muted)">
                Já tenho conta:
                <button type="button" onClick={onSignIn} className={LINK_CLASSES}>
                  entrar
                </button>
              </p>
            )}
          </div>
        </main>
      </PageContainer>
    </div>
  )
}
