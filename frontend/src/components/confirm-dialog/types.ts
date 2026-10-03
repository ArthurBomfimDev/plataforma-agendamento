export type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  /** Rótulo da ação confirmada. Diga o que acontece ("Cancelar pedido"), nunca só "Sim". */
  confirmLabel: string
  /** Rótulo de quem desiste da ação. Não use "Cancelar" — confunde com a própria ação. */
  dismissLabel: string
  onConfirm: () => void
}
