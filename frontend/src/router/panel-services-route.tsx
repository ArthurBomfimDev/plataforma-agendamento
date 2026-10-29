import { EMPTY_SERVICE_VALUES, toFormValues } from '@features/service-form/consts'
import { ErrorState, LoadingState } from '@components/screen-state'
import { ROUTES, editServicePath } from './consts'
import type { ServiceResponse, ServiceProfessionalResponse } from '@lib/api/types'
import {
  categoryLabel,
  isSensitiveCategory,
  previewHoursOf,
  professionalChanges,
  toSaveServiceRequest,
  toServiceListItem,
  withActive,
} from './manage-adapters'
import { Button } from '@components/button'
import { errorMessage } from '@lib/api/errors'
import {
  usePanelBusinessDetail,
  usePanelMutation,
  usePanelServices,
  usePanelTeam,
} from '@lib/api/queries'
import { useNavigate, useParams } from 'react-router'

import { PanelPage } from '@components/panel-page'
import type { ServiceDraft } from '@features/service-form/types'
import { ServiceFormScreen } from '@features/service-form'
import type { ServicesData } from '@features/panel-services/types'
import { ServicesScreen } from '@features/panel-services'
import { manageApi } from '@lib/api/endpoints'
import { toast } from '@lib/toast'
import { usePanelContext } from './panel-context'
import { useState } from 'react'

/** Painel — Serviços (Onda 7D): lista, ativar e desativar. Só o dono (`RequireOwner`). */
export const PanelServicesRoute = () => {
  const { context, business } = usePanelContext()
  const navigate = useNavigate()
  const services = usePanelServices(context.businessId, true)
  const team = usePanelTeam(context.businessId)
  const detail = usePanelBusinessDetail(context.businessId)
  const update = usePanelMutation(
    context.businessId,
    ({ service, isActive }: { service: ServiceResponse; isActive: boolean }) =>
      manageApi.updateService(service.id, withActive(service, isActive)),
  )

  const data: ServicesData = services.isError
    ? {
        status: 'error',
        message: errorMessage(services.error),
        onRetry: () => void services.refetch(),
      }
    : services.data
      ? {
          status: 'ready',
          services: services.data.map((service) => toServiceListItem(service, team.data ?? [])),
        }
      : { status: 'loading' }

  return (
    <ServicesScreen
      data={data}
      businessName={business.name}
      sensitive={isSensitiveCategory(detail.data?.category ?? '')}
      onNew={() => navigate(ROUTES.panelNewService)}
      onEdit={(serviceId) => navigate(editServicePath(serviceId))}
      onToggleActive={async (item) => {
        const service = services.data?.find(({ id }) => id === item.id)
        if (!service) return false
        try {
          await update.mutateAsync({ service, isActive: !service.isActive })
          toast.success(
            service.isActive
              ? `"${service.name}" desativado. Ele saiu da vitrine.`
              : `"${service.name}" ativado. Ele voltou para a vitrine.`,
          )
          return true
        } catch (error) {
          toast.error(errorMessage(error))
          return false
        }
      }}
    />
  )
}

type SaveInput = { draft: ServiceDraft; existing: ServiceResponse | null }

/**
 * Cadastro (`/panel/services/new`) e edição (`/panel/services/:serviceId`) de serviço, com a tela 11 do
 * Rafael. Grava o serviço e depois liga e desliga os profissionais escolhidos (a API tem uma rota para
 * cada vínculo). Se o serviço novo foi criado e um vínculo falhou, a tela vai para a edição dele — salvar
 * de novo não cria um segundo serviço.
 */
export const PanelServiceFormRoute = () => {
  const { context, business, professionals, schedules, today } = usePanelContext()
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const services = usePanelServices(context.businessId, true)
  const team = usePanelTeam(context.businessId)
  const detail = usePanelBusinessDetail(context.businessId)
  const [error, setError] = useState<string>()

  const save = usePanelMutation(context.businessId, async ({ draft, existing }: SaveInput) => {
    const request = toSaveServiceRequest(draft, existing)
    const saved = existing
      ? await manageApi.updateService(existing.id, request)
      : await manageApi.createService(request)
    const changes = professionalChanges(
      (existing?.professionals ?? []).map(({ professionalId }) => professionalId),
      draft.professionalIds,
    )
    try {
      await Promise.all([
        ...changes.enable.map((id) => manageApi.enableProfessional(saved.id, id)),
        ...changes.disable.map((id) => manageApi.disableProfessional(saved.id, id)),
      ])
    } catch (linkError) {
      throw Object.assign(linkError as object, { savedServiceId: saved.id })
    }
    return saved
  })

  const editing = serviceId !== undefined
  const existing = editing ? (services.data?.find(({ id }) => id === serviceId) ?? null) : null
  const mode = editing ? 'edit' : 'new'
  const title = editing ? 'Editar serviço' : 'Novo serviço'

  if (editing && services.isPending) {
    return (
      <PanelPage title={title}>
        <LoadingState label="Carregando o serviço…" />
      </PanelPage>
    )
  }
  if (editing && services.isError) {
    return (
      <PanelPage title={title}>
        <ErrorState
          message={errorMessage(services.error)}
          onRetry={() => void services.refetch()}
        />
      </PanelPage>
    )
  }
  if (editing && !existing) {
    return (
      <PanelPage title={title}>
        <p role="alert" className="type-body text-(--text-muted)">
          Este serviço não existe mais neste estabelecimento.
        </p>
        <Button
          variant="secondary"
          className="self-start"
          onClick={() => navigate(ROUTES.panelServices)}
        >
          Voltar para os serviços
        </Button>
      </PanelPage>
    )
  }

  // Quem foi desativado continua aparecendo se já executa o serviço: dá para tirá-lo.
  const linked = existing?.professionals ?? ([] as ServiceProfessionalResponse[])
  const options = professionals.map(({ id, displayName }) => ({ id, name: displayName }))
  const category = detail.data?.category ?? ''
  const nameOf = (id: string) =>
    team.data?.find((professional) => professional.id === id)?.displayName ?? 'Profissional'

  return (
    <ServiceFormScreen
      // A tela guarda os campos no estado: outro serviço (ou o mesmo recarregado) começa do zero.
      key={existing?.id ?? 'new'}
      mode={mode}
      businessName={business.name}
      categoryName={categoryLabel(category)}
      sensitive={isSensitiveCategory(category)}
      professionals={options.concat(
        linked
          .filter(({ professionalId }) => !options.some(({ id }) => id === professionalId))
          .map(({ professionalId }) => ({
            id: professionalId,
            name: `${nameOf(professionalId)} (desativado)`,
          })),
      )}
      initialValues={existing ? toFormValues(existing) : EMPTY_SERVICE_VALUES}
      previewHours={previewHoursOf(schedules, today)}
      saving={save.isPending}
      error={error}
      onCancel={() => navigate(ROUTES.panelServices)}
      onSave={(draft) => {
        setError(undefined)
        save.mutate(
          { draft, existing },
          {
            onSuccess: (saved) => {
              toast.success(editing ? `"${saved.name}" atualizado.` : `"${saved.name}" cadastrado.`)
              navigate(ROUTES.panelServices)
            },
            onError: (caught) => {
              const savedId = (caught as { savedServiceId?: string }).savedServiceId
              if (savedId && !editing) {
                toast.error(
                  `O serviço foi salvo, mas faltou ligar os profissionais: ${errorMessage(caught)}`,
                )
                navigate(editServicePath(savedId), { replace: true })
                return
              }
              setError(errorMessage(caught))
            },
          },
        )
      }}
    />
  )
}
