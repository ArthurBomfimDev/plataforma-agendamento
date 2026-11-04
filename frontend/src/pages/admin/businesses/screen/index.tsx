import {
  CATEGORY_FILTER_OPTIONS,
  CATEGORY_LABELS,
  COUNCIL_LABELS,
  DECISION_LABELS,
  REQUIRES_NOTE,
  STATUS_OPTIONS,
  decisionsFor,
  formatDate,
  statusLabel,
} from './consts'
import { ErrorState, LoadingState } from '@components/screen-state'
import type { AdminBusinessesScreenProps, AdminTab, Load } from './types'

import type { AdminBusinessDetailResponse, BusinessReportResponse } from '@api/models'
import { Button } from '@components/button'
import { SelectField } from '@components/select-field'
import { TextField } from '@components/text-field'
import { labelOf } from '@components/business-status-banner/consts'
import { useState } from 'react'

const TABS: ReadonlyArray<{ id: AdminTab; label: string }> = [
  { id: 'businesses', label: 'Estabelecimentos' },
  { id: 'reports', label: 'Denúncias' },
]

const CARD =
  'flex flex-col gap-(--space-8) rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-(--space-16)'

/** Estado de carregamento, erro e (via `children`) sucesso de uma lista ou detalhe. */
const Loaded = <T,>({
  load,
  children,
}: {
  load: Load<T>
  children: (data: T) => React.ReactNode
}) => {
  if (load.status === 'loading') return <LoadingState />
  if (load.status === 'error') return <ErrorState message={load.message} onRetry={load.onRetry} />
  return <>{children(load.data)}</>
}

/**
 * Administração da plataforma (ondas finais, Fase 3): fila de estabelecimentos por status e categoria, o detalhe com
 * todos os dados e as decisões (aprovar, reprovar, suspender, reativar), e a fila de denúncias. No celular, a lista
 * e o detalhe se alternam. O guard está na rota (e, de verdade, no servidor).
 *
 * TODO(figma): não há wireframe desta tela; segue os tokens e o desenho das telas de gestão.
 */
