/**
 * Faixa no topo de toda tela, só no ambiente de demonstração. Não é botão nem link: só informa que os dados são
 * fictícios e que nada ali é real. Respeita a área segura do topo (regra 6 de empacotamento).
 */
export const DemoBannerView = ({ text }: { text: string }) =>
  text === '' ? null : (
    <div
      role="note"
      aria-label="Aviso do ambiente"
      className="border-b border-(--status-pending-fg) bg-(--status-pending-bg) px-(--space-12) pt-[calc(env(safe-area-inset-top)+0.25rem)] pb-1 text-center"
    >
      <p className="type-label font-semibold text-(--text-strong)">{text}</p>
    </div>
  )
