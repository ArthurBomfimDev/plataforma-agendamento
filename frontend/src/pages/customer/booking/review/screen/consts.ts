export const NOTE_MAX_LENGTH = 200

/**
 * A política de cancelamento no prazo do próprio estabelecimento (`cancellationWindowHours`, configurado por ele): nenhum
 * prazo fixo no código. Passado o prazo não há pedido de cancelamento nem aprovação no sistema: a saída é falar com o
 * estabelecimento. Prazo zero: o cancelamento vale até o horário marcado.
 */
export const cancellationPolicyText = (windowHours: number) =>
  windowHours > 0
    ? `Cancelamento gratuito até ${windowHours} h antes. Depois disso, fale com o estabelecimento.`
    : 'Cancelamento gratuito até o horário marcado. Depois disso, fale com o estabelecimento.'
