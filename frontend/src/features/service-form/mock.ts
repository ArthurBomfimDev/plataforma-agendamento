import type { PreviewHours, ServiceFormValues, ServiceProfessionalOption } from './types'
import { formatCents } from './consts'

/**
 * Dados PROVISÓRIOS, copiados do wireframe "11 · Painel — Cadastro de serviço" do Figma. Não são
 * dado real. Saem quando existirem, em `src/lib/api`, a consulta de profissionais do Business e a
 * jornada usada na pré-visualização.
 */

export const MOCK_BUSINESS_CATEGORY = 'Beleza'

/** Os mesmos profissionais da agenda do dia (tela 09). */
export const MOCK_SERVICE_PROFESSIONALS: ServiceProfessionalOption[] = [
  { id: 'marina-souza', name: 'Marina Souza' },
  { id: 'rafael-lima', name: 'Rafael Lima' },
  { id: 'carla-nunes', name: 'Carla Nunes' },
]

export const MOCK_PREVIEW_HOURS: PreviewHours = { start: '09:00', end: '12:00' }

/**
 * TODO: o wireframe mostra o formulário preenchido com o exemplo abaixo. Com a API, um serviço novo
 * começa vazio, com os padrões do domínio (buffers 0, granularidade 15 min).
 */
export const MOCK_SERVICE_VALUES: ServiceFormValues = {
  name: 'Corte masculino',
  description: '',
  durationMinutes: '30 min',
  bufferBeforeMinutes: '5 min',
  bufferAfterMinutes: '10 min',
  slotStepMinutes: '15 min',
  price: formatCents(4_500),
  professionalIds: ['marina-souza', 'rafael-lima'],
}
