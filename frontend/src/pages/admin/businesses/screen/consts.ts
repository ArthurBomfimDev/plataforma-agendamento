export const STATUS_OPTIONS = [
  { value: 'PendingReview', label: 'Em análise' },
  { value: 'Draft', label: 'Rascunho (inclui reprovados)' },
  { value: 'Active', label: 'Ativos' },
  { value: 'Suspended', label: 'Suspensos' },
] as const

export const CATEGORY_FILTER_OPTIONS = [
  { value: '', label: 'Todas as categorias' },
  { value: 'Beleza', label: 'Beleza' },
  { value: 'Saude', label: 'Saúde' },
] as const

export const STATUS_LABELS: Record<string, string> = {
  Draft: 'Rascunho',
  PendingReview: 'Em análise',
  Active: 'Ativo',
  Suspended: 'Suspenso',
}

export const CATEGORY_LABELS: Record<string, string> = { Beleza: 'Beleza', Saude: 'Saúde' }

/** Reprovado = rascunho com nível de verificação `Rejected`. */
export const statusLabel = (status: string, verificationLevel: string) =>
  status === 'Draft' && verificationLevel === 'Rejected'
    ? 'Reprovado'
    : (STATUS_LABELS[status] ?? status)

/** Quais decisões o Admin tem em cada status. Rascunho não tem: quem age é o dono. */
export const decisionsFor = (status: string) => {
  switch (status) {
    case 'PendingReview':
      return ['approve', 'reject'] as const
    case 'Active':
      return ['suspend'] as const
    case 'Suspended':
      return ['reinstate'] as const
    default:
      return [] as const
  }
}

export const DECISION_LABELS = {
  approve: 'Aprovar',
  reject: 'Reprovar',
  suspend: 'Suspender',
  reinstate: 'Reativar',
} as const

/** Reprovar e suspender pedem o motivo: o dono precisa saber o que corrigir ou por que saiu do ar. */
export const REQUIRES_NOTE = new Set(['reject', 'suspend'])

export const COUNCIL_LABELS: Record<string, string> = {
  Crm: 'CRM',
  Crp: 'CRP',
  Crefito: 'CREFITO',
  Crn: 'CRN',
  Crefono: 'CREFONO',
  Cro: 'CRO',
}

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')
