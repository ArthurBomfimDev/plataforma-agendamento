type BreadcrumbItem = {
  label: string
  /** Sem `onClick`, o item é a página atual. */
  onClick?: () => void
}

export type BreadcrumbProps = {
  items: BreadcrumbItem[]
  className?: string
}
