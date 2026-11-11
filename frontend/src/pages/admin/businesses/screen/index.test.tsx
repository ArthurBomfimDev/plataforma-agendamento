import type {
  AdminBusinessDetailResponse,
  BusinessReportResponse,
  BusinessResponse,
  ModerationReviewResponse,
  OwnerBusinessResponse,
  ProfessionalRemovalResponse,
} from '@api/models'
import { decisionsFor, statusLabel } from './consts'
import { describe, expect, it } from 'vitest'

import { AdminBusinessesScreen } from '.'
import type { AdminBusinessesScreenProps } from './types'
import { renderToString } from 'react-dom/server'

const noop = () => undefined
const ok = async () => null

const business = (overrides: Partial<BusinessResponse> = {}): BusinessResponse => ({
  id: 'b1',
  name: 'Clínica Vida',
  document: '11222333000181',
  category: 'Saude',
  status: 'PendingReview',
  verificationLevel: 'UnderReview',
  ...overrides,
})

const owner = (overrides: Partial<OwnerBusinessResponse> = {}): OwnerBusinessResponse => ({
  ...business(),
  address: {
    street: 'Rua A',
    streetNumber: '10',
    district: 'Centro',
    city: 'Garça',
    state: 'SP',
    postalCode: '17400000',
  },
  latitude: -22.2,
  longitude: -49.6,
  locationPrecision: 'Street',
  locationConfirmed: true,
  policy: {
    autoConfirm: false,
    pendingExpirationHours: 12,
    minLeadTimeHours: 2,
    bookingHorizonDays: 60,
    cancellationWindowHours: 24,
    timeZone: 'America/Sao_Paulo',
  },
  logo: null,
  cover: null,
  statusReason: null,
  termsAccepted: true,
  responsibleInformed: true,
  ...overrides,
})

const detailOf = (
  overrides: Partial<OwnerBusinessResponse> = {},
  extra: Partial<AdminBusinessDetailResponse> = {},
): AdminBusinessDetailResponse => ({
  business: owner(overrides),
  checklist: [
    { key: 'terms', done: true, requiredForSubmit: true },
    { key: 'professional', done: false, requiredForSubmit: true },
  ],
  verifiedByUserId: null,
  verifiedAt: null,
  verificationNote: null,
  responsible: {
    name: 'Dra. Ana Lima',
    council: 'Crp',
    councilNumber: '0612345',
    councilState: 'SP',
  },
  suspensionReason: null,
  suspendedByUserId: null,
  suspendedAt: null,
  termsAcceptedAt: '2026-11-04T12:00:00Z',
  termsVersion: '2026-11',
  ...extra,
})

const report = (overrides: Partial<BusinessReportResponse> = {}): BusinessReportResponse => ({
  id: 'r1',
  businessId: 'b1',
  businessName: 'Studio Silva',
  reason: 'Fotos de outra empresa.',
  status: 'Open',
  reportedAt: '2026-11-04T12:00:00Z',
  reporterUserId: null,
  resolvedByUserId: null,
  resolvedAt: null,
  resolution: null,
  ...overrides,
})

const render = (overrides: Partial<AdminBusinessesScreenProps> = {}) =>
  renderToString(
    <AdminBusinessesScreen
      tab="businesses"
      onTabChange={noop}
      filters={{ status: 'PendingReview', category: '' }}
      onFiltersChange={noop}
      businesses={{ status: 'ready', data: [business()] }}
      selectedId={null}
      onSelect={noop}
      detail={{ status: 'loading' }}
      onDecide={ok}
      reportStatus="Open"
      onReportStatusChange={noop}
      reports={{ status: 'ready', data: [] }}
      onResolveReport={ok}
      {...overrides}
    />,
  ).replaceAll('<!-- -->', '')

const removal = (
  overrides: Partial<ProfessionalRemovalResponse> = {},
): ProfessionalRemovalResponse => ({
  id: 'r1',
  professionalId: 'p1',
  professionalName: 'Marcos Lima',
  businessId: 'b1',
  businessName: 'Estúdio Duartina',
  reason: 'Não autorizei a foto.',
  contact: 'ana@example.com',
  status: 'Open',
  requestedAt: '2026-11-04T12:00:00Z',
  resolvedByUserId: null,
  resolvedAt: null,
  resolution: null,
  ...overrides,
})

