import type { AgendaEntry, AgendaProfessional } from '../../types'

/** Todos os itens do dia em ordem de horário, cada um com o seu profissional. No empate, ordem alfabética. */
export const timelineOf = (professionals: ReadonlyArray<AgendaProfessional>) =>
  professionals
    .flatMap(({ name, entries }) =>
      entries.map((entry): { entry: AgendaEntry; professionalName: string } => ({
        entry,
        professionalName: name,
      })),
    )
    .toSorted(
      (a, b) =>
        a.entry.start.localeCompare(b.entry.start) ||
        a.professionalName.localeCompare(b.professionalName, 'pt-BR'),
    )
