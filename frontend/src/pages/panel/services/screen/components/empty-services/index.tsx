import { Button } from '@components/button'
import type { EmptyServicesProps } from './types'

/**
 * Estado vazio do Figma 18b: o estabelecimento sem nenhum serviço. É o caso mais importante da lista,
 * porque sem serviço o estabelecimento nem aparece na busca (a plataforma confere isso antes de aprovar).
 */
export const EmptyServices = (props: EmptyServicesProps) => {
  const { onNew } = props

  return (
    <section
      aria-labelledby="empty-services-title"
      className="flex flex-col items-center gap-(--space-8) rounded-(--radius-md) border border-dashed border-(--border-subtle) bg-(--bg-surface) px-(--space-16) py-(--space-40) text-center md:px-(--space-40) md:py-14"
    >
      <h2 id="empty-services-title" role="status" className="type-body-lg text-(--text-strong)">
        Nenhum serviço cadastrado ainda
      </h2>
      <p className="type-body max-w-130 text-(--text-muted)">
        O estabelecimento só aparece na busca depois do primeiro serviço — ele é um dos itens que a
        plataforma confere antes de aprovar.
      </p>
      <Button size="lg" onClick={onNew}>
        Criar o primeiro serviço
      </Button>
      <p className="type-caption text-(--text-muted)">
        Comece pelo serviço que você mais faz. Os outros podem vir depois.
      </p>
    </section>
  )
}