describe('AdminBusinessesScreen — remoções de perfil', () => {
  it('a aba existe ao lado de Denúncias', () => {
    const html = render()

    expect(html).toContain('Remoções de perfil')
    expect(html).toContain('Denúncias')
  })

  it('carregando e erro mostram o estado, com "Tentar de novo" no erro', () => {
    expect(render({ tab: 'removals', removals: { status: 'loading' } })).toContain('Carregando')

    const html = render({
      tab: 'removals',
      removals: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: noop },
    })
    expect(html).toContain('Sem conexão com o servidor.')
    expect(html).toContain('Tentar de novo')
  })

  it('vazio: sem pedido aberto', () => {
    expect(render({ tab: 'removals', removals: { status: 'ready', data: [] } })).toContain(
      'Nenhum pedido de remoção aberto.',
    )
  })

  it('sucesso: profissional, estabelecimento, motivo, contato e o botão de resolver', () => {
    const html = render({ tab: 'removals', removals: { status: 'ready', data: [removal()] } })

    expect(html).toContain('Marcos Lima · Estúdio Duartina')
    expect(html).toContain('Não autorizei a foto.')
    expect(html).toContain('contato: ana@example.com')
    expect(html).toContain('Resolver pedido')
  })

  it('pedido resolvido mostra quando e a anotação, sem o botão', () => {
    const html = render({
      tab: 'removals',
      removalStatus: 'Resolved',
      removals: {
        status: 'ready',
        data: [
          removal({
            status: 'Resolved',
            resolvedAt: '2026-11-05T10:00:00Z',
            resolution: 'Falei com o dono.',
          }),
        ],
      },
    })

    expect(html).toContain('Falei com o dono.')
    expect(html).not.toContain('Resolver pedido')
  })
})

describe('AdminBusinessesScreen — moderação de avaliações', () => {
  const review = (overrides: Partial<ModerationReviewResponse> = {}): ModerationReviewResponse => ({
    id: 'rv1',
    businessId: 'b1',
    businessName: 'Barbearia do Zé',
    rating: 1,
    professionalRating: null,
    comment: 'Comentário ofensivo.',
    reviewerName: 'Ana S.',
    reviewedAt: '2026-11-02T15:00:00Z',
    reportReason: 'Ofende a equipe.',
    reportedAt: '2026-11-03T15:00:00Z',
    reportOpen: true,
    isHidden: false,
    hiddenReason: null,
    hiddenAt: null,
    hiddenByUserId: null,
    ...overrides,
  })

  it('carregando, erro e vazio', () => {
    expect(render({ tab: 'reviews', moderation: { status: 'loading' } })).toContain('Carregando')
    expect(
      render({
        tab: 'reviews',
        moderation: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: noop },
      }),
    ).toContain('Sem conexão com o servidor.')
    expect(render({ tab: 'reviews', moderation: { status: 'ready', data: [] } })).toContain(
      'Nenhuma avaliação denunciada.',
    )
    expect(
      render({ tab: 'reviews', reviewStatus: 'Hidden', moderation: { status: 'ready', data: [] } }),
    ).toContain('Nenhuma avaliação oculta.')
  })

  it('denúncia aberta: mostra o texto, o motivo do dono e as duas decisões', () => {
    const html = render({ tab: 'reviews', moderation: { status: 'ready', data: [review()] } })

    expect(html).toContain('Barbearia do Zé · 1 de 5 · Ana S.')
    expect(html).toContain('Comentário ofensivo.')
    expect(html).toContain('Denúncia do dono: Ofende a equipe.')
    expect(html).toContain('Motivo para ocultar')
    expect(html).toContain('Ocultar avaliação')
    expect(html).toContain('Manter no ar')
    expect(html).not.toContain('Reexibir')
  })

  it('oculta: mostra o motivo e oferece reexibir, sem as decisões da denúncia', () => {
    const html = render({
      tab: 'reviews',
      reviewStatus: 'Hidden',
      moderation: {
        status: 'ready',
        data: [
          review({
            isHidden: true,
            reportOpen: false,
            hiddenReason: 'Ofensa',
            hiddenAt: '2026-11-04T15:00:00Z',
          }),
        ],
      },
    })

    expect(html).toContain('Ofensa')
    expect(html).toContain('Reexibir avaliação')
    expect(html).not.toContain('Manter no ar')
  })
})

describe('regras de status', () => {
  it('cada status tem as decisões certas; rascunho não tem (quem age é o dono)', () => {
    expect(decisionsFor('PendingReview')).toEqual(['approve', 'reject'])
    expect(decisionsFor('Active')).toEqual(['suspend'])
    expect(decisionsFor('Suspended')).toEqual(['reinstate'])
    expect(decisionsFor('Draft')).toEqual([])
  })

  it('"Reprovado" é rascunho com nível Rejected', () => {
    expect(statusLabel('Draft', 'Rejected')).toBe('Reprovado')
    expect(statusLabel('Draft', 'Unverified')).toBe('Rascunho')
    expect(statusLabel('PendingReview', 'UnderReview')).toBe('Em análise')
  })
})

describe('AdminBusinessesScreen — estabelecimentos', () => {
  it('lista com os filtros de status e categoria', () => {
    const html = render()

    expect(html).toContain('Administração')
    expect(html).toContain('role="tablist"')
    expect(html).toContain('Estabelecimentos')
    expect(html).toContain('Denúncias')
    expect(html).toContain('Em análise')
    expect(html).toContain('Todas as categorias')
    expect(html).toContain('Clínica Vida')
    expect(html).toContain('Saúde · Em análise')
  })

  it('carregando, erro com "Tentar de novo" e vazio', () => {
    expect(render({ businesses: { status: 'loading' } })).toContain('Carregando')
    const failed = render({
      businesses: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: noop },
    })
    expect(failed).toContain('Sem conexão com o servidor.')
    expect(failed).toContain('Tentar de novo')
    expect(render({ businesses: { status: 'ready', data: [] } })).toContain(
      'Nenhum estabelecimento com estes filtros.',
    )
  })
})

