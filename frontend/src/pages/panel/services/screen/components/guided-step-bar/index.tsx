import type { GuidedStepBarProps } from './types'
import { Button } from '@components/button'
import { useEffect, useRef } from 'react'

/**
 * Ação do passo guiado, logo abaixo do serviço destacado (Figma 21b, "Passo guiado · ação na página"). A faixa
 * do topo só diz em que passo o dono está; quem resolve é este botão, ao lado do serviço que ele afeta.
 */
export const GuidedStepBar = (props: GuidedStepBarProps) => {
  const { guide, onAssign } = props
  const ref = useRef<HTMLDivElement>(null)

  // Em lista longa ou no celular o serviço pode estar fora da tela: leva o passo até ela.
  useEffect(() => ref.current?.scrollIntoView?.({ block: 'center' }), [])

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Passo guiado"
      className="flex flex-wrap items-center gap-(--space-12) bg-(--action-soft) px-(--space-16) py-(--space-12)"
    >
      <div className="flex min-w-48 flex-1 flex-col gap-(--space-2)">
        <p className="type-label text-(--text-link)">
          Passo {guide.step.number} de {guide.step.total} · escolha quem executa {guide.serviceName}
        </p>
        <p className="type-caption text-(--text-body)">
          Enquanto nenhum profissional estiver habilitado, este serviço não gera horário nenhum —
          ele some da busca mesmo marcado como Ativo.
        </p>
      </div>
      <Button onClick={onAssign}>Designar profissional</Button>
    </div>
  )
}
