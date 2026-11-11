# ADR-035 — PWA: escopo, cache e atualização

- **Status:** Proposto
- **Data:** 2026-11-10
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** frontend (empacotamento), Compliance (cache de dado de saúde)
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

**Fatos.** O CLAUDE.md §3 decide **PWA primeiro**; Capacitor e Tauri consomem o mesmo build. O §3.1 sobe a prioridade do PWA
(instalação, ícone, splash, offline básico) porque o barbeiro e a manicure têm celular e não têm computador. O frontend é
estático (Vite, `base: './'`, `HashRouter`), servido pelo nginx, que já devolve uma origem única para site, `/api/` e
`/media/` e já declara na CSP `manifest-src 'self'` e `worker-src 'self'`. Antes desta decisão não havia manifest nem service worker.

**Fato legal.** Em categoria de saúde, o próprio agendamento é dado sensível (LGPD Art. 11, CLAUDE.md §4.7). Um service
worker é um cache que sobrevive ao logout, ao fim da sessão e à troca de pessoa no mesmo aparelho.

**Inferência nossa.** O risco real de um PWA mal configurado aqui não é a ausência de offline: é o cache guardar resposta
autenticada ou com dado pessoal e entregá-la a quem usar o aparelho depois. Também é risco servir um shell velho depois
de um deploy, porque a API e o front evoluem juntos.

## Problema

O que o service worker pode guardar, quando atualiza, e como o app se instala sem violar as 6 regras de empacotamento
nem a LGPD?

## Alternativas consideradas

### A — `vite-plugin-pwa` com Workbox (`generateSW`), só precache do shell

**A favor:** gera manifest, service worker e lista de precache com hash a partir do build do Vite; o ciclo de vida
(`prompt` para atualizar) já está resolvido e testado por muita gente; a lista do precache é derivada do build, então não
há como esquecer um arquivo novo. O plugin é só dependência de build: nenhum runtime novo em produção além do Workbox
dentro do SW.
**Contra:** uma dependência de desenvolvimento a mais (e `workbox-build`/`workbox-window` por baixo); a versão do plugin
precisa acompanhar o Vite.

### B — Service worker escrito à mão

**A favor:** zero dependência; comportamento todo legível em um arquivo.
**Contra:** a lista de precache com hash tem de ser gerada por script próprio; ciclo de vida (`skipWaiting`, `clients.claim`,
limpeza de cache velho) é exatamente onde se erra e onde um erro prende o usuário numa versão velha.

### C — Sem service worker, só manifest

**A favor:** nenhum risco de cache.
**Contra:** não é instalável em Chrome/Android com a experiência de app (sem SW o critério de instalação deixa de valer em
vários navegadores) e não dá nada de offline. Não atende o §3.1.

## Decisão

Adotamos **A**, com estas regras:

1. **Manifest.** `name` e `short_name` "Vagoo", `display: standalone`, `lang: pt-BR`, `start_url: "./"` e `scope: "./"`
   **relativos** (regra 4), `theme_color` e `background_color` iguais ao token `--brand-ink` (`#070b14`), o mesmo fundo do
   ícone, para a tela de abertura sair sem emenda. Ícones 192 e 512 ("any") e 512 "maskable", gerados por
   `scripts/pwa-icons.ts` a partir do símbolo (`docs/design/marca-vagoo.md`). O iOS não lê o splash do manifest: usa o
   `apple-touch-icon` e a cor de fundo; **não geramos imagens de splash por modelo de iPhone** (custo alto, ganho pequeno).
2. **Precache só do shell estático:** HTML, JS, CSS, fontes e ícones do próprio build, com hash. **Nada mais é guardado.**
3. **Nunca cachear `/api` nem `/media`.** `navigateFallbackDenylist` exclui as duas rotas e **não há `runtimeCaching`**:
   toda resposta de API, autenticada ou não, vai à rede. Resposta com dado pessoal ou de saúde nunca toca o Cache
   Storage (LGPD Art. 11). Não guardamos nem a mídia, porque fotos de profissional e de estabelecimento passam pela mesma
   regra de "só o shell" e porque a mídia de um estabelecimento suspenso deve sumir.
4. **Atualização controlada pelo usuário** (`registerType: 'prompt'`): quando há versão nova, o app mostra "Nova versão
   disponível" com **Atualizar** e **Depois**. Nada de `skipWaiting` automático, para não trocar o shell no meio de um
   agendamento. Ao atualizar, o plugin recarrega a página; caches velhos são limpos (`cleanupOutdatedCaches`).
5. **Offline básico em português.** Com o shell no precache, a navegação funciona sem rede; os dados não. O app mostra
   um aviso fixo "Sem conexão" enquanto estiver offline, e cada tela mantém o próprio estado de erro. Não há página
   `offline.html` separada: com o shell no precache ela nunca seria servida.
6. **Instalação atrás de hook próprio** (`usePwaInstall`, regra 5): nenhum componente toca `beforeinstallprompt`,
   `matchMedia('(display-mode: standalone)')` ou `navigator.standalone`. No iOS, que não tem o evento, o hook devolve a
   instrução ("Compartilhar → Adicionar à Tela de Início"). O mesmo vale para `usePwaUpdate` e `useOnlineStatus`.
7. **Safe-area e toque.** Os avisos usam `env(safe-area-inset-*)` e alvo de 44 px (regra 6).
8. **Sem `window.location.origin` e sem cookie** (regras 2 e 3): o registro do SW usa caminho relativo.

## Consequências

### O que fica mais fácil

Instalar o Vagoo na tela inicial do celular, abrir sem barra do navegador e abrir mesmo sem rede (sem dados). Um deploy
novo chega sozinho ao shell, sem o usuário ficar preso numa versão velha, e sem trocar a versão no meio de uma ação.

### O que fica mais difícil

- Todo asset novo precisa estar no build do Vite para entrar no precache; arquivo servido fora do build não é guardado.
- O primeiro carregamento depois de um deploy ainda mostra a versão velha até a pessoa tocar em **Atualizar**.
- Teste manual de SW exige build de produção (`bun run build` e `bun run preview`): o `dev` não registra o SW.
- Como a CSP limita `worker-src 'self'`, o SW só pode vir da própria origem, o que já é o caso.

### O que passa a ser proibido

`runtimeCaching` para qualquer rota de `/api` ou `/media`; guardar no Cache Storage, IndexedDB ou `localStorage`
resposta autenticada ou com dado pessoal ou de saúde; `skipWaiting`/`clientsClaim` automático; chamar API do navegador
de PWA fora dos três hooks.

## Como saber que erramos

- Se, no navegador, a aba Application → Cache Storage listar qualquer URL de `/api` ou `/media`, a decisão 3 foi violada.
- Se uma pessoa relatar ver dado de outra após logout no mesmo aparelho, o primeiro suspeito é o cache.
- Se a verificação de instalabilidade do Chrome (DevTools → Application → Manifest) acusar falta de SW ou de ícone
  maskable. O Lighthouse não ajuda aqui: a categoria PWA saiu dele na v12.
- Se a incompatibilidade entre `vite-plugin-pwa` e uma versão futura do Vite exigir remendo recorrente, reavaliar B.

## Referências

- CLAUDE.md §3 (regras 1 a 6), §3.1 e §4.7; `docs/design/marca-vagoo.md`; `frontend/nginx.conf` (CSP e proxy).
- Nenhuma referência bibliográfica externa foi consultada para esta decisão.
