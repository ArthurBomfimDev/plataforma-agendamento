# Relatório — preparação da demonstração final (`feat/demo-publica`)

- **Branch:** `feat/demo-publica`, criada de `feat/integracao-final` em `ecf33f9`. A tag `v1.0-tcc` não foi tocada.
- **Data:** 2026-11-10 a 11. **Sem push, sem PR, sem merge.**
- **Três commits, um por assunto:** `179d3aa` (seed), `ffaab67` (PWA), `9329207` (publicação).
- **Não foi feito, por ordem:** aplicar migration em banco algum (nenhuma foi criada), rodar `tailscale`, mexer em
  credencial, mexer na pilha `booking` que estava de pé na máquina.

> Todo dado do seed é fictício e **não é evidência para o TCC** (`docs/operacao/seed-demo.md`).

---

## O que foi feito

### Parte 1 — Seed completo (`scripts/seed-demo.ts`, `scripts/seed-demo/`)

- **Passado: opção (c), aprovada.** Nenhum endpoint de bypass e nenhum relógio falsificável na API. O passado continua por
  SQL no Postgres do Docker local, em passo explícito (`--passado`, com `--historico` como sinônimo), com marcador e uma
  transação só. Tudo o que não depende do relógio passa pela API pública.
- **Fotos, vitrine e folgas pela API**, idempotentes: logotipo em todos os estabelecimentos, capa em 2 de cada 3, fotos de
  serviços e de profissionais, "mostrar foto na vitrine" ligado em metade dos serviços com foto e desligado na outra
  (o padrão da API é ligado, então o desligado é enviado de propósito), folga de um dia e férias de uma semana na equipe.
- **Imagens originais e reproduzíveis**: geradas por código (`png.ts`, só `node:zlib`) ou lidas de `scripts/seed-assets/`
  (documentado lá; `.gitignore` impede versionar foto de pessoa). Mesmo envio da interface: multipart, campo `file`, quadrado.
- **Saúde**: o consumidor concede o consentimento específico na versão vigente e marca uma consulta; 3 avaliações de um
  estabelecimento de Saúde (sem o nome do serviço); um estabelecimento de Saúde segue "em análise" para o Admin aprovar.
- **Senhas só por variável** (`SEED_PASSWORD`, `SEED_ADMIN_PASSWORD`); a checagem de saúde da API também funciona pelo
  `web` (`/api/health`), já que no ambiente final a API não tem porta no host.
- **16 testes** (`bun test scripts/seed-demo`) do que é puro: PNG válido e determinístico, escolha entre arquivo e imagem
  gerada, plano de fotos e folgas, datas.

### Parte 2 — PWA (ADR-035, Proposto)

- `vite-plugin-pwa` 2.0.0 (geração de manifest e service worker; **dependência nova**, de desenvolvimento), `registerType:
  'prompt'`, precache só do shell estático (164 entradas, 1,7 MiB), **sem `runtimeCaching`**, `/api` e `/media` fora da
  navegação do service worker (confirmado no `sw.js` gerado).
- Manifest "Vagoo", `standalone`, `start_url` e `scope` relativos, cores do token `--brand-ink`, ícones 192/512 e
  maskable gerados do símbolo (`scripts/pwa-icons.ts`).
- Três hooks próprios (`usePwaInstall`, `usePwaUpdate`, `useOnlineStatus`); nenhum componente toca a API do navegador
  (um teste trava isso). Avisos em português: sem conexão, "Nova versão disponível" (Atualizar / Depois) e instalar
  (botão, ou a instrução do iPhone).
- 49 testes novos. `lint` (só os 2 avisos que já existiam), `typecheck`, `format:check`, `test` (718) e `build` verdes.

### Parte 3 — Publicação (ADR-036, Proposto)

- **Já estava resolvido, e não foi alterado:** o nginx do `web` já proxia `/api/` e `/media/` no mesmo origin, o frontend já
  chama a API por caminho relativo, e `UseForwardedHeaders` já roda antes do limitador, com os testes `I4` e `I5`.
- `compose.demo.yaml`: só `web` (`127.0.0.1:8090`) e Mailpit (`127.0.0.1:8025`) publicam porta; banco e API, nenhuma;
  `restart: unless-stopped`; API em `Production`; `PUBLIC_ORIGIN` por variável para CORS e links de e-mail; **proxy
  confiável só na sub-rede do demo** (o `compose.yaml` confiava em três faixas privadas inteiras). Validado com
  `docker compose config`, sem subir nada.
