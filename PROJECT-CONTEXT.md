# PROJECT-CONTEXT.md

> Contexto compartilhado entre sessões (Claude, Claude Code, Figma).
> Leia este arquivo primeiro; só abra os documentos longos se a tarefa exigir.
> **Última atualização:** 2026-11-10 (rodada de finalização) · Fase: **integração e verificação** · Branch de trabalho: `feat/integracao-final` (junta o PR #58, o login novo do Rafael e a rodada de 10/11).
>
> **O GitHub está com a cobrança bloqueada:** sem CI e sem PR. A prova é **local** (Docker, testes e navegador) e está em `docs/verificacao-final-2026-11-10.md`. Nada foi mergeado em `main` nesta rodada.
>
> Substitui todas as versões anteriores (03/09, 04/09, 08/09, 10/09, 27/10, 04/11). Existe **um** `PROJECT-CONTEXT.md`, na raiz.
> **Este arquivo é índice e retrato do estado, não a fonte de verdade.** Em caso de conflito:
> - **entre documentos, vale o mais recente** — pela data de atualização, não pelo tipo. Uma decisão de 22/09 prevalece sobre uma ADR de 09/09; a R5 de 09/10 prevalece sobre qualquer paleta anterior. O documento antigo recebe errata ou é substituído, nunca fica valendo em silêncio;
> - **o que existe** → vale o código e as migrations;
> - quando o código divergiu da decisão **para melhor**, a divergência vira documento novo (ADR) — e por ser o mais recente, passa a valer (§2.1). Quando divergiu **para pior**, é dívida e entra no §12.
>
> **Números deste arquivo foram contados no código em 10/11**, não copiados de versão anterior: módulos, entidades, migrations, ADRs, rotas e testes.

---

## 1. O que é

Marketplace SaaS de descoberta e agendamento de serviços presenciais, web e mobile (PWA). Dois lados: o consumidor busca e agenda; o estabelecimento gerencia agenda, catálogo e equipe. Referência **estrutural** no iFood, identidade própria.

**TCC** de Arthur Bomfim e Rafael Ernandes — FATEC Garça, ADS. Orientadora: Prof.ª Dr.ª Cláudia Maria Bernava Aguillar. Formato: **relatório técnico-científico**. Defesa em **dezembro/2026**.

**Marca: Vagoo** — `AGENDE · ESCOLHA · VÁ`. Fechada em 09/10. "Agendeaki", "Agendify" e "Kairon Place" estão descartados.
⚠️ Repositório (`plataforma-agendamento`) e namespace (`Booking.*`) continuam com nome neutro — ver pendência K.

| Pessoa | GitHub | Frente |
|---|---|---|
| Arthur Bomfim | `ArthurBomfimDev` | Backend, arquitetura, banco, infra |
| Rafael Ernandes | `RafaelErnandes` | Frontend, design system |

---

## 2. Estado atual (10/11)

Repositório público: `github.com/ArthurBomfimDev/plataforma-agendamento` · `main` protegida, 4 checks obrigatórios, CODEOWNERS com os dois em todo caminho. **`main` está atrás da `feat/integracao-final`**: o que está descrito abaixo vive nessa branch e na `fix/correcoes-teste-0511` (PR #58, em draft), ainda sem merge.

### Backend — 277 arquivos C#, ≈ 15,5 mil linhas (sem migrations), 26 controllers, 98 casos de uso

**9 módulos** (a lista `ArchitectureConventions.Modules`) e **22 entidades** de domínio. O modelo de 22/09 previa 19; as 3 a mais são `BusinessInvitation`, `BusinessReport` e `ProfessionalRemovalRequest`, e o conjunto atual inclui as de avaliação e outbox que o plano separava por fase.

| Módulo | Entidades | Situação |
|---|---|---|
| Identity | `User`, `RefreshToken`, `UserToken` | ✅ Argon2id, JWT, refresh rotativo com detecção de reuso, **e-mail confirmado obrigatório** no login e no refresh (`403 identity.email_not_confirmed`), reenvio sem enumeração, recuperação de senha, troca de contexto ativo, "Minha conta" (nome e senha). `GET /api/users/me` traz `hasCustomerProfile` e os estabelecimentos da conta. Papel de Admin só por SQL/seed (ADR-020) |
| Tenancy | `Business`, `BusinessMembership`, `BusinessInvitation`, `BusinessReport` | ✅ Cadastro em assistente (documento CPF ou CNPJ, "Sou MEI", endereço, ponto confirmado pelo dono, responsável em Saúde, termos), ciclo `Draft → PendingReview → Active → Suspended` com publicação na hora em Beleza e análise em Saúde (ADR-028), política de agendamento, busca com `ST_DWithin`, **Admin** (aprovar, recusar, suspender, reinstalar, denúncias), **convites de equipe** com limite de 15 vagas e **especialidade** (ADR-029, ADR-033), papel **Atendente** (ADR-030), sair do estabelecimento |
| People | `Customer`, `Professional`, `ProfessionalRemovalRequest` | ✅ Perfil público sempre ligado, com declaração do dono para registros sem conta (ADR-031); foto do profissional; página pública; pedido de remoção de perfil, tratado pelo Admin. **O profissional só nasce por convite aceito** (ou o perfil do próprio dono, `isMe`) — ADR-033 |
| Catalog | `Service`, `ServiceProfessional` | ✅ Serviço com foto (ADR-023) e "Mostrar foto na vitrine" (`show_photo_in_showcase`) |
| Availability | `WorkSchedule`, `ScheduleException`, `Holiday` | ✅ Jornada semanal, bloqueios com prévia dos agendamentos afetados (manter ou cancelar, tudo ou nada), feriados fixos e móveis (Páscoa), calendário de vários dias |
| Scheduling | `Appointment`, `AppointmentEvent` | ✅ Pedido, confirmar, recusar, cancelar, concluir, falta, balcão; **409 com horários alternativos**; constraint de exclusão real (§8); chave de idempotência; lock por profissional (ADR-019) |
| Reputation | `Review`, `RatingSummary` | ✅ Avaliação de atendimento concluído (30 dias para avaliar, 7 para editar), média só com 3 ou mais, busca por nota, **denúncia pelo dono e moderação pelo Admin** (ocultar, reexibir, descartar). O dono não responde (ADR-032) |
| Compliance | `ConsentRecord`, `SensitiveAccessLog` | ✅ Consentimento versionado que **bloqueia** o agendamento em Saúde, com texto servido pela API, revogação e tela; log de acesso sensível. **Texto jurídico em rascunho** |
| Notifications | `OutboxMessage` | 🟡 E-mail pelo outbox na mesma transação (ADR-021): confirmação e redefinição de conta, convite, pedido novo, confirmado com `.ics`, recusado, cancelado, expirado, "Como foi?" após o atendimento. **Não existem** lembretes antes do horário nem notificação in-app |

- **18 migrations:** `InitialIdentity`, `AddTenancy`, `AddCoreModules`, `AddPlatformAdmin`, `AddOutbox`, `ConfirmExistingAccounts` (só dado), `AddImages`, `AddOnboardingFields`, `AddBusinessReport`, `AddBusinessInvitation`, `ReplaceProfessionalConsentWithDeclaration`, `AddServiceImage`, `AddProfessionalRemovalRequest`, `AddReputation`, `AddBusinessDocumentType`, `AddReviewReport`, `AddServiceShowPhotoInShowcase`, `AddInvitationSpecialty`. **As duas últimas estão NÃO APLICADAS** fora do ambiente de teste; SQL e backup em `docs/verificacao-pendente.md`. PostGIS e `btree_gist` habilitados.
- **Constraint de exclusão real** em `scheduling.appointment` (§8). Filtro global de tenant no EF Core. **RLS não implementado.**
- **Testes (10/11, locais):** `Booking.ArchitectureTests` **28**, `Booking.UnitTests` **419**, `Booking.IntegrationTests` **172** (API real contra PostgreSQL + PostGIS em banco criado por execução, incluindo concorrência, isolamento de tenant, idempotência, Admin, convites, avaliações, imagens, e-mail). `dotnet format` limpo, 0 avisos de build.
- **Rotas:** índice completo, conferido no código, em `docs/produto/contrato-api-frontend.md` §4.21.

### 2.1 Onde o código ficou melhor que o planejado — registrar, não reverter

| O que o plano dizia | O que o código faz | Por que é melhor | Onde registrar |
|---|---|---|---|
| `blocked_range` como coluna gerada | Colunas gravadas `blocked_starts_at`/`blocked_ends_at` + `tstzrange` dentro da constraint + check de coerência | A versão planejada **não roda**: coluna gerada exige `IMMUTABLE` e `timestamptz - interval` é `STABLE` | ADR-017 + errata no doc de 22/09 e no `DOCUMENTO-GERAL` |
| — | `Appointment.IdempotencyKey` | Duplo clique ou reenvio por rede ruim não gera dois pedidos — mesmo problema da dupla reserva, do lado de quem faz a requisição | Modelo de domínio + capítulo técnico |
| — | `Appointment.IsSensitive` gravado no agendamento | O regime LGPD acompanha o agendamento mesmo se a categoria do estabelecimento mudar depois | Modelo de domínio + capítulo de conformidade |
| Lista de raízes de namespace (`ModuleRoots`, emenda da ADR-010) | Uma regex única, `ModuleNamespacePattern`, sobre a lista `Modules` (já com os 9, incluindo `Notifications`) | Cobre qualquer pasta de tipo nova sem manutenção da lista | Texto da emenda da ADR-010 corrigido em 26/10. ⚠️ O teste de módulo desconhecido previsto na emenda **não existe** — lacuna registrada na ADR-010 |
| `Category` em `Base/` (ADR-010, regra 2) | `EntitiesAllowedInBase = [Service, WorkSchedule]` | `Category` virou enum | Emenda da ADR-010, mergeada em 26/10 |
| — | `AppointmentSource`, `CancellationParty`, `BusinessNotes` | Rastreia de onde veio o pedido (app ou balcão) e quem cancelou — insumo do histórico de no-show e dos relatórios | Modelo de domínio |

A branch `docs/modelo-dominio-revisado` (4 commits de 02/10: modelo de domínio revisado com 19 entidades, emenda da ADR-010, `CLAUDE.md` revisado) foi mergeada em 26/10, na correção de documentação.

### Frontend — React 19 + TS + Vite, Bun, Tailwind v4, TanStack Query, Zustand

521 arquivos-fonte, **85 arquivos de teste e 673 casos** (Vitest, sem jsdom na maioria: renderização em HTML de servidor; o login do Rafael traz `jsdom` para testes de interação). Typecheck, lint (2 avisos antigos), Prettier e build limpos.

- **Camada única de acesso à API em `src/api`** (`base`, `services`, `models`): token em vez de cookie, renovação deduplicada, conversão de fuso pelo IANA do estabelecimento; sem `VITE_API_BASE_URL` o app usa `/api` e `/media` na própria origem. ⚠️ O `CLAUDE.md` §3 ainda cita `src/lib/api` (a regra é a mesma; só o caminho mudou).
- **Consumidor:** Home, busca (raio, cidade, termo sem acento com sinônimos, nota, preço), estabelecimento (com nota e página de cada profissional), escolher profissional, calendário, "Revise seu pedido" (consentimento de Saúde, texto de cancelamento com o prazo do estabelecimento), pedido enviado, "Meus agendamentos" (com imagem do estabelecimento), avaliar, Minha conta (consentimentos, tema), **"Para estabelecimentos"**.
- **Cadastro do estabelecimento sem conta prévia** (ADR-034): passo "Sua conta", confirmação do e-mail, volta ao assistente por `next` com lista fechada; assistente com documento, endereço (CEP, "Buscar CEP", localização com "Ver no mapa" e confirmação do dono), responsável (Saúde) e termos.
- **Painel** (390 px e desktop): agenda do dia, semana e mês; pedidos; **Serviços** (foto, "Mostrar foto na vitrine"), **Profissionais** (convidar, editar, serviços), **Equipe** (contas com papel), Jornadas e bloqueios, Fotos (recorte 1:1 com pré-visualização circular), Configurações, Avaliações (e denúncia), Folgas e bloqueios e **Meu perfil** (profissional e atendente). O **Atendente** vê a agenda em lista cronológica com o profissional em cada item.
- **Convite** (`#/convite`): criar conta com o e-mail do convite (já confirmado pelo token), entrar, ou aceitar logado; quem tem conta **sem e-mail confirmado** volta ao convite depois de confirmar (destino guardado no aparelho, 48 h).
- **Admin** (`#/admin/estabelecimentos`): estabelecimentos, denúncias, remoções de perfil, avaliações denunciadas.
- **Tema claro e escuro** com alternador em toda tela (barra lateral, barra superior do painel no celular, Admin, cadastro).
- **Rotas:** 43 elementos de rota em `src/router/route.tsx`.
- **Ainda com mock:** lembretes na tela "Pedido enviado" (`MOCK_REMINDER_HOURS`, hoje 24 h e 3 h; a decisão vigente é 24 h e 1 h, §10) e o prazo de avaliação em "Meus agendamentos" (`MOCK_REVIEW_WINDOW_DAYS`).
- **Não existem:** remarcação (sem backend), histórico do consumidor no pedido, relatórios, mapa com pino arrastável.

### Infra local

`compose.yaml` com `postgis/postgis:17-3.5`, migrations, API, frontend e Mailpit. `scripts/seed-demo.ts` cria **30 estabelecimentos** (26 Beleza, 4 Saúde), a consumidora, o Admin e a equipe do Estúdio Duartina (dono, profissional, atendente e dois convites pendentes, um com especialidade); os 3 primeiros ganham agenda de hoje e de amanhã. Com `--historico`, 60 dias de passado e 14 de agenda futura. A pilha de verificação usa `COMPOSE_PROJECT_NAME` próprio e portas alternativas (`WEB_PORT`, `API_PORT`, `DB_PORT`, `MAILPIT_PORT`), para não tocar a pilha do dia a dia.

**Demonstração pública** (`docs/operacao/demo-publica.md`): `scripts/demo-publica.ps1`/`.sh` sobem a pilha com a API em `Production` e o `cloudflared` (perfil `tunnel`, endereço `trycloudflare.com` que muda a cada subida), publicando só o `web`; API, banco e Mailpit seguem em `127.0.0.1`. A API confia no `X-Forwarded-For` só das redes do Docker e recusa a chave JWT de exemplo fora de Development; o seed recusa a senha padrão fora de Development. **Não testado com Gmail real:** o `.env` ainda não tem a senha de app (pendência V).

### Design (Figma `E2M0TJehjcrSk4uaXlHI0s`)

Paleta **R5** (Vagoo, azul), modos Light e Dark, 11 component sets, ~50 telas em 8 páginas (autenticação, consumidor mobile e desktop, painel mobile, onboarding, clones Dark). Detalhe em `docs/design/`. Telas novas de 10/11 (Para estabelecimentos, Sua conta, Equipe) **não têm frame no Figma**; seguem os tokens.

---

## 3. Documentos

| Arquivo | Conteúdo |
|---|---|
| `docs/DOCUMENTO-GERAL.md` | Visão integral do projeto para quem chega agora — problema, escopo, arquitetura, método |
| `docs/produto/decisoes-produto-blocos-1-2.md` | Glossário, núcleo, atores, busca, cortes (03/09) |
| `docs/produto/modelo-de-dominio.md` | Modelo de domínio revisado (19 entidades, 9 módulos), com o que o código acrescentou |
| `docs/produto/decisoes-localizacao-notificacao-modelo.md` | **Obrigatório antes de código de domínio.** 19 entidades, 9 módulos, idade, CPF, geocodificação, notificação (22/09) |
| `docs/produto/contrato-api-frontend.md` | Contrato da API com o frontend; §4.21 é o **índice de todas as rotas**, conferido no código |
| `docs/produto/limitacoes-e-trabalho-futuro.md` | O que não existe e o que foi medido: busca de endereço, conta sem perfil de consumidor, cancelamento, remarcação |
| `docs/verificacao-pendente.md` | Roteiro do que só se confere com olho humano; **SQL das migrations não aplicadas e backup** |
| `docs/verificacao-final-2026-11-10.md` | Resultados da verificação local de 10/11 |
| `docs/integracao-rafa-10-11.md` | Inventário das branches do Rafael e os conflitos da mescla |
| `docs/design/eixo-paleta-tipografia.md` | Eixo, paleta R5, tipografia, tokens |
| `docs/design/componentes-e-telas.md` | Componentes, telas, padrões de adaptação |
| `docs/design/marca-vagoo.md` | Uso do logotipo e do símbolo |
| `docs/decisions/` | ADRs (34) |
| `docs/legal/` | Texto do consentimento de Saúde e termo do profissional (rascunhos, sem revisão jurídica) |
| `docs/contexto/*` | Material original, histórico. ⚠️ `05_Agendeaki_Pitch_TCC.md` **não usar como fonte** |

---

## 4. Decisões fechadas — técnicas

| # | Decisão |
|---|---|
| 1 | Frontend **React + TypeScript + Vite**. Não haverá Next.js |
| 2 | **Bun** como gerenciador de pacotes e executor de scripts; **Vite continua o bundler** (ADR-011) |
| 3 | Backend **C# / ASP.NET Core (.NET 10)** |
| 4 | **PostgreSQL + PostGIS + `btree_gist`** — as extensões são requisito duro de hospedagem |
| 5 | **Monólito modular** em monorepo; fronteira de módulo verificada por teste de arquitetura, não por projeto físico (ADR-007, ADR-010) |
| 6 | **Código e domínio em inglês**; produto, commits e TCC em português |
| 7 | **GitHub Projects** como Kanban |
| 8 | **Pagamento fora do MVP** — só a porta `IPaymentGateway` |
| 9 | **Nunca** haverá prontuário, exame, laudo ou anexo clínico |
| 10 | Verticais: **Beleza** funcional + **1 tenant de Saúde** de agendamento |
| 11 | **PWA primeiro**; Capacitor e Tauri consomem o mesmo build |
| 12 | **Multi-tenancy por coluna** `business_id`, banco e schema únicos, filtro global no EF; RLS depois do MVP (ADR-003) |
| 13 | **Dupla reserva** prevenida por `EXCLUDE USING gist`; Redis e lock distribuído rejeitados (ADR-005) |
| 14 | **Slot é cálculo, não tabela** (ADR-006) |
| 15 | **Snapshot** de preço, duração, nome do serviço e buffers no `Appointment` |
| 16 | **Guid v7** em toda entidade |
| 17 | **Sem AutoMapper e sem MediatR**; conversão manual em `Converter/`; Outbox na mesma transação como fila |
| 18 | **Categoria é enum** (`Beleza`, `Saude`) — `RequiresSensitiveHandling` não pode ser desligado por `UPDATE` |
| 19 | **Conta única** (`User`) para todos; `Customer` e `Professional` são perfis; troca de contexto explícita na interface |
| 20 | Dinheiro em centavos inteiros; data em UTC (`timestamptz`); fuso IANA por `Business` |

### 4.1 Paridade mobile do painel (ADR-009)

Todas as telas do painel têm versão de 390px. **Decisão de inclusão digital**: quem trabalha sozinho tem celular e não tem computador. Alvo de toque de 44px em todo controle. A agenda do dia mobile é redesenho: um profissional por vez, seletor horizontal, lista cronológica.

### 4.2 As 6 regras de empacotamento

Camada única de API · nunca `window.location.origin` · token em vez de cookie · rotas relativas · recurso nativo atrás de hook próprio · mobile-first com safe-area. Detalhe no `CLAUDE.md`.

---

## 5. Decisões fechadas — produto

### Glossário — a palavra "cliente" está banida

`Business` (estabelecimento, tenant) · `Owner` · `Professional` · `Customer` (consumidor) · `Service` · `Appointment` · `Availability`. Quarto papel: `Admin` da plataforma; o papel `Attendant` (atendente) foi acrescentado em 04/11 (ADR-030). `Owner`, `Professional` e `Attendant` são papéis, não tipos de conta.

### Identidade

- **Idade mínima de 18 anos.** Agendamento para menor é feito pela conta de um adulto, com nome de quem será atendido no próprio agendamento (reaproveita `WalkInName`/`WalkInPhone`).
- **CPF nullable**, pedido só no 1º agendamento de categoria sensível, cifrado. Verificação de identidade é porta (`IIdentityVerificationProvider`), sem adaptador.
- `SocialName` opcional, exibido sempre que existir.
- Perfil público do profissional: **sempre ligado** (ADR-031, 04/11): nome, foto, especialidade e apresentação; quem não tem conta precisa da declaração do dono. Substitui o consentimento de 22/09.

### Agendamento

| Regra | Valor |
|---|---|
| Slots | Derivados da duração; granularidade por serviço, padrão 15 min |
| Jornada | Semanal recorrente, configurada pelo estabelecimento |
| Buffer | Antes/depois, no `Service`, padrão 0 |
| Antecedência mínima | 2 h, configurável |
| Horizonte | 60 dias, configurável |
| Serviços por agendamento | Um. Combo vira `Service` próprio |
| Capacidade | 1 atendimento por profissional por vez |
| Confirmação | **Aprovação manual por padrão**; `AutoConfirm` configurável |
| Pendente | Expira em 12 h ou na antecedência mínima |
| Cancelamento | Padrão 24 h, configurável entre 0 e 48 h. **Passado o prazo não há pedido nem aprovação no sistema:** o consumidor fala com o estabelecimento |
| Balcão | Mesma agenda, nasce `Confirmed`; `CustomerId` nullable |
| Ocupam o horário | `Pending`, `Confirmed`, `Completed`, `NoShow` |
| Liberam o horário | `Cancelled`, `Rejected`, `Expired` |

### Feriados

Calculados (fixos + móveis pela Páscoa), sem API. Padrão indisponível; a empresa pode abrir. O consumidor vê que é feriado mesmo quando a empresa abre.

### Onboarding e verificação

`Draft → PendingReview → Active → Suspended`. Checklist: CNPJ/CPF válido (dígito verificador, offline; **toda categoria aceita CPF ou CNPJ**, ADR-028), **endereço com ponto confirmado pelo dono**, ≥1 serviço, ≥1 profissional, ≥1 jornada, ≥1 foto. Beleza publica na hora; Saúde vai para análise do `Admin`, sem upload de documento. Quem cadastra só o estabelecimento começa pelo passo "Sua conta" (ADR-034).

### Localização

- Geocodificador dá o palpite, **o dono confirma o ponto**. Só entra na busca por raio quem tem `LocationConfirmedAt`.
- `IGeocodingProvider`: Nominatim no TCC; provedor pago em produção (ADR-022), sem `Autocomplete` (proibido pelo Nominatim público). **A tela do dono para confirmar o ponto existe desde 05/11** (passo Endereço do assistente), sem mapa embutido: a CSP bloqueia mapa de terceiro, então há o link "Ver no mapa" e a confirmação por texto. O provedor acerta o número em poucos casos de Garça (2 de 5 medidos em 10/11).
- Posição do consumidor pedida no momento de uso, com três saídas (permitiu, negou, falhou). Uso transitório, sem log. `useGeolocation()`, seletor com aviso antes da permissão, CEP e texto; a referência escolhida fica no `localStorage` com o ponto arredondado.
- Busca: `ST_DWithin` → texto → paginação → **só então** slots da página.

### Avaliação

Só de `Completed`, uma por agendamento, prazo de 30 dias para avaliar e 7 para editar. Avalia o estabelecimento, com nota opcional do profissional. O dono denuncia, o Admin modera. **O dono não responde** (trabalho futuro; a decisão de 22/09 previa que respondesse — ver §10.1).

### Notificações (fora do recorte de entrega, decisão mantida)

E-mail + in-app; WhatsApp é trabalho futuro. Lembretes configuráveis por estabelecimento, padrão **24 h e 1 h**. `.ics` na confirmação. `Business.ArrivalInstructions`. Outbox na mesma transação.

### Matriz de permissões

Ver `docs/DOCUMENTO-GERAL.md` §4 e `docs/produto/contrato-api-frontend.md` §4.12 (Dono, Atendente, Profissional).

---

## 6. Design system

- **Paleta R5 (Vagoo):** marca `#3B82F6` (`primary/500`) para identidade, foco e seleção; **fundo de botão `#2563EB`** (`primary/600`, 5,17:1). Neutros **slate frio**. Fundo escuro `#070B14`.
- ⚠️ **Hex mortos:** `#0F6E83`, `#0B7690`, `#0C7D99`, `#4FC3DE`, `#7E7E7B`, `#141413`, `#8C867B`. Se aparecerem em prompt ou documento, estão desatualizados.
- **IBM Plex Sans**, família única. Campo de formulário 16px.
- Status em dois canais (cor + forma/ícone); três matizes.
- Gradiente ciano → azul só no logotipo, nunca em interface.
- **Regra de geometria:** aplicar estilo nunca encolhe alvo de toque abaixo de 44px.
- Modos **Light e Dark**, implementados no Figma e no código.
- Azul é a cor mais disputada da categoria: risco declarado no capítulo de limitações.

---

## 7. TCC — método e evidência

**Design Science Research** (⚠️ pendente de aprovação da orientadora).

- **H1** — ≥ 85% concluem um agendamento sem ajuda, na primeira tentativa.
- **H2** — SUS médio ≥ 68.
- **H3** — o prestador configura serviço, profissional e jornada sozinho em < 10 min.

As 4 hipóteses originais são de mercado e vão para limitações. Limiares declarados antes da coleta. TCLE assinado.

| ID | Meta | Medição | Situação |
|---|---|---|---|
| RNF-01 | Busca com slots p95 ≤ 800 ms, 30 empresas | k6 | ✅ **292 ms no p95** (busca + horários da 1ª página, 10 VUs, local, 27/10). A tela de resultados usa a busca desde a 6C, sem os horários por resultado que o cenário mede. `docs/tcc/evidencias/rnf-01-busca.md` |
| RNF-02 | Disponibilidade p95 ≤ 200 ms | Teste cronometrado | ✅ **dia 12 ms, calendário de 14 dias 58 ms no p95** (profissional mais ocupado do seed, 10 VUs, local, 27/10). `docs/tcc/evidencias/rnf-02-disponibilidade.md` |
| RNF-03 | Zero dupla reserva sob 50 requisições concorrentes | Teste de integração | ✅ **Atendido nas condições medidas** (local, 27/10, uma instância da API): zero dupla reserva contra o endpoint real; com o lock por profissional (ADR-019), 20 de 20 execuções aprovadas, sem 500 e sem rodada sem vencedor. Custo: corrida de 50 de ≈ 180 ms para ≈ 480 ms (p50). Caminho do CI executado localmente e no GitHub Actions (PR #14: integração 20/20). `docs/tcc/evidencias/rnf-03-dupla-reserva.md` |
| RNF-04 | Lighthouse mobile ≥ 85 perf, ≥ 95 a11y | CI | ⬜ |
| RNF-05 | Busca → confirmação em ≤ 4 passos | Contagem | 🟡 Fluxo existe, contar |
| RNF-06 | Argon2id, TLS, zero dado sensível em página pública | Checklist | ✅ checklist verificado item a item (código e testes I1–I3); cabeçalhos de segurança e HSTS acrescentados. TLS em produção ⚠️ depende da hospedagem. Lacunas na pendência S. `docs/tcc/evidencias/rnf-06-seguranca.md` |

**Dados de demonstração:** 30 estabelecimentos na mesma cidade, coordenadas reais, 2 verticais, 3–5 profissionais, 60 dias de histórico. Script versionado e reexecutável.

---

## 8. Constraint de exclusão — texto implementado

O SQL dos documentos de setembro usava **coluna gerada**. Não funciona: `timestamptz - interval` é `STABLE` e coluna gerada exige `IMMUTABLE`. O implementado grava o intervalo bloqueado em colunas comuns, com check de coerência:

```sql
-- colunas gravadas pela aplicação: blocked_starts_at, blocked_ends_at
-- CHECK ck_appointment_blocked_range: blocked_starts_at <= starts_at AND blocked_ends_at >= ends_at
ALTER TABLE scheduling.appointment
  ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (
    professional_id WITH =,
    tstzrange(blocked_starts_at, blocked_ends_at, '[)') WITH &&
  ) WHERE (status IN ('Pending', 'Confirmed', 'Completed', 'NoShow'));
```

⚠️ Os nomes dos estados no `WHERE` precisam bater com `AppointmentStatus`. Renomear no C# sem migration desliga a trava em silêncio.

---

## 9. Dentro e fora do MVP

**Dentro** (existe no código, §2): busca geográfica e por termo; agendamento com aprovação do estabelecimento; agenda e pedidos do painel; catálogo, equipe com convite, jornada e bloqueios; cadastro do estabelecimento com publicação por categoria; Admin; avaliações com moderação; consentimento de Saúde; e-mail pelo outbox; tema claro e escuro; paridade mobile do painel.

**Fora do MVP:** chat · posts e feed · pagamento, Pix, split, carteira, caução · planos com cobrança · estoque (vira `SuppliesNote`) · convênio com lógica · promoções · recomendação por IA · WhatsApp · indicação · categorias além de Beleza e Saúde · profissional em várias empresas · recursos compartilhados · atendimento domiciliar e online · vídeo hospedado · upload de documento · Tauri · virtual scroll.

**Fora do recorte desta entrega, declarados como trabalho futuro:** remarcação, pedido de cancelamento fora do prazo, lembretes e notificação in-app, resposta do dono às avaliações, relatórios, mapa com pino arrastável, PWA instalável completo, RLS.

---

## 10. Contradições resolvidas — não reabrir

| Origem | Resolução |
|---|---|
| Pitch: React Native + Node/NestJS + AWS | Descartado. ADR-002 (📝 Proposto, 26/10) |
| Pitch: Pix, split, carteira | Fora do MVP |
| Documento mestre: Trello | GitHub Projects |
| Gemini: 6 categorias, convênio funcional, prontuário, uptime 99,8%, Redis | Todos rejeitados |
| Inspiração visual no iFood | Só estrutural |
| Autoconfirm por padrão | Aprovação manual é o padrão |
| "Vite vai sair" | Vite fica |
| Painel só desktop | Revogado (ADR-009) |
| Modo escuro fora de escopo | **Revogado.** Implementado no Figma (R4) e no código (10/10) |
| Proibição de azul corporativo | **Revogada na R5** — a marca é azul |
| Coluna gerada `blocked_range` | Não funciona; colunas gravadas (§8) |
| 17 entidades / 8 módulos | **19 entidades / 9 módulos** (22/09) |
| `Category` como tabela | Enum |
| Lembretes 24 h + 3 h | 24 h + 1 h, configuráveis |

### 10.1 Resolvidas depois de 27/10 — não reabrir

| Origem | Resolução |
|---|---|
| 19 entidades (22/09) | **22 entidades** no código (10/11), contadas em `Domain/Entity/Module`. O modelo de domínio de 22/09 recebe errata na próxima revisão desse documento |
| Profissional cadastrado pelo dono, sem login (7D) | **Removido.** O profissional só nasce quando aceita um convite; o dono cria só o próprio perfil (`isMe`). ADR-033, aceita pelo Arthur em 10/11 |
| Perfil completo do profissional só com consentimento (22/09) | **Perfil sempre público**, com declaração do dono para registros sem conta (ADR-031) |
| Pendência R: colaboradores com login e o `SeatLimit` | **Resolvida:** convite por e-mail, limite de 15 vagas contando contas e convites pendentes, papel Atendente (ADR-029, ADR-030) |
| Documento: CNPJ para uma categoria e CPF para outra | **Versão B:** toda categoria aceita CPF ou CNPJ; "Sou MEI" é declarado e não conferido (ADR-028, 04/11) |
| "Avaliação sem edição; o dono responde" (§5 de 22/09) | O código permite **editar por 7 dias** e **o dono não responde**; o dono denuncia e o Admin modera (ADR-032) |
| "A tela do dono para confirmar o pino ainda não existe" | **Existe** desde 05/11, no assistente de cadastro, sem mapa embutido (CSP) |
| Cancelar fora do prazo "só com aprovação do estabelecimento" | **Não existe aprovação:** o texto manda falar com o estabelecimento (10/11) |
| Perfil de consumidor obrigatório no cadastro | Quem cria a conta pelo assistente de estabelecimento ou pelo convite **não tem** perfil de consumidor. Resolvido em 10/11: tela "Completar cadastro" (pendência Y) |
| `src/lib/api` | `src/api` (7H) |

---

## 11. Pendências abertas

| # | Pendência | Bloqueia | Quem |
|---|---|---|---|
| **F** | **Comitê de Ética + aceitação do DSR + recorte etário de 18 anos** | Coleta com participantes | Orientadora |
| **E** | **Confirmação do recorte de entrega** (§12) | Planejamento até a entrega | Orientadora + autores |
| G | Hospedagem (ADR-008, revisada em 27/10 e 31/10): **Docker Compose como unidade de implantação**, banco em contêiner; VPS paga, VM do crédito de estudante ou máquina própria por Cloudflare Tunnel. Neon e Heroku descartados. O caminho da máquina própria com túnel rápido funciona (guia `docs/operacao/demo-publica.md`). **Provedor final em aberto** | Deploy da demonstração | Arthur |
| V | **E-mail real pelo Gmail**: compose e API prontos; falta preencher o bloco do Gmail no `.env` (senha de app) e repetir o teste de recuperação de senha conferindo `processed_at` | Cadastro novo pela demonstração pública | Arthur |
| I | ✅ Conta Azure for Students criada (27/10): US$ 100 até 27/10/2027 | — | — |
| **K** | **Nome técnico:** renomear repositório e `Booking.*` para Vagoo, ou manter neutro e registrar | Consistência | Ambos |
| L | Colisão de marca: **Vagaro** (agendamento de salão) — registrar como risco ou consultar INPI | Uso comercial pós-TCC | Ambos |
| M | Skills ainda com prefixo `agendeaki-` | Nada técnico; ruído | Arthur |
| N | Marca: tiles do ícone de app, favicon, área de proteção | PWA instalável | Rafael |
| O | ✅ Deadlock `40P01` e timeout sob disputa: lock por profissional (ADR-019, `Proposto`). 20 de 20 execuções aprovadas | — | Arthur (aceitar a ADR-019) |
| P | ✅ Mesma `IdempotencyKey` simultânea devolve o agendamento vencedor | — | Arthur (revisar) |
| S | Lacunas de segurança do RNF-06. **Corrigidas:** token de e-mail fora do log em todo ambiente; `TenantContextExtensions` morto removido. **Abertas:** o cadastro revela e-mail existente (409; a resposta neutra com aviso ao dono ficou de fora: o aviso precisa de limite por conta); sem bloqueio por conta no login. `rnf-06-seguranca.md` §2 | Produção | Arthur |
| T | Agenda do dia. **Feito:** semana e mês, filtros, bloqueios pela tela de Jornadas e bloqueios, lista cronológica do Atendente. **Falta:** remarcação (sem backend), bloqueio desenhado na grade, histórico do consumidor no pedido | Painel completo | Arthur + Rafael |
| U | Lembretes prometidos na tela "Pedido enviado". **Decidido (27/10): implementar**, mas **não existe código de lembrete**; a tela ainda usa `MOCK_REMINDER_HOURS = [24, 3]` | Coerência da demonstração | Arthur + Rafael |
| R | ✅ Colaboradores com login: resolvida (§10.1) | — | — |
| Q | ✅ **Decidido (27/10, Arthur):** o log de acesso sensível registra leitura por terceiro; o consumidor criar o próprio pedido não é leitura e não gera entrada | — | — |
| **W** | **Duas migrations NÃO APLICADAS:** `AddServiceShowPhotoInShowcase` (commit `8c98c9c`) e `AddInvitationSpecialty` (commit `f0e988a`). SQL e procedimento de backup em `docs/verificacao-pendente.md`. **Migration exige revisão humana** | Banco do Arthur | Arthur |
| **X** | **Autenticação: revisão humana** da ADR-033 (aceita) e da ADR-034 (proposta): `next` com lista fechada e destino pós-login guardado no aparelho. **Decidido (10/11):** o convite continua confirmando o e-mail ao criar a conta, pelo token (ADR-029) | Merge | Arthur |
| Y | ✅ **Conta sem perfil de consumidor:** resolvida em 10/11 pela tela "Completar cadastro" (`#/completar-cadastro`), decisão do Arthur. Falta conferir no navegador (`verificacao-pendente.md`, passos 16 e 17) | — | — |
| **Z** | **Texto jurídico do consentimento de Saúde** e do termo do profissional: rascunhos em `docs/legal/`, sem revisão jurídica. Mudou o texto, sobe a versão e quem consentiu consente de novo | Produção com Saúde | Arthur |
| **AA** | **GitHub com a cobrança bloqueada:** sem CI e sem PR. O PR #58 (draft) existe; `feat/integracao-final` foi enviada, sem PR. Nada foi mergeado | Merge em `main` | Arthur |
| **AB** | Busca do ponto do endereço: o provedor acerta o número em 2 de 5 endereços de Garça. A confirmação do dono é a rede de proteção | Qualidade do cadastro | Arthur |
| **AC** | Conferir o papel do Rafa no banco onde ele foi testado (a agenda vazia vinha do papel Profissional pré-marcado no convite, já corrigido) | Fechar o item | Arthur |

⚠️ O estado de F, G e I não foi registrado desde setembro. Atualizar aqui quando houver resposta.

---

## 12. Recorte de entrega e o que falta

Prazo de código: **2ª semana de novembro** (hoje, 10/11, é o fim dessa janela).

| # | Item do recorte | Situação | Falta |
|---|---|---|---|
| 1 | **Fatia vertical completa** | ✅ Consumidor, painel (agenda, pedidos, gestão, equipe, fotos, avaliações), cadastro do estabelecimento e convites, ponta a ponta; 34 verificações no navegador em 10/11 | Aplicar as migrations e conferir em celular real (`verificacao-pendente.md`) |
| 2 | Busca pública geográfica + disponibilidade | ✅ Busca por raio, cidade, termo, preço e nota | Horários no próprio resultado não aparecem |
| 3 | **Prova de concorrência (RNF-03)** | ✅ Zero dupla reserva, isolamento de tenant (404) e disputa sem 500 observados | Aceitar a ADR-019 |
| 4 | Dado sensível da vertical de saúde | ✅ Consentimento que bloqueia, com tela, texto servido pela API e revogação; log de acesso | Revisão jurídica do texto (pendência Z) |
| 5 | Autenticação, cadastro, recuperação de senha | ✅ Telas de entrar, criar conta, confirmar e-mail, esqueci e redefinir; cadastro de estabelecimento sem conta prévia | Revisão humana (pendência X) |

**Prioridade restante:** aplicar migrations → revisão humana de autenticação e multi-tenancy → decisões X, Y e Z → Lighthouse (RNF-04) → conferência em aparelho real. Seed de 30 com saúde e histórico: ✅. k6: ✅ RNF-01 e RNF-02. Endpoint e tela do Admin: ✅.

**Trabalhos futuros declarados:** os da §9.

---

## 13. ADRs

34 arquivos em `docs/decisions/`, contados em 10/11. Status lido de cada arquivo.

| ID | Tema | Situação |
|---|---|---|
| 001, 003, 004, 005, 006, 007, 009, 010, 011 | Stack, multi-tenancy por coluna, identidade única, dupla reserva, slot como cálculo, monólito modular, paridade mobile, organização do backend, Bun | ✅ Aceitos |
| **033** | Entrada na equipe só por convite; especialidade no convite | ✅ **Aceito (10/11, aprovada por Arthur).** O trajeto de quem tem conta sem e-mail confirmado e a opção de confirmar o e-mail pelo convite aguardam o Arthur |
| 002 | Revogação do pitch | 📝 Proposto (26/10) |
| 008 | Hospedagem, PostGIS, `btree_gist` | 📝 Proposto — unidade de implantação decidida em 27/10; **provedor final em aberto** |
| 012 | Idade mínima de 18 anos e agendamento para terceiro | 📝 Proposto |
| 013 | CPF opcional e verificação de identidade como porta | 📝 Proposto |
| 014 | Avaliação do profissional e perfil público dividido | 📝 Proposto |
| 015 | Categoria como enum | 📝 Proposto |
| 016 | Geocodificação: porta, provedor por fase e confirmação pelo dono | 📝 Proposto |
| 017 | Intervalo bloqueado em colunas gravadas, não coluna gerada | 📝 Proposto |
| 018 | Marca Vagoo e paleta azul | 📝 Proposto |
| 019 | Serialização por profissional com advisory lock na criação de agendamento | 📝 Proposto |
| 020 | Papel de Admin da plataforma | 📝 Proposto |
| 021 | Envio de e-mail: SMTP genérico e outbox | 📝 Proposto |
| 022 | Provedores de geocodificação e CEP, limites e privacidade da coordenada | 📝 Proposto |
| 023 | Imagens: armazenamento atrás de porta, processamento com SkiaSharp | 📝 Proposto |
| 024 | Busca por termo sem acento e com dicionário de sinônimos no código | 📝 Proposto |
| 025 | Camada de API do frontend: Axios, `base`/`models`/`services`, `useService` | 📝 Proposto |
| 026 | Ícones: Material Symbols em SVG, gerados no build, num registro único | 📝 Proposto |
| 027 | Estrutura do frontend por responsabilidade e carregamento sob demanda | 📝 Proposto |
| 028 | Ciclo de status do estabelecimento, publicação por categoria, publicar × receber | 📝 Proposto |
| 029 | Convite de equipe por e-mail e limite de vagas | 📝 Proposto |
| 030 | Papel Atendente e a política de autorização por papel | 📝 Proposto |
| 031 | Perfil público do profissional sempre ligado, com declaração do dono | 📝 Proposto |
| 032 | Modelo de reputação: avaliações de agendamentos concluídos | 📝 Proposto |
| **034** | Cadastro de estabelecimento sem conta prévia | 📝 **Proposto (10/11) — toca autenticação: revisão humana** |

Resumo: **10 aceitas, 24 propostas.** Aceitar uma ADR é decisão do Arthur; "Proposto" não quer dizer que o código não a segue, e sim que ela ainda não foi revisada.

---

## 14. Restrições permanentes

- Duas pessoas em tempo parcial, texto do TCC na mesma janela.
- **Orçamento ~zero.** GitHub Student Pack → Azure for Students → free tiers → VPS pago em último caso.
- **LGPD Art. 11:** em categoria de saúde, o próprio agendamento é dado sensível. Consentimento que **bloqueia**, ausência em página pública, log de acesso.
- **Nunca:** segredo no repositório, `.env` commitado, token em documento, credencial inventada.
- **Nenhum trailer de atribuição de IA** em commit ou PR (hook `.githooks/commit-msg` + check `governance / no-ai-coauthor`).

---

## 15. Regras de trabalho

1. Não implementar sem aprovação humana explícita.
2. Separar **evidência / interpretação / hipótese / decisão**. Nunca inventar entrevista, métrica ou referência.
3. Toda decisão arquitetural vira **ADR**.
4. Revisão humana obrigatória em: autenticação, autorização, multi-tenancy, dado de saúde, migration, infraestrutura.
5. **Fatia vertical antes de largura.**
6. Antes de adicionar complexidade: *que problema concreto isso resolve?*
7. Economia de contexto: `graphify query` antes de ler arquivo; só as skills necessárias.
8. Respostas e documentação em português.
9. **Ao fechar uma etapa, atualizar este arquivo no mesmo PR.**

---

## 16. Próximo passo

1. **Arthur:** ler `docs/verificacao-pendente.md`, fazer o backup e aplicar as duas migrations (pendência W); conferir os itens do roteiro em celular real.
2. **Arthur:** decidir Z (texto jurídico); aceitar ou mudar a ADR-034; **revisão humana** de autenticação, multi-tenancy e migrations.
3. **Arthur e Rafael:** com o GitHub desbloqueado, abrir o PR da `feat/integracao-final` (ela contém os merges do Rafael, documentados em `docs/integracao-rafa-10-11.md`) e deixar o CI rodar; o PR #58 fica contido nela.
4. Aceitar as ADRs 019 e 020 e decidir as pendências T e U (remarcação e lembretes).
5. Preencher o Gmail no `.env` (pendência V) e repetir o teste de recuperação de senha.
6. Lighthouse (RNF-04) e a contagem de passos (RNF-05) para o capítulo de resultados.
7. Seed de demonstração: `bun scripts/seed-demo.ts` (só banco local); `--historico` para o painel cheio.
