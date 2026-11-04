import { columnSizingFeature, tableFeatures } from '@tanstack/react-table'

/** Tabela só de leitura: sem ordenação, filtro nem paginação (a lista já vem ordenada da tela); só a largura das colunas. */
export const SERVICES_TABLE_FEATURES = tableFeatures({ columnSizingFeature })

/** Padding das células, com o recuo de 20px nas pontas do Figma 18. */
export const CELL = 'px-(--space-8) py-(--space-12) align-middle first:pl-5 last:pr-5'