- Aviso "Ambiente de demonstração — dados fictícios", por variável de build (`DEMO_BANNER`), com teste de vazio e de sucesso.
- `I7`: teste de integração do proxy confiável restrito (escrito e compilado, **não executado**, ver abaixo).
- `docs/operacao/publicacao-demo.md`: Windows 11, MagicDNS, HTTPS certificates, `tailscale set --hostname=vagoo`,
  `tailscale funnel --bg 8090`, `tailscale funnel status`, checklist, `tailscale funnel reset` e restauração.
- A CSP do nginx não precisou de domínio: é `'self'` em tudo, e API e mídia são da mesma origem. Cookie nenhum (token).

---

## O que NÃO foi verificado

Lista completa e marcável em `docs/verificacao-pendente.md`. O essencial:

1. **O seed nunca rodou contra uma API.** Só os testes das partes puras e a sintaxe. Em particular: se a API aceita a
   folga (`DayOff`/`Vacation` com `existingAppointments: "Keep"`) e o `PUT` de serviço com `showPhotoInShowcase`.
2. **A suíte de integração não foi executada** (sobe PostGIS e aplica migrations; havia ordem de não aplicar em banco
   algum). `I7` e os demais ainda não têm resultado nesta branch.
3. **O service worker nunca foi ativado em navegador.** No navegador embutido do app o registro falhou ("unknown error when
   fetching the script", apesar do arquivo servido com 200). **Lighthouse não foi rodado e não há número**: a categoria
   PWA não existe mais no Lighthouse desde a v12.
4. **Conferência visual** (390 px, claro e escuro) dos avisos do PWA, da faixa de demonstração e das fotos geradas.
5. **Instalação real no celular** (Android e iPhone). Não há splash de iOS (decisão registrada no ADR-035).
6. **O Funnel de fato ligado**: o que ele envia de `X-Forwarded-For` e `X-Forwarded-Proto`, qual origem o nginx enxerga,
   banda com várias pessoas. Sem o primeiro cabeçalho, o limite de 10 logins por minuto vira um só para todos.
7. `compose up` do demo (só a validação de configuração foi feita) e a colisão da sub-rede `172.28.0.0/24`.

---

## Decisões que ficaram para o Arthur

| # | Decisão | Minha recomendação |
|---|---|---|
| 1 | Aceitar ou ajustar **ADR-035** e **ADR-036** (ambos Proposto) | Revisar, em especial a regra "nunca cachear `/api` nem `/media`" e o proxy confiável mínimo |
| 2 | Aprovar a **dependência nova** `vite-plugin-pwa` (+ `workbox-build` e `workbox-window` por baixo) | Aprovar; a alternativa B (SW à mão) está no ADR |
| 3 | O SQL do passado ficou **dentro do `seed-demo.ts`**, em seção marcada, e não em arquivo separado: separar exigiria mover ~450 linhas sem poder rodá-las | Separar depois, com o seed rodando |
| 4 | As **avaliações** continuam por SQL mesmo sem `--passado` (já era assim) | Manter: sem elas a demo não mostra reputação |
| 5 | A faixa de demonstração é **em fluxo**, no topo, e os avisos do PWA são **fixos no topo**: podem se sobrepor a barras fixas | Conferir no celular antes de abrir; se incomodar, trocar para rodapé |
| 6 | O aviso de demonstração é de **build** (`DEMO_BANNER`): trocar o texto exige reconstruir o `web` | Aceitar; runtime exigiria um `config.js` servido pelo nginx |
| 7 | **Rodar a suíte de integração** (`I4`, `I5`, `I7`) e o seed numa pilha isolada | Fazer antes de abrir o Funnel |
| 8 | **Folgas e férias só depois dos 14 dias** do histórico (o histórico não conhece bloqueios) | Manter; senão cairiam sobre atendimentos marcados |
| 9 | Banco e API **sem porta no host** no demo: o seed usa o `web` (`API_URL=http://127.0.0.1:8090`) | Manter; se preferir depurar a API direto, republique a porta só em `127.0.0.1` |