export const AdminBusinessesScreen = (props: AdminBusinessesScreenProps) => {
  const { tab, onTabChange } = props

  return (
    <main className="min-h-dvh bg-(--bg-page) px-(--space-16) pt-[calc(var(--space-24)+env(safe-area-inset-top))] pb-[calc(var(--space-24)+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-240 flex-col gap-(--space-16)">
        <h1 className="type-heading text-(--text-strong)">Administração</h1>

        <div role="tablist" aria-label="Seções da administração" className="flex gap-(--space-8)">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => onTabChange(id)}
              className={`type-label min-h-(--size-touch-min) flex-1 rounded-md border px-(--space-12) ${
                tab === id
                  ? 'border-(--text-link) bg-(--bg-surface) text-(--text-link)'
                  : 'border-(--border-subtle) text-(--text-muted)'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'businesses' ? <BusinessesTab {...props} /> : <ReportsTab {...props} />}
      </div>
    </main>
  )
}

const BusinessesTab = (props: AdminBusinessesScreenProps) => {
  const { filters, onFiltersChange, businesses, selectedId, onSelect, detail, onDecide } = props

  if (selectedId !== null) {
    return (
      <div className="flex flex-col gap-(--space-12)">
        <Button variant="ghost" className="self-start" onClick={() => onSelect(null)}>
          ← Voltar à lista
        </Button>
        <Loaded load={detail}>
          {(data) => <BusinessDetail detail={data} onDecide={onDecide} />}
        </Loaded>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-(--space-12)">
      <div className="grid gap-(--space-12) md:grid-cols-2">
        <SelectField
          id="admin-status"
          label="Status"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(event) => onFiltersChange({ ...filters, status: event.target.value })}
        />
        <SelectField
          id="admin-category"
          label="Categoria"
          options={CATEGORY_FILTER_OPTIONS}
          value={filters.category}
          onChange={(event) => onFiltersChange({ ...filters, category: event.target.value })}
        />
      </div>

      <Loaded load={businesses}>
        {(items) =>
          items.length === 0 ? (
            <p className="type-body text-(--text-muted)">
              Nenhum estabelecimento com estes filtros.
            </p>
          ) : (
            <ul aria-label="Estabelecimentos" className="flex flex-col gap-(--space-8)">
              {items.map((business) => (
                <li key={business.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(business.id)}
                    className={`${CARD} min-h-(--size-touch-min) w-full text-left`}
                  >
                    <span className="type-label text-(--text-strong)">{business.name}</span>
                    <span className="type-caption text-(--text-muted)">
                      {CATEGORY_LABELS[business.category] ?? business.category} ·{' '}
                      {statusLabel(business.status, business.verificationLevel)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        }
      </Loaded>
    </div>
  )
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-(--space-2)">
    <dt className="type-caption text-(--text-muted)">{label}</dt>
    <dd className="type-body break-words text-(--text-strong)">{children}</dd>
  </div>
)

const BusinessDetail = (props: {
  detail: AdminBusinessDetailResponse
  onDecide: AdminBusinessesScreenProps['onDecide']
}) => {
  const { detail, onDecide } = props
  const { business, checklist, responsible } = detail
  const [note, setNote] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [noteError, setNoteError] = useState<string>()

  const decide = async (action: 'approve' | 'reject' | 'suspend' | 'reinstate') => {
    const trimmed = note.trim()
    if (REQUIRES_NOTE.has(action) && trimmed.length === 0) {
      setNoteError('Informe o motivo: o dono precisa ler o que fazer.')
      return
    }
    setNoteError(undefined)
    setError(undefined)
    setBusy(true)
    const failure = await onDecide(action, trimmed || null)
    setBusy(false)
    if (failure) setError(failure)
    else setNote('')
  }

  const actions = decisionsFor(business.status)
  const address = [
    business.address.street,
    business.address.streetNumber,
    business.address.district,
    business.address.city,
    business.address.state,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <article aria-label={`Detalhe de ${business.name}`} className="flex flex-col gap-(--space-16)">
      <header className="flex flex-col gap-(--space-4)">
        <h2 className="type-heading text-(--text-strong)">{business.name}</h2>
        <p className="type-caption text-(--text-muted)">
          {CATEGORY_LABELS[business.category] ?? business.category} ·{' '}
          {statusLabel(business.status, business.verificationLevel)}
        </p>
      </header>

      <dl className={CARD}>
        {/* O documento só aparece aqui, para o Admin conferir a situação cadastral à mão. */}
        <Row label="Documento">{business.document}</Row>
        <Row label="Endereço">{address || 'Não informado'}</Row>
        <Row label="Termos">
          {detail.termsAcceptedAt
            ? `Aceitos em ${formatDate(detail.termsAcceptedAt)} (versão ${detail.termsVersion})`
            : 'Não aceitos'}
        </Row>
        {responsible && (
          <Row label="Responsável (Saúde)">
            {responsible.name} — {COUNCIL_LABELS[responsible.council] ?? responsible.council}{' '}
            {responsible.councilNumber}/{responsible.councilState}
          </Row>
        )}
        {detail.verificationNote && <Row label="Última decisão">{detail.verificationNote}</Row>}
        {detail.suspensionReason && (
          <Row label="Motivo da suspensão">
            {detail.suspensionReason}
            {detail.suspendedAt && ` (${formatDate(detail.suspendedAt)})`}
          </Row>
        )}
      </dl>

      <section aria-label="Checklist" className={CARD}>
        <h3 className="type-label text-(--text-strong)">Checklist</h3>
        <ul className="flex flex-col gap-(--space-4)">
          {checklist.map((item) => (
            <li key={item.key} className="type-body">
              <span aria-hidden="true">{item.done ? '✓' : '○'}</span> {labelOf(item.key)}
              <span className="sr-only">{item.done ? ' (feito)' : ' (falta)'}</span>
            </li>
          ))}
        </ul>
      </section>

      {actions.length > 0 && (
        <section aria-label="Decisão" className={CARD}>
          {actions.some((action) => REQUIRES_NOTE.has(action)) && (
            <TextField
              id="admin-note"
              label="Motivo (obrigatório para reprovar e suspender)"
              value={note}
              error={noteError}
              onChange={(event) => {
                setNote(event.target.value)
                setNoteError(undefined)
              }}
            />
          )}
          {error && (
            <p role="alert" className="type-label text-(--status-rejected-fg)">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-(--space-8) sm:flex-row">
            {actions.map((action) => (
              <Button
                key={action}
                variant={action === 'approve' || action === 'reinstate' ? 'primary' : 'secondary'}
                className="sm:flex-1"
                disabled={busy}
                onClick={() => void decide(action)}
              >
                {DECISION_LABELS[action]}
              </Button>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

const ReportsTab = (props: AdminBusinessesScreenProps) => {
  const { reportStatus, onReportStatusChange, reports, onResolveReport } = props

  return (
    <div className="flex flex-col gap-(--space-12)">
      <SelectField
        id="admin-report-status"
        label="Situação"
        options={[
          { value: 'Open', label: 'Abertas' },
          { value: 'Resolved', label: 'Resolvidas' },
        ]}
        value={reportStatus}
        onChange={(event) => onReportStatusChange(event.target.value as 'Open' | 'Resolved')}
      />
      <Loaded load={reports}>
        {(items) =>
          items.length === 0 ? (
            <p className="type-body text-(--text-muted)">
              {reportStatus === 'Open' ? 'Nenhuma denúncia aberta.' : 'Nenhuma denúncia resolvida.'}
            </p>
          ) : (
            <ul aria-label="Denúncias" className="flex flex-col gap-(--space-8)">
              {items.map((report) => (
                <li key={report.id}>
                  <ReportCard report={report} onResolve={onResolveReport} />
                </li>
              ))}
            </ul>
          )
        }
      </Loaded>
    </div>
  )
}

const ReportCard = (props: {
  report: BusinessReportResponse
  onResolve: AdminBusinessesScreenProps['onResolveReport']
}) => {
  const { report, onResolve } = props
  const [note, setNote] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const resolve = async () => {
    setError(undefined)
    setBusy(true)
    const failure = await onResolve(report.id, note.trim() || null)
    setBusy(false)
    if (failure) setError(failure)
  }

  return (
    <article className={CARD}>
      <h3 className="type-label text-(--text-strong)">
        {report.businessName || 'Estabelecimento'}
      </h3>
      <p className="type-body break-words">{report.reason}</p>
      <p className="type-caption text-(--text-muted)">
        {formatDate(report.reportedAt)} · {report.reporterUserId ? 'conta identificada' : 'anônima'}
      </p>
      {report.status === 'Resolved' ? (
        <p className="type-caption text-(--text-muted)">
          Resolvida em {report.resolvedAt ? formatDate(report.resolvedAt) : '—'}
          {report.resolution ? `: ${report.resolution}` : ''}
        </p>
      ) : (
        <>
          <TextField
            id={`report-note-${report.id}`}
            label="Anotação (opcional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          {error && (
            <p role="alert" className="type-label text-(--status-rejected-fg)">
              {error}
            </p>
          )}
          <Button variant="secondary" disabled={busy} onClick={() => void resolve()}>
            {busy ? 'Resolvendo…' : 'Resolver denúncia'}
          </Button>
        </>
      )}
    </article>
  )
}
