import type { PreviewHours, ServiceFormValues, ServiceProfessionalOption } from './types'
import { formatCents } from './consts'

/**
 * Dados de TESTE, copiados do wireframe "11 · Painel — Cadastro de serviço" do Figma. A tela usa a
 * API (`panel-services-route`); isto só alimenta `index.test.tsx`.
 */

export const FIXTURE_BUSINESS_CATEGORY = 'Beleza'

/** Os mesmos profissionais da agenda do dia (tela 09). */
export const FIXTURE_SERVICE_PROFESSIONALS: ServiceProfessionalOption[] = [
  { id: 'marina-souza', name: 'Marina Souza' },
  { id: 'rafael-lima', name: 'Rafael Lima' },
  { id: 'carla-nunes', name: 'Carla Nunes' },
]

export const FIXTURE_PREVIEW_HOURS: PreviewHours = { start: '09:00', end: '12:00' }

/** O formulário preenchido do wireframe. */
export const FIXTURE_SERVICE_VALUES: ServiceFormValues = {
  name: 'Corte masculino',
  description: '',
  durationMinutes: '30 min',
  bufferBeforeMinutes: '5 min',
  bufferAfterMinutes: '10 min',
  slotStepMinutes: '15 min',
  price: formatCents(4_500),
  professionalIds: ['marina-souza', 'rafael-lima'],
}
