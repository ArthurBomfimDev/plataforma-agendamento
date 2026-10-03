import type { BusinessProfessional } from './types'

/**
 * Dados PROVISÓRIOS, copiados do wireframe "04 · Escolher profissional" do Figma.
 * Não são dado real. Saem quando existir a consulta de profissionais em `src/lib/api`.
 * Chave: id do estabelecimento.
 */
export const MOCK_PROFESSIONALS: Record<string, BusinessProfessional[]> = {
  'estudio-duartina': [
    {
      id: 'marina-souza',
      name: 'Marina Souza',
      specialty: 'Colorimetria',
      yearsOfExperience: 6,
      rating: 4.9,
    },
    {
      id: 'rafael-lima',
      name: 'Rafael Lima',
      specialty: 'Barbeiro',
      yearsOfExperience: 3,
      rating: 4.9,
    },
    {
      id: 'carla-nunes',
      name: 'Carla Nunes',
      specialty: 'Corte feminino',
      yearsOfExperience: 10,
      rating: 4.8,
    },
  ],
}
