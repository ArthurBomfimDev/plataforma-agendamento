import { ACTIVE_BADGE, BADGE, byActiveThenName, professionalsLabel, serviceSummary } from './consts'
import { ErrorState, LoadingState } from '@components/screen-state'
import { PANEL_CARD, PANEL_NOTICE, PanelPage } from '@components/panel-page'
import type { ServiceListItem, ServicesScreenProps } from './types'

import { Button } from '@components/button'
import { ConfirmDialog } from '@components/confirm-dialog'
import { ShieldCheck } from 'lucide-react'
import { cn } from 'cn'
import { useState } from 'react'

/**
 * Painel — Serviços (Onda 7D): o catálogo do estabelecimento, com ativar e desativar. Criar e editar
 * abrem o cadastro do Rafael (tela 11). Só o dono chega aqui (guard em `panel-layout`).
 *
 * A categoria é do estabelecimento, não do serviço (ADR-015): em Saúde, o aviso lembra que nome e
 * descrição vão para a vitrine pública.
 */
export const ServicesScreen = (props: ServicesScreenProps) => {
  const { data, businessName, sensitive, onNew, onEdit, onToggleActive } = props

  const [deactivating, setDeactivating] = useState<ServiceListItem | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const services = data.status === 'ready' ? data.services.toSorted(byActiveThenName) : []
  const active = services.filter(({ isActive }) => isActive).length

  const toggle = async (service: ServiceListItem) => {
    setBusyId(service.id)
    try {
      await onToggleActive?.(service)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PanelPage
      title="Serviços"
      subtitle={
        data.status === 'ready'
          ? `${active} ${active === 1 ? 'ativo' : 'ativos'} de ${services.length} · ${businessName}`
          : businessName
      }
      actions={
        <Button className="shrink-0" onClick={onNew}>
          Novo serviço
        </Button>
      }
    >
      {sensitive && (
        <p className={PANEL_NOTICE}>
          <ShieldCheck aria-hidden="true" className="mt-(--space-2) size-4 shrink-0" />
          Estabelecimento de saúde: nome e descrição do serviço aparecem na vitrine pública. Não
          coloque neles nada sobre um paciente.
        </p>
      )}

      {data.status === 'loading' ? (
        <LoadingState label="Carregando os serviços…" />
      ) : data.status === 'error' ? (
        <ErrorState message={data.message} onRetry={data.onRetry} />
      ) : services.length === 0 ? (
        <div className="flex flex-col items-start gap-(--space-8)">
          <p role="status" className="type-body text-(--text-muted)">
            Nenhum serviço cadastrado. Sem serviço ativo, ninguém consegue agendar.
          </p>
          <Button variant="secondary" onClick={onNew}>
            Cadastrar o primeiro serviço
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-(--space-12)">
          {services.map((service) => (
            <li key={service.id} className={PANEL_CARD}>
              <div className="flex items-start gap-(--space-12)">
                <div className="flex min-w-0 flex-1 flex-col gap-(--space-2)">
                  <h2 className="type-label text-(--text-strong)">{service.name}</h2>
                  <p className="type-caption tabular text-(--text-body)">
                    {serviceSummary(service)}
                  </p>
                </div>
                <span className={cn(BADGE, ACTIVE_BADGE[`${service.isActive}`])}>
                  {service.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="type-caption text-(--text-muted)">
                {professionalsLabel(service.professionalNames)}
              </p>
              <div className="flex flex-wrap gap-(--space-8)">
                <Button
                  variant="secondary"
                  aria-label={`Editar ${service.name}`}
                  onClick={() => onEdit?.(service.id)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  disabled={busyId === service.id}
                  aria-label={`${service.isActive ? 'Desativar' : 'Ativar'} ${service.name}`}
                  onClick={() =>
                    service.isActive ? setDeactivating(service) : void toggle(service)
                  }
                >
                  {busyId === service.id ? 'Salvando…' : service.isActive ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deactivating !== null}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title="Desativar este serviço?"
        description={
          deactivating
            ? `"${deactivating.name}" sai da vitrine e ninguém mais consegue pedir. Os agendamentos já feitos continuam.`
            : ''
        }
        confirmLabel="Desativar serviço"
        dismissLabel="Manter ativo"
        onConfirm={() => {
          if (deactivating) void toggle(deactivating)
          setDeactivating(null)
        }}
      />
    </PanelPage>
  )
}
