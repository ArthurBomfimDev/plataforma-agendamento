import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ErrorIcon,
  HourglassIcon,
  VerifiedUserIcon,
  WarningIcon,
} from '@assets/icons'
import { TONE_CLASSES, bannerState, hintOf, labelOf, missingItems, requiredItems } from './consts'
import { useId, useState } from 'react'

import type { BusinessStatusBannerProps } from './types'
import { Button } from '@components/button'
import type { ChecklistItemResponse } from '@api/models'
import { cn } from 'cn'

type Look = {
  tone: keyof typeof TONE_CLASSES
  Icon: typeof WarningIcon
  title: string
  subtitle: string
}

/**
 * Faixa de verificação do estabelecimento, no topo do painel do dono (Figma `Aviso de verificação`, 384:177).
 * Uma faixa persistente que expande em acordeão, formando um cartão contínuo com a lista de pendências:
 * Rascunho, Em análise, Verificado (dispensável, uma vez), Ajustes necessários (recusado) e Suspenso.
 * Cada estado tem ícone e frase próprios e nunca depende só da cor. Sem botão morto: o motivo de o envio
 * estar bloqueado fica escrito ao lado dele.
 */
export const BusinessStatusBanner = (props: BusinessStatusBannerProps) => {
  const { business, checklist, error } = props
  const state = bannerState(business)
  const [open, setOpen] = useState(false)
  const panelId = useId()

  if (state === 'active' && !props.showApproved) return null

  const items = checklist ? requiredItems(checklist) : []
  const missing = checklist ? missingItems(checklist) : []
  const total = items.length
  const done = total - missing.length
  const complete = checklist !== undefined && total > 0 && missing.length === 0
  const health = business.category === 'Saude'
  const submitLabel = health
    ? state === 'rejected'
      ? 'Reenviar para análise'
      : 'Enviar para análise'
    : 'Publicar meu estabelecimento'

  const look = lookOf(state, { missing: missing.length, complete, reason: business.reason, props })
  const tone = TONE_CLASSES[look.tone]
  const expandable = state === 'draft' || state === 'review' || state === 'rejected'
  const showProgress = expandable && checklist !== undefined
  const firstPending = missing[0]?.key
  // O botão da faixa some com o painel aberto: a ação passa a morar no rodapé, e dois botões iguais confundem.
  const stripAction = expandable && !open

  return (
    <section
      aria-label="Verificação do estabelecimento"
      className="px-(--space-16) pt-(--space-16) lg:px-(--space-24) lg:pt-(--space-24)"
    >
      <div
        role="status"
        aria-live="polite"
        className={cn('flex items-stretch rounded-md', tone.surface, open && 'rounded-b-none')}
      >
        <span aria-hidden="true" className={cn('w-[3px] shrink-0', tone.accent)} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-(--space-12) gap-y-(--space-8) px-(--space-16) py-(--space-12)">
          <look.Icon aria-hidden="true" className={cn('size-5 shrink-0', tone.text)} />
          <div className="min-w-48 flex-1">
            <p className={cn('type-label', tone.text)}>{look.title}</p>
            <p className="type-caption text-(--text-body)">{look.subtitle}</p>
          </div>

          {showProgress && (
            <div className="flex flex-col gap-1.5">
              <p className="type-caption whitespace-nowrap text-(--text-body)">
                {done} de {total} concluídos
              </p>
              <div
                role="group"
                aria-label={`${done} de ${total} concluídos`}
                className="flex gap-1"
              >
                {items.map((item, index) => (
                  <span
                    key={item.key}
                    aria-hidden="true"
                    data-segment={index < done ? 'done' : 'pending'}
                    className={cn(
                      'h-1.5 w-[26px] rounded-full',
                      index < done
                        ? tone.segment
                        : cn('border bg-(--bg-surface)', tone.segmentOutline),
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {state === 'active' && (
            <Button variant="ghost" onClick={props.onDismissApproved}>
              Dispensar
            </Button>
          )}

          {stripAction && state === 'draft' && checklist !== undefined && (
            <Button onClick={() => (firstPending ? props.onFix(firstPending) : setOpen(true))}>
              {complete ? 'Revisar e enviar' : 'Continuar verificação'}
            </Button>
          )}
          {stripAction && state === 'rejected' && (
            <Button onClick={() => setOpen(true)}>Corrigir e reenviar</Button>
          )}

          {expandable && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={
                open ? 'Recolher a lista de verificação' : 'Expandir a lista de verificação'
              }
              onClick={() => setOpen((value) => !value)}
              className={cn(
                'flex size-(--size-touch-min) shrink-0 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-focus)',
                tone.text,
              )}
            >
              {open ? (
                <ChevronUpIcon aria-hidden="true" className="size-5" />
              ) : (
                <ChevronDownIcon aria-hidden="true" className="size-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="type-label px-(--space-16) pt-(--space-8) text-(--status-rejected-fg)"
        >
          {error}
        </p>
      )}

      {expandable && (
        <div
          id={panelId}
          hidden={!open}
          className="overflow-hidden rounded-b-md border border-t-0 border-(--border-subtle) bg-(--bg-surface)"
        >
          {open && (
            <Panel
              {...props}
              state={state}
              items={items}
              missing={missing}
              complete={complete}
              total={total}
              submitLabel={submitLabel}
              health={health}
            />
          )}
        </div>
      )}
    </section>
  )
}

const lookOf = (
  state: ReturnType<typeof bannerState>,
  context: {
    missing: number
    complete: boolean
    reason: string | null
    props: BusinessStatusBannerProps
  },
): Look => {
  switch (state) {
    case 'review':
      return {
        tone: 'info',
        Icon: HourglassIcon,
        title: 'Em análise · ainda não aparece na busca',
        subtitle:
          'Resposta em até 2 dias úteis — nada a fazer agora. Você já pode configurar o resto.',
      }
    case 'active':
      return {
        tone: 'confirmed',
        Icon: VerifiedUserIcon,
        title: 'Verificado · o estabelecimento aparece na busca',
        subtitle: 'Este aviso pode ser dispensado.',
      }
    case 'rejected':
      return {
        tone: 'rejected',
        Icon: ErrorIcon,
        title: 'Ajustes necessários · não aparece na busca',
        subtitle: context.reason ?? 'Abra para ver o que corrigir antes de reenviar.',
      }
    case 'suspended':
      return {
        tone: 'rejected',
        Icon: ErrorIcon,
        title: 'Suspenso · não aparece na busca',
        subtitle: context.reason
          ? `${context.reason} Se foi engano, fale com o suporte da plataforma.`
          : 'Se você acha que foi engano, fale com o suporte da plataforma.',
      }
    default: {
      const { props, missing, complete } = context
      const subtitle = props.checklistError
        ? props.checklistError
        : props.checklist === undefined
          ? 'Conferindo o que falta…'
          : complete
            ? 'Tudo pronto. Falta só enviar para o estabelecimento aparecer na busca.'
            : `${missing === 1 ? 'Falta 1 item obrigatório' : `Faltam ${missing} itens obrigatórios`}. Nenhum consumidor consegue encontrar ou agendar.`
      return {
        tone: 'pending',
        Icon: WarningIcon,
        title: 'Rascunho · o estabelecimento não aparece na busca',
        subtitle,
      }
    }
  }
}

type PanelProps = BusinessStatusBannerProps & {
  state: ReturnType<typeof bannerState>
  items: ChecklistItemResponse[]
  missing: ChecklistItemResponse[]
  complete: boolean
  total: number
  submitLabel: string
  health: boolean
}

const Panel = (props: PanelProps) => {
  const { state, items, missing, complete, total, submitLabel, busy, business } = props
  const rejected = state === 'rejected'
  const review = state === 'review'
  // Recusado mostra o motivo e só o que ainda falta; os itens concluídos continuam concluídos.
  const rows = rejected ? missing : items

  return (
    <>
      {rejected && (
        <div className="flex flex-col gap-(--space-8) border-b border-(--border-subtle) px-(--space-16) py-(--space-12)">
          <p className="type-caption font-semibold tracking-wide text-(--status-rejected-fg) uppercase">
            Motivo da recusa
          </p>
          <p className="type-body text-(--text-strong)">
            {business.reason ?? 'O motivo não foi registrado — fale com o suporte.'}
          </p>
        </div>
      )}

      {props.checklistError ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-(--space-8) px-(--space-16) py-(--space-12)"
        >
          <p className="type-label">{props.checklistError}</p>
          <Button variant="secondary" onClick={props.onRetryChecklist}>
            Tentar de novo
          </Button>
        </div>
      ) : (
        <ul aria-label="Itens da verificação">
          {rows.map((item, index) => (
            <li
              key={item.key}
              className={cn(
                'flex flex-wrap items-center gap-(--space-12) px-(--space-16) py-(--space-12)',
                index > 0 && 'border-t border-(--border-subtle)',
                rejected && 'border-l-[3px] border-l-(--status-rejected-fg)',
              )}
            >
              {item.done ? (
                <span
                  aria-hidden="true"
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--status-confirmed-bg) text-(--status-confirmed-fg)"
                >
                  <CheckIcon className="size-5" />
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="size-6 shrink-0 rounded-full border-2 border-(--border-interactive)"
                />
              )}
              <div className="min-w-48 flex-1">
                <p
                  className={cn(
                    'type-body',
                    item.done ? 'text-(--text-muted)' : 'text-(--text-strong)',
                  )}
                >
                  {labelOf(item.key)}
                  <span className="sr-only">{item.done ? ' (feito)' : ' (falta)'}</span>
                </p>
                {!item.done && hintOf(item.key) && (
                  <p className="type-caption text-(--text-muted)">{hintOf(item.key)}</p>
                )}
              </div>
              {item.done ? (
                <span className="type-label whitespace-nowrap text-(--status-confirmed-fg)">
                  Concluído
                </span>
              ) : (
                <Button variant="secondary" onClick={() => props.onFix(item.key)}>
                  Resolver
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-(--space-12) border-t border-(--border-subtle) bg-(--bg-surface-raised) px-(--space-16) py-(--space-12)">
        <p className="type-caption min-w-48 flex-1 text-(--text-muted)">
          {rejected
            ? 'Os outros itens continuam concluídos — reenviar não refaz a lista. A nova análise leva até 2 dias úteis e o estabelecimento segue fora da busca nesse período.'
            : review
              ? 'Os dados estão com um administrador. Aparecer na busca e receber pedidos continua bloqueado até a decisão.'
              : complete
                ? props.health
                  ? 'Tudo certo. A análise leva até 2 dias úteis.'
                  : 'Tudo certo. Ao publicar, o estabelecimento passa a aparecer na busca.'
                : `O envio libera quando os ${total} itens estiverem concluídos.${props.health ? ' A análise leva até 2 dias úteis.' : ''}`}
        </p>
        {!review && (
          <Button
            disabled={!complete || busy}
            onClick={props.health ? props.onSubmit : props.onPublish}
            className="disabled:bg-(--bg-disabled) disabled:text-(--text-disabled) disabled:opacity-100"
          >
            {busy ? 'Enviando…' : submitLabel}
          </Button>
        )}
      </div>
    </>
  )
}
