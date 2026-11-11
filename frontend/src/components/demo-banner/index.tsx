import { DemoBannerView } from './view'
import { demoBannerText } from './text'

/**
 * Aviso de ambiente de demonstração. O texto vem da variável `VITE_DEMO_BANNER`, lida no build (como a base da API):
 * vazia, não há aviso. O ambiente final (`compose.demo.yaml`) a preenche; o uso local e a produção ficam sem ela.
 */
export const DemoBanner = () => (
  <DemoBannerView text={demoBannerText(import.meta.env.VITE_DEMO_BANNER)} />
)
