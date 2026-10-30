import {
  MOCK_BLOCK_VALUES,
  MOCK_CONFIRMED_APPOINTMENTS,
  MOCK_HOLIDAY_RULES,
  MOCK_SCHEDULE_PROFESSIONALS,
  MOCK_SCHEDULE_TODAY,
} from '@features/work-schedule/mock'
import { holidayRuleLabel, holidaysFrom, shortDateLabel } from '@features/work-schedule/consts'

import { WorkScheduleScreen } from '@features/work-schedule'
import { toast } from '@lib/toast'

const HOLIDAYS = holidaysFrom(MOCK_SCHEDULE_TODAY)

const nameOf = (professionalId: string) =>
  MOCK_SCHEDULE_PROFESSIONALS.find(({ id }) => id === professionalId)?.name ?? 'o profissional'

/**
 * Jornadas e bloqueios (tela 12), dentro do `PanelLayout`.
 *
 * TODO: salvar a jornada, bloquear período e mudar a regra de feriado dependem da API de
 * Availability (e cancelar agendamentos, da de Scheduling). Por enquanto nada é gravado, e o aviso
 * diz isso.
 */
export const PanelSchedulesRoute = () => (
  <WorkScheduleScreen
    professionals={MOCK_SCHEDULE_PROFESSIONALS}
    appointments={MOCK_CONFIRMED_APPOINTMENTS}
    holidays={HOLIDAYS}
    initialHolidayRules={MOCK_HOLIDAY_RULES}
    today={MOCK_SCHEDULE_TODAY}
    initialBlock={MOCK_BLOCK_VALUES}
    onSaveSchedule={(professionalId) =>
      toast.info(
        `A jornada de ${nameOf(professionalId)} está pronta, mas ainda não foi gravada: falta a API de jornadas.`,
      )
    }
    onBlockPeriod={(draft) =>
      toast.info(
        `O bloqueio de ${nameOf(draft.professionalId)} está pronto, mas ainda não foi gravado: falta a API de jornadas.`,
      )
    }
    onHolidayRuleChange={(holiday, rule) =>
      toast.info(
        `${shortDateLabel(holiday.date)} · ${holidayRuleLabel(rule)}: ainda não foi gravado, falta a API de jornadas.`,
      )
    }
  />
)
