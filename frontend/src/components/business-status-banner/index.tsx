import { bannerState, labelOf, missingItems, requiredItems } from './consts'

import type { BusinessStatusBannerProps } from './types'
import { Button } from '@components/button'

/**
 * Faixa de status do estabelecimento, no topo do painel do dono (ondas finais, Fase 3): Rascunho (o que falta),
 * Em análise (o que já pode e o que está bloqueado), Reprovado (motivo; corrigir e reenviar), Suspenso (motivo) e, uma
 * vez, Aprovado. Sem botão morto: com itens faltando só há os atalhos de cada item; o botão de publicar ou enviar
 * aparece quando a checklist está completa, e diz "Publicar meu estabelecimento" (Beleza) ou "Enviar para análise" (Saúde).
 *
 * TODO(figma): não há wireframe da faixa; segue os tokens de status do design system.
 */
export const BusinessStatusBanner = (props: BusinessStatusBannerProps) => {
  const { business, checklist, busy, error, showApproved } = props
  const state = bannerState(business)

  if (state === 'active') {
    return showApproved ? (
      <Banner tone="confirmed" title="Aprovado">
        <p className="type-body">
          Seu estabelecimento foi aprovado e já aparece na busca. Bom trabalho!
        </p>
        <Button variant="secondary" onClick={props.onDismissApproved}>
          Entendi
        </Button>
      </Banner>
    ) : null
  }

  if (state === 'review') {
    return (
      <Banner tone="pending" title="Em análise">
        <p className="type-body">
          Um administrador está conferindo os dados. Você já pode configurar serviços, equipe,
          jornadas, fotos e a política de agendamento.
        </p>
        <p className="type-body font-semibold">
          Ainda bloqueado: aparecer na busca e receber pedidos.
        </p>
      </Banner>
    )
  }

  if (state === 'suspended') {
    return (
      <Banner tone="rejected" title="Suspenso">
        <p className="type-body">
          Seu estabelecimento deixou de aparecer na plataforma e de receber pedidos.
        </p>
        {business.reason && <p className="type-body">Motivo: {business.reason}</p>}
        <p className="type-caption">
          Se você acha que foi um engano, fale com o suporte da plataforma.
        </p>
      </Banner>
    )
  }

  // Rascunho ou reprovado: o que falta e, completa a checklist, o botão de seguir.
  const rejected = state === 'rejected'
  const missing = checklist ? missingItems(checklist) : []
  const complete =
    checklist !== undefined && missing.length === 0 && requiredItems(checklist).length > 0
  const health = business.category === 'Saude'

  return (
    <Banner tone={rejected ? 'rejected' : 'pending'} title={rejected ? 'Reprovado' : 'Rascunho'}>
      {rejected ? (
        <>
          <p className="type-body">O cadastro não foi aprovado.</p>
          {business.reason && <p className="type-body">Motivo: {business.reason}</p>}
          <p className="type-body">Corrija o que foi apontado e envie de novo.</p>
        </>
      ) : (
        <p className="type-body">
          Seu estabelecimento ainda não aparece na busca. Complete a lista abaixo.
        </p>
      )}

      {props.checklistError ? (
        <div role="alert" className="flex flex-col gap-(--space-8)">
          <p className="type-label">{props.checklistError}</p>
          <Button variant="secondary" onClick={props.onRetryChecklist}>
            Tentar de novo
          </Button>
        </div>
      ) : checklist === undefined ? (
        <p role="status" className="type-caption">
          Conferindo o que falta…
        </p>
      ) : (
        <ul aria-label="O que falta" className="flex flex-col gap-(--space-4)">
          {requiredItems(checklist).map((item) => (
            <li
              key={item.key}
              className="flex min-h-(--size-touch-min) items-center gap-(--space-8)"
            >
              <span aria-hidden="true">{item.done ? '✓' : '○'}</span>
              <span className="min-w-0 flex-1">
                {labelOf(item.key)}
                <span className="sr-only">{item.done ? ' (feito)' : ' (falta)'}</span>
              </span>
              {!item.done && (
                <Button variant="ghost" onClick={() => props.onFix(item.key)}>
                  Resolver
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="type-label text-(--status-rejected-fg)">
          {error}
        </p>
      )}

      {complete && (
        <Button
          size="lg"
          className="w-full"
          disabled={busy}
          onClick={health ? props.onSubmit : props.onPublish}
        >
          {busy
            ? 'Enviando…'
            : health
              ? rejected
                ? 'Reenviar para análise'
                : 'Enviar para análise'
              : 'Publicar meu estabelecimento'}
        </Button>
      )}
    </Banner>
  )
}

const TONES = {
  pending: 'border-(--status-pending-fg) bg-(--status-pending-bg)',
  rejected: 'border-(--status-rejected-fg) bg-(--status-rejected-bg)',
  confirmed: 'border-(--status-confirmed-fg) bg-(--status-confirmed-bg)',
} as const

const Banner = ({
  tone,
  title,
  children,
}: {
  tone: keyof typeof TONES
  title: string
  children: React.ReactNode
}) => (
  <section
    aria-label={`Status do estabelecimento: ${title}`}
    className={`flex flex-col gap-(--space-8) border-b-2 px-(--space-16) py-(--space-12) text-(--text-body) lg:px-(--space-24) ${TONES[tone]}`}
  >
    <h2 className="type-label font-semibold text-(--text-strong)">{title}</h2>
    {children}
  </section>
)
