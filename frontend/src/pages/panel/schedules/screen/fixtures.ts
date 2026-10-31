import type {
  BlockPeriodValues,
  ExceptionItem,
  HolidayRule,
  ScheduleProfessional,
  TimeRange,
  WeekSchedule,
} from './types'

/**
 * Dados de TESTE, copiados do wireframe "12 · Painel — Jornada e bloqueio de período" do Figma. Não são dado real:
 * o app usa a API; estes servem aos testes da tela.
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
    changes: [
      {
        id: 'ws-marina-sat',
        label: 'Sábado 09:00 – 13:00',
        validity: 'De 01/09/2026 a 30/11/2026',
      },
    ],
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
    changes: [],
  },
  {
    id: 'carla-nunes',
    name: 'Carla Nunes',
    schedule: week({
      monday: on(MORNING, AFTERNOON),
      wednesday: on(MORNING, AFTERNOON),
      friday: on(MORNING, AFTERNOON),
    }),
    changes: [],
  },
  { id: 'juliana-alves', name: 'Juliana Alves', schedule: week({}), changes: [] },
]

/** Bloqueios que ainda não terminaram, já no fuso do estabelecimento. */
export const MOCK_EXCEPTIONS: ExceptionItem[] = [
  {
    id: 'ex-marina-ferias',
    professionalName: 'Marina Souza',
    kind: 'Vacation',
    startDate: '2026-09-21',
    startTime: '00:00',
    endDate: '2026-09-29',
    endTime: '00:00',
    reason: 'Férias de setembro',
  },
  {
    id: 'ex-reforma',
    professionalName: null,
    kind: 'Block',
    startDate: '2026-10-05',
    startTime: '13:00',
    endDate: '2026-10-05',
    endTime: '18:00',
    reason: null,
  },
]

export const MOCK_HOLIDAY_RULES: Record<string, HolidayRule> = {
  '2026-10-12': { kind: 'special', start: '09:00', end: '13:00' },
}

/** As férias do wireframe, como o formulário as recebe. */
export const MOCK_BLOCK_VALUES: BlockPeriodValues = {
  kind: 'Vacation',
  wholeBusiness: false,
  from: '2026-09-21',
  to: '2026-09-28',
  allDay: true,
  startTime: '09:00',
  endTime: '18:00',
  reason: '',
  conflictAction: 'keep',
  cancellationReason: '',
}
