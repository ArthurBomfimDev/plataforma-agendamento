import {
  SERVICES_ALERT,
  alertMessage,
  byActiveThenName,
  subtitleOf,
  withoutProfessional,
} from './consts'
import { ErrorState, LoadingState } from '@components/screen-state'
import { PANEL_NOTICE, PanelPage } from '@components/panel-page'

import { Button } from '@components/button'
import { EmptyServices } from './components/empty-services'
import { ServiceCards } from './components/service-cards'
import type { ServicesScreenProps } from './types'
import { ServicesTable } from './components/services-table'
import { VerifiedUserIcon } from '@assets/icons'

/**
 * Painel — Serviços (Onda 7D): o catálogo do estabelecimento. Criar, editar, pausar e reativar abrem o
 * cadastro do Rafael (tela 11): a situação do serviço é um campo da edição. Só o dono chega aqui (guard em
 * `panel-layout`).
 *
 * A categoria é do estabelecimento, não do serviço (ADR-015): em Saúde, o aviso lembra que nome e
 * descrição vão para a vitrine pública.
 */
export const ServicesScreen = (props: ServicesScreenProps) => {
  const { data, businessName, categoryName, sensitive, guidedStep, onNew, onEdit } = props

  const services = data.status === 'ready' ? data.services.toSorted(byActiveThenName) : []
  const withoutOne = withoutProfessional(services)
  const unassigned = withoutOne.map(({ name }) => name)
  // O passo guiado aponta o primeiro serviço ativo sem profissional; sem nenhum, não há o que destacar.
  const target = withoutOne[0]
  const guide =
    guidedStep && target
      ? { serviceId: target.id, serviceName: target.name, step: guidedStep }
      : undefined
  // Sem serviço, o botão do cabeçalho some: o convite está no estado vazio (Figma 18b).
  const empty = data.status === 'ready' && services.length === 0

  return (
    <PanelPage
      wide
      title="Serviços"
      subtitle={
        empty
          ? [businessName, categoryName].filter(Boolean).join(' · ')
          : data.status === 'ready'
            ? subtitleOf(services, businessName)
            : businessName
      }
      actions={
        empty ? undefined : (
          <Button className="shrink-0" onClick={onNew}>
            Novo serviço
          </Button>
        )
      }
    >
      {sensitive && (
        <p className={PANEL_NOTICE}>
          <VerifiedUserIcon aria-hidden="true" className="mt-(--space-2) size-4 shrink-0" />
          Estabelecimento de saúde: nome e descrição do serviço aparecem na vitrine pública. Não
          coloque neles nada sobre um paciente.
        </p>
      )}

      {/* No passo guiado a barra do próprio serviço já diz isso (Figma 21b): o aviso do topo repetiria. */}
      {unassigned.length > 0 && !guide && (
        <p role="status" className={SERVICES_ALERT}>
          {alertMessage(unassigned)}
        </p>
      )}

      {data.status === 'loading' ? (
        <LoadingState label="Carregando os serviços…" />
      ) : data.status === 'error' ? (
        <ErrorState message={data.message} onRetry={data.onRetry} />
      ) : services.length === 0 ? (
        <EmptyServices onNew={onNew} />
      ) : (
        <>
          <div className="lg:hidden">
            <ServiceCards services={services} onEdit={onEdit} guide={guide} />
          </div>
          <div className="hidden lg:block">
            <ServicesTable services={services} onEdit={onEdit} guide={guide} />
          </div>
          <p className="type-caption text-(--text-muted)">
            Pausar tira o serviço da vitrine sem apagar o histórico: os agendamentos já feitos
            continuam válidos e os relatórios continuam contando. Para pausar ou reativar, abra a
            edição do serviço.
          </p>
        </>
      )}
    </PanelPage>
  )
}
