/**
 * Decisões determinísticas do seed de demonstração: quem ganha foto, quem mostra a foto na vitrine, quem tem folga.
 * São funções puras do índice do estabelecimento e do item, para a demonstração sair igual a cada execução e para
 * dar para testar sem API e sem banco.
 */

/** Todo estabelecimento tem logotipo; dois em cada três têm capa. */
export const hasCover = (businessIndex: number) => businessIndex % 3 !== 2

/** Três em cada quatro serviços têm foto. */
export const serviceHasPhoto = (businessIndex: number, serviceIndex: number) => (businessIndex + serviceIndex) % 4 !== 3

/**
 * "Mostrar foto na vitrine" ligado em metade dos serviços com foto. O padrão da API é ligado, então o desligado
 * precisa ser enviado de propósito: sem isso a demonstração não teria o caso contrário.
 */
export const serviceShowsPhotoInShowcase = (businessIndex: number, serviceIndex: number) =>
  serviceHasPhoto(businessIndex, serviceIndex) && (businessIndex + serviceIndex) % 2 === 0

/** O dono sempre tem foto; a equipe, quatro em cada cinco. */
export const professionalHasPhoto = (businessIndex: number, professionalIndex: number) =>
  professionalIndex === 0 || (businessIndex + professionalIndex) % 5 !== 4

/** Marca de todo bloqueio criado pelo seed: é por ela que a segunda execução reconhece o que já existe. */
export const TIME_OFF_REASON = 'Demonstração: folga fictícia'

export type TimeOffPlan = {
  /** Posição na equipe do estabelecimento. A 0 é o dono, que fica sempre disponível. */
  professionalIndex: number
  kind: 'DayOff' | 'Vacation'
  /** Dias a partir de hoje em que o bloqueio começa (inclusive) e termina (exclusivo). */
  startOffsetDays: number
  endOffsetDays: number
}

/**
 * Folgas e férias da equipe, sempre no FUTURO e DEPOIS dos 14 dias que o histórico preenche com agendamentos (o
 * histórico não conhece bloqueios): assim nenhuma folga cai em cima de um atendimento marcado. Um estabelecimento em
 * três ganha uma folga de um dia; um em cinco ganha férias de uma semana.
 */
export function timeOffPlan(businessIndex: number, teamSize: number): TimeOffPlan[] {
  if (teamSize < 2) return []
  const plan: TimeOffPlan[] = []
  if (businessIndex % 3 === 0) {
    plan.push({ professionalIndex: 1, kind: 'DayOff', startOffsetDays: 16, endOffsetDays: 17 })
  }
  if (businessIndex % 5 === 0) {
    plan.push({ professionalIndex: teamSize - 1, kind: 'Vacation', startOffsetDays: 21, endOffsetDays: 28 })
  }
  return plan
}