describe('AdminBusinessesScreen — detalhe e decisões', () => {
  const select = (d: AdminBusinessDetailResponse) =>
    render({ selectedId: 'b1', detail: { status: 'ready', data: d } })

  it('em análise (Saúde): todos os dados, o responsável, a checklist e Aprovar e Reprovar com o motivo', () => {
    const html = select(detailOf())

    expect(html).toContain('Detalhe de Clínica Vida')
    // O Admin vê o documento com a máscara de CNPJ, para conferir a situação cadastral à mão.
    expect(html).toContain('11.222.333/0001-81')
    expect(html).toContain('Rua A, 10, Centro, Garça, SP')
    expect(html).toContain('Aceitos em')
    expect(html).toContain('versão 2026-11')
    expect(html).toContain('Dra. Ana Lima — CRP 0612345/SP')
    expect(html).toContain('Aceitar os termos')
    expect(html).toContain('(falta)')
    expect(html).toContain('Aprovar')
    expect(html).toContain('Reprovar')
    expect(html).toContain('Motivo (obrigatório para reprovar e suspender)')
    expect(html).not.toContain('Suspender')
    expect(html).toContain('Voltar à lista')
  })

  it('ativo: só Suspender; suspenso: só Reativar, com o motivo e a data', () => {
    const active = select(detailOf({ status: 'Active', verificationLevel: 'Verified' }))
    expect(active).toContain('Suspender')
    expect(active).not.toContain('Aprovar')

    const suspended = select(
      detailOf(
        { status: 'Suspended', verificationLevel: 'Verified' },
        { suspensionReason: 'Denúncia procedente.', suspendedAt: '2026-11-04T12:00:00Z' },
      ),
    )
    expect(suspended).toContain('Reativar')
    expect(suspended).toContain('Motivo da suspensão')
    expect(suspended).toContain('Denúncia procedente.')
  })

  it('rascunho (inclusive reprovado): sem botões de decisão', () => {
    const html = select(
      detailOf(
        { status: 'Draft', verificationLevel: 'Rejected' },
        { verificationNote: 'Registro não confere.' },
      ),
    )

    expect(html).toContain('Reprovado')
    expect(html).toContain('Registro não confere.')
    expect(html).not.toContain('aria-label="Decisão"')
  })

  it('Beleza não tem o responsável', () => {
    expect(select(detailOf({ category: 'Beleza' }, { responsible: null }))).not.toContain(
      'Responsável (Saúde)',
    )
  })

  it('o detalhe carregando e com erro', () => {
    expect(render({ selectedId: 'b1', detail: { status: 'loading' } })).toContain('Carregando')
    expect(
      render({
        selectedId: 'b1',
        detail: { status: 'error', message: 'Estabelecimento não encontrado.', onRetry: noop },
      }),
    ).toContain('Estabelecimento não encontrado.')
  })
})

describe('AdminBusinessesScreen — denúncias', () => {
  const reportsTab = (overrides: Partial<AdminBusinessesScreenProps> = {}) =>
    render({ tab: 'reports', ...overrides })

  it('aberta: motivo, quem denunciou (anônima ou conta) e "Resolver denúncia"', () => {
    const html = reportsTab({
      reports: {
        status: 'ready',
        data: [report(), report({ id: 'r2', reporterUserId: 'u1', reason: 'Endereço falso.' })],
      },
    })

    expect(html).toContain('Studio Silva')
    expect(html).toContain('Fotos de outra empresa.')
    expect(html).toContain('anônima')
    expect(html).toContain('conta identificada')
    expect(html).toContain('Resolver denúncia')
    expect(html).toContain('Anotação (opcional)')
  })

  it('resolvida: mostra a anotação e não oferece resolver de novo', () => {
    const html = reportsTab({
      reportStatus: 'Resolved',
      reports: {
        status: 'ready',
        data: [
          report({
            status: 'Resolved',
            resolvedAt: '2026-11-05T12:00:00Z',
            resolution: 'Sem procedência.',
          }),
        ],
      },
    })

    expect(html).toContain('Resolvida em')
    expect(html).toContain('Sem procedência.')
    expect(html).not.toContain('Resolver denúncia')
  })

  it('carregando, erro e vazio (aberta e resolvida)', () => {
    expect(reportsTab({ reports: { status: 'loading' } })).toContain('Carregando')
    expect(
      reportsTab({
        reports: { status: 'error', message: 'Sem conexão com o servidor.', onRetry: noop },
      }),
    ).toContain('Tentar de novo')
    expect(reportsTab()).toContain('Nenhuma denúncia aberta.')
    expect(reportsTab({ reportStatus: 'Resolved' })).toContain('Nenhuma denúncia resolvida.')
  })
})
