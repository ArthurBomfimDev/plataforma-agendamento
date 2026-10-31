import type {
  BlockPeriodValues,
  ConfirmedAppointment,
  HolidayRule,
  ScheduleProfessional,
  TimeRange,
  WeekSchedule,
} from './types'

/**
 * Dados PROVISÓRIOS, copiados do wireframe "12 · Painel — Jornada e bloqueio de período" do Figma.
 * Não são dado real. Saem quando existirem, em `src/lib/api`, a consulta de jornadas e exceções do
 * módulo Availability e a de agendamentos confirmados do Scheduling.
 *
 * Só a semana da Marina está no wireframe; as de Rafael e Carla são exemplo. Juliana fica sem
 * jornada, como no Figma.
 */

const MORNING: TimeRange = { start: '09:00', end: '12:00' }
const AFTERNOON: TimeRange = { start: '13:00', end: '18:00' }

const week = (days: Partial<WeekSchedule>): WeekSchedule => ({
  monday: { enabled: false, ranges: [] },
  tuesday: { enabled: false, ranges: [] },
  wednesday: { enabled: false, ranges: [] },
  thursday: { enabled: false, ranges: [] },
  friday: { enabled: false, ranges: [] },
  saturday: { enabled: false, ranges: [] },
  sunday: { enabled: false, ranges: [] },
  ...days,
})

const on = (...ranges: TimeRange[]) => ({ enabled: true, ranges })

/** O "hoje" dos wireframes do painel. */
export const MOCK_SCHEDULE_TODAY = '2026-09-11'

export const MOCK_SCHEDULE_PROFESSIONALS: ScheduleProfessional[] = [
  {
    id: 'marina-souza',
    name: 'Marina Souza',
    schedule: week({
      monday: on(MORNING, AFTERNOON),
      tuesday: on(MORNING, AFTERNOON),
      wednesday: on(MORNING, AFTERNOON),
      thursday: on(MORNING, { start: '13:00', end: '20:00' }),
      friday: on(MORNING, AFTERNOON),
      saturday: on({ start: '09:00', end: '13:00' }),
    }),
  },
  {
    id: 'rafael-lima',
    name: 'Rafael Lima',
    schedule: week({
      tuesday: on({ start: '10:00', end: '19:00' }),
      wednesday: on({ start: '10:00', end: '19:00' }),
      thursday: on({ start: '10:00', end: '19:00' }),
      friday: on({ start: '10:00', end: '19:00' }),
      saturday: on({ start: '08:00', end: '14:00' }),
    }),
  },
  {
    id: 'carla-nunes',
    name: 'Carla Nunes',
    schedule: week({
      monday: on(MORNING, AFTERNOON),
      wednesday: on(MORNING, AFTERNOON),
      friday: on(MORNING, AFTERNOON),
    }),
  },
  { id: 'juliana-alves', name: 'Juliana Alves', schedule: week({}) },
]

/**
 * Os três atendimentos da Marina que caem nas férias do wireframe. O Figma usa "Cliente 4",
 * "Cliente 8" e "Cliente 2" como marcador; a palavra é banida no projeto (CLAUDE.md §2), então aqui
 * vão nomes de exemplo.
 */
export const MOCK_CONFIRMED_APPOINTMENTS: ConfirmedAppointment[] = [
  {
    id: 'apt-marina-0922',
    professionalId: 'marina-souza',
    date: '2026-09-22',
    start: '10:00',
    customerName: 'Ana Ribeiro',
    serviceName: 'Corte feminino',
  },
  {
    id: 'apt-marina-0924',
    professionalId: 'marina-souza',
    date: '2026-09-24',
    start: '15:30',
    customerName: 'Helena Prado',
    serviceName: 'Coloração',
  },
  {
    id: 'apt-marina-0926',
    professionalId: 'marina-souza',
    date: '2026-09-26',
    start: '09:00',
    customerName: 'Bruno Teixeira',
    serviceName: 'Barba',
  },
]

export const MOCK_HOLIDAY_RULES: Record<string, HolidayRule> = {
  '2026-10-12': { kind: 'special', start: '09:00', end: '13:00' },
}

/**
 * TODO: o wireframe mostra o formulário de bloqueio preenchido com as férias abaixo. Com a API, o
 * formulário começa vazio.
 */
export const MOCK_BLOCK_VALUES: BlockPeriodValues = {
  type: 'vacation',
  from: '2026-09-21',
  to: '2026-09-28',
  reason: '',
  conflictAction: 'keep',
}
