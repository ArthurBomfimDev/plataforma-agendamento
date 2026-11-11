import type { PwaNoticesViewProps } from './types'
import { Button } from '@components/button'
import type { ReactNode } from 'react'

const TONES = {
  neutral: 'border-(--border-interactive) bg-(--bg-surface)',
  pending: 'border-(--status-pending-fg) bg-(--status-pending-bg)',
} as const

/**
 * Avisos do app instalável (ADR-035): sem conexão, nova versão e instalar. Ficam no topo, acima da tela, e respeitam a
 * área segura (regra 6 de empacotamento). Cada botão tem 44 px de altura. Sem aviso, não desenha nada.
 */
export const PwaNoticesView = (props: PwaNoticesViewProps) => {
  const { offline, updateAvailable, installPrompt } = props
  if (!offline && !updateAvailable && installPrompt === null) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-60 flex flex-col gap-(--space-8) px-(--space-12) pt-[calc(env(safe-area-inset-top)+var(--space-8))]">
      {offline ? (
        <Notice tone="pending" title="Você está sem conexão">
          <p className="type-body">
            Você ainda pode abrir o Vagoo, mas buscar, agendar e ver a agenda precisam de internet.
            Tudo volta quando a conexão voltar.
          </p>
        </Notice>
      ) : null}

      {updateAvailable ? (
        <Notice tone="neutral" title="Nova versão disponível">
          <p className="type-body">
            Atualize para usar a versão mais recente. Termine o que estiver fazendo antes.
          </p>
          <div className="flex flex-wrap gap-(--space-8)">
            <Button className="min-h-11" onClick={props.onUpdate}>
              Atualizar agora
            </Button>
            <Button className="min-h-11" variant="ghost" onClick={props.onDismissUpdate}>
              Depois
            </Button>
          </div>
        </Notice>
      ) : null}

      {installPrompt === 'promptable' ? (
        <Notice tone="neutral" title="Instale o Vagoo">
          <p className="type-body">
            Tenha o Vagoo na tela inicial do celular, abrindo sem a barra do navegador.
          </p>
          <div className="flex flex-wrap gap-(--space-8)">
            <Button className="min-h-11" onClick={props.onInstall}>
              Instalar
            </Button>
            <Button className="min-h-11" variant="ghost" onClick={props.onDismissInstall}>
              Agora não
            </Button>
          </div>
        </Notice>
      ) : null}

      {installPrompt === 'ios-manual' ? (
        <Notice tone="neutral" title="Instale o Vagoo">
          <p className="type-body">
            No iPhone, toque em <strong>Compartilhar</strong> e depois em{' '}
            <strong>Adicionar à Tela de Início</strong>.
          </p>
          <div className="flex flex-wrap gap-(--space-8)">
            <Button className="min-h-11" variant="secondary" onClick={props.onDismissInstall}>
              Entendi
            </Button>
          </div>
        </Notice>
      ) : null}
    </div>
  )
}

const Notice = ({
  tone,
  title,
  children,
}: {
  tone: keyof typeof TONES
  title: string
  children: ReactNode
}) => (
  <section
    role="status"
    aria-label={title}
    className={`pointer-events-auto flex flex-col gap-(--space-8) rounded-(--radius-md) border-2 p-(--space-12) text-(--text-body) shadow-lg ${TONES[tone]}`}
  >
    <h2 className="type-label font-semibold text-(--text-strong)">{title}</h2>
    {children}
  </section>
)
