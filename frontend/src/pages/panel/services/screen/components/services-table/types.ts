import type { ColumnDef } from '@tanstack/react-table'
import type { SERVICES_TABLE_FEATURES } from './consts'
import type { ServiceListItem } from '../../types'

export type ServiceColumn = ColumnDef<typeof SERVICES_TABLE_FEATURES, ServiceListItem>
