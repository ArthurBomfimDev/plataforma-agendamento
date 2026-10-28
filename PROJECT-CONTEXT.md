# PROJECT-CONTEXT.md

> Contexto compartilhado entre sessões (Claude, Claude Code, Figma).
> Leia este arquivo primeiro; só abra os documentos longos se a tarefa exigir.
> **Última atualização:** 2026-10-27 (Onda 5A — ajustes do painel e do log) · Fase: **implementação — integração front/back** (branch `feat/integracao-front-back`)
>
> Substitui todas as versões anteriores (03/09, 04/09, 08/09, 10/09). Existe **um** `PROJECT-CONTEXT.md`, na raiz.
> **Este arquivo é índice e retrato do estado, não a fonte de verdade.** Em caso de conflito:
> - **entre documentos, vale o mais recente** — pela data de atualização, não pelo tipo. Uma decisão de 22/09 prevalece sobre uma ADR de 09/09; a R5 de 09/10 prevalece sobre qualquer paleta anterior. O documento antigo recebe errata ou é substituído, nunca fica valendo em silêncio;
> - **o que existe** → vale o código e as migrations;
> - quando o código divergiu da decisão **para melhor**, a divergência vira documento novo (ADR) — e por ser o mais recente, passa a valer (§2.1). Quando divergiu **para pior**, é dívida e entra no §12.

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

## 2. Estado atual (27/10)

Repositório público: `github.com/ArthurBomfimDev/plataforma-agendamento` · `main` protegida, 4 checks obrigatórios, CODEOWNERS com os dois em todo caminho.

### Backend — ~12,7 mil linhas C#

| Módulo | Situação |
|---|---|
| Identity | ✅ `User`, `RefreshToken`, `UserToken`. Argon2id, JWT, refresh rotativo com detecção de reuso, confirmação de e-mail, recuperação de senha, troca de contexto ativo |
| Tenancy | ✅ `Business`, `BusinessMembership`. Cadastro, política de agendamento, endereço, ponto confirmado, submissão, busca com `ST_DWithin` (serviço em destaque com preço "a partir de", categoria, preço máximo, ordenação). **Admin da plataforma** (ADR-020): fila de análise, aprovar, recusar, suspender, reinstalar |
| People | ✅ `Customer` (com `BirthDate`), `Professional` (consentimento de perfil público) |
| Catalog | ✅ `Service`, `ServiceProfessional` |
| Availability | ✅ `WorkSchedule` (criar, **editar**, remover), `ScheduleException`, `Holiday`; `AvailabilityCalculator`; feriados pela Páscoa; calendário de vários dias; **bloqueio com agendamentos afetados**: prévia, manter ou cancelar todos, tudo ou nada |
| Scheduling | ✅ `Appointment`, `AppointmentEvent`. Pedido, confirmar, recusar, cancelar, concluir, falta, balcão. **409 com horários alternativos** |
| Compliance | ✅ `ConsentRecord`, `SensitiveAccessLog`. Consentimento versionado que **bloqueia**; log de acesso |
| Reputation | ⬜ Pasta vazia — fora do recorte (§12) |
| Notifications | ⬜ Não existe — fora do recorte (§12) |

- **4 migrations** (`InitialIdentity`, `AddTenancy`, `AddCoreModules`, `AddPlatformAdmin`). PostGIS e `btree_gist` habilitados.
- **Constraint de exclusão real** em `scheduling.appointment` (§8).
- Filtro global de tenant no EF Core. **RLS não implementado.**
- Testes: `Booking.ArchitectureTests` (28 casos — regras da ADR-010, com fixtures de violação) e `Booking.UnitTests` (82 casos executados — os `[Theory]` rodam um caso por `InlineData`) e `Booking.IntegrationTests` (50 casos, todos ativos — segurança I1–I3, painel J1–J4 e log de token K1 incluídos: concorrência A1–A8, isolamento B1–B7, idempotência e consentimento C1–C4, Admin E1–E6, jornada F1–F3, bloqueio G1–G5, busca H1–H4, subida da migration e 1 que só registra o ambiente). Os defeitos O e P revelados pelo A2 e pelo C2 foram corrigidos na branch `fix/concorrencia-reserva` (ADR-019). A integração roda a API real contra PostgreSQL + PostGIS em banco criado por execução; evidência em `docs/tcc/evidencias/`.
- **Admin da plataforma** em `api/admin/businesses` (ADR-020). O papel só é concedido por SQL/seed, nunca por endpoint. O seed aprova pela API.

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

- Camada única em `src/lib/api`: token em vez de cookie, renovação deduplicada, conversão de fuso pelo IANA do estabelecimento.
- **Fluxo do consumidor integrado à API real**: home, estabelecimento, escolher profissional, calendário, revisão, pedido enviado, meus agendamentos, entrar, criar conta.
- Ainda com mock: **home** (categorias), **resultados da busca** (tela sem rota), **lembretes** na tela de pedido enviado (`MOCK_REMINDER_HOURS` ainda mostra **24 h e 3 h**, a decisão vigente é 24 h e 1 h — §10) e o **prazo de avaliação** em meus agendamentos (`MOCK_REVIEW_WINDOW_DAYS`, 30 dias; só aparece com avaliação, que ainda não existe).
- Testes do frontend: 60 casos (Vitest), sem jsdom — renderização em HTML de servidor.
- **Tema claro e escuro** implementados (tokens + alternador).
- **Não existe nenhuma tela do lado do estabelecimento** (painel, onboarding), nem consentimento LGPD, nem a tela de 409 com alternativas, nem recuperação de senha / confirmação de e-mail.

### Infra local

`compose.yaml` com `postgis/postgis:17-3.5`, migrations, API e frontend. `scripts/seed-demo.ts` cria **3 estabelecimentos de Beleza**, sem histórico e sem tenant de saúde.

### Design (Figma `E2M0TJehjcrSk4uaXlHI0s`)

Paleta **R5** (Vagoo, azul), modos Light e Dark, 11 component sets, ~50 telas em 8 páginas (autenticação, consumidor mobile e desktop, painel mobile, onboarding, clones Dark). Detalhe em `docs/design/`.

---

## 3. Documentos

| Arquivo | Conteúdo |
|---|---|
| `docs/DOCUMENTO-GERAL.md` | Visão integral do projeto para quem chega agora — problema, escopo, arquitetura, método |
| `docs/produto/decisoes-produto-blocos-1-2.md` | Glossário, núcleo, atores, busca, cortes (03/09) |
| `docs/produto/modelo-de-dominio.md` | Modelo de domínio revisado (19 entidades, 9 módulos), com o que o código acrescentou |
| `docs/produto/decisoes-localizacao-notificacao-modelo.md` | **Obrigatório antes de código de domínio.** 19 entidades, 9 módulos, idade, CPF, geocodificação, notificação (22/09) |
| `docs/design/eixo-paleta-tipografia.md` | Eixo, paleta R5, tipografia, tokens |
| `docs/design/componentes-e-telas.md` | Componentes, telas, padrões de adaptação |
| `docs/design/marca-vagoo.md` | Uso do logotipo e do símbolo |
| `docs/decisions/` | ADRs |
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

`Business` (estabelecimento, tenant) · `Owner` · `Professional` · `Customer` (consumidor) · `Service` · `Appointment` · `Availability`. Quarto papel: `Admin` da plataforma. `Owner` e `Professional` são papéis, não tipos de conta.

### Identidade

- **Idade mínima de 18 anos.** Agendamento para menor é feito pela conta de um adulto, com nome de quem será atendido no próprio agendamento (reaproveita `WalkInName`/`WalkInPhone`).
- **CPF nullable**, pedido só no 1º agendamento de categoria sensível, cifrado. Verificação de identidade é porta (`IIdentityVerificationProvider`), sem adaptador.
- `SocialName` opcional, exibido sempre que existir.
- Perfil público do profissional: **nome sempre público**; foto, bio e certificações só com consentimento registrado.

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
| Cancelamento | Padrão 24 h, configurável entre 0 e 48 h |
| Balcão | Mesma agenda, nasce `Confirmed`; `CustomerId` nullable |
| Ocupam o horário | `Pending`, `Confirmed`, `Completed`, `NoShow` |
| Liberam o horário | `Cancelled`, `Rejected`, `Expired` |

### Feriados

Calculados (fixos + móveis pela Páscoa), sem API. Padrão indisponível; a empresa pode abrir. O consumidor vê que é feriado mesmo quando a empresa abre.

### Onboarding e verificação

`Draft → PendingReview → Active → Suspended`. Checklist: CNPJ/CPF válido (dígito verificador, offline), **endereço com ponto confirmado pelo dono no mapa**, ≥1 serviço, ≥1 profissional, ≥1 jornada, ≥1 foto. Verificação manual pelo `Admin`, sem upload de documento.

### Localização

- Geocodificador dá o palpite, **o dono confirma o pino**. Só entra na busca por raio quem tem `LocationConfirmedAt`.
- `IGeocodingProvider`: Nominatim no TCC; provedor pago em produção.
- Posição do consumidor pedida no momento de uso, com três saídas (permitiu, negou, falhou). Uso transitório, sem log.
- Busca: `ST_DWithin` → texto → paginação → **só então** slots da página. Disponibilidade + serviço é a primeira dimensão a cortar se faltar tempo.

### Avaliação

Só de `Completed`, uma por agendamento, sem edição, prazo de 30 dias. Avalia o estabelecimento, com nota opcional do profissional. `Owner` responde.

### Notificações (fora do recorte de entrega, decisão mantida)

E-mail + in-app; WhatsApp é trabalho futuro. Lembretes configuráveis por estabelecimento, padrão **24 h e 1 h**. `.ics` na confirmação. `Business.ArrivalInstructions`. Outbox na mesma transação.

### Matriz de permissões

Ver `docs/DOCUMENTO-GERAL.md` §4.

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
| RNF-01 | Busca com slots p95 ≤ 800 ms, 30 empresas | k6 | ✅ **292 ms no p95** (busca + horários da 1ª página, 10 VUs, local, 27/10). Tela de resultados ainda em mock: o cenário mede o que ela vai precisar. `docs/tcc/evidencias/rnf-01-busca.md` |
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

## 9. Fora do MVP

Chat · posts e feed · pagamento, Pix, split, carteira, caução · planos com cobrança · estoque (vira `SuppliesNote`) · convênio com lógica · promoções · recomendação por IA · WhatsApp · indicação · categorias além de Beleza e Saúde · profissional em várias empresas · recursos compartilhados · atendimento domiciliar e online · vídeo hospedado · upload de documento · Tauri · virtual scroll.

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

---

## 11. Pendências abertas

| # | Pendência | Bloqueia | Quem |
|---|---|---|---|
| **F** | **Comitê de Ética + aceitação do DSR + recorte etário de 18 anos** | Coleta com participantes | Orientadora |
| **E** | **Confirmação do recorte de entrega** (§12) | Planejamento até a entrega | Orientadora + autores |
| G | Hospedagem (ADR-008, revisada em 27/10): **Docker Compose como unidade de implantação**, banco em contêiner; VPS paga, VM do crédito de estudante ou máquina própria por Cloudflare Tunnel. Neon e Heroku descartados. **Provedor final em aberto** | Deploy da demonstração | Arthur |
| I | ✅ Conta Azure for Students criada (27/10): US$ 100 até 27/10/2027 | — | — |
| **K** | **Nome técnico:** renomear repositório e `Booking.*` para Vagoo, ou manter neutro e registrar | Consistência | Ambos |
| L | Colisão de marca: **Vagaro** (agendamento de salão) — registrar como risco ou consultar INPI | Uso comercial pós-TCC | Ambos |
| M | Skills ainda com prefixo `agendeaki-` | Nada técnico; ruído | Arthur |
| N | Marca: tiles do ícone de app, favicon, área de proteção | PWA instalável | Rafael |
| O | ✅ **Corrigido e mergeado (#14, 27/10).** Deadlock `40P01` e timeout sob disputa: `pg_advisory_xact_lock` por profissional (ADR-019, `Proposto`). A2 reativado; 20 de 20 execuções aprovadas | — | Arthur (revisar e aceitar a ADR-019) |
| P | ✅ **Corrigido e mergeado (#14 e, a janela restante, #15).** Mesma `IdempotencyKey` simultânea devolvia 400/409; agora devolve o agendamento vencedor. C2 reativado | — | Arthur (revisar) |
| S | Lacunas de segurança do RNF-06. **Corrigidas na 5A:** token de e-mail fora do log fora de Development; `TenantContextExtensions` morto removido. **Abertas:** cadastro revela e-mail existente (409); sem bloqueio por conta no login. Ver `rnf-06-seguranca.md` §2 | Produção | Arthur |
| T | Agenda do dia (branch `dashboard`). **Feito na 5A:** `customerName` (nome social, senão o do cadastro; no balcão, o informado) e `requestedAt` nas rotas do estabelecimento; filtro de pendentes por profissional. **Falta:** indicadores do dia e remarcação. Ver `contrato-api-frontend.md` §4 | Painel com dado real | Arthur + Rafael |
| U | **Promessa de lembrete na tela "Pedido enviado" sem backend:** não há módulo de notificação nem campo de lembrete na API. Decidir: implementar um mínimo, ou remover/qualificar o texto | Coerência da demonstração | Arthur |
| R | **Colaboradores com login** (item 2.5 da Onda 2, não implementado): falta decidir a semântica de SeatLimit — o dono ocupa vaga? (com o padrão 1, nenhum colaborador caberia) — e quem altera o limite (Admin, plano, ninguém no recorte). Sem isso, RestrictToProfessionalAsync (agenda só do próprio profissional) segue sem uso real | Papel Professional com login | Arthur |
| Q | ✅ **Decidido (27/10, Arthur):** o log de acesso sensível registra leitura por terceiro; o consumidor criar o próprio pedido não é leitura e não gera entrada. É o comportamento do código | — | — |

⚠️ O estado de F, G e I não foi registrado desde setembro. Atualizar aqui quando houver resposta.

---

## 12. Recorte de entrega e o que falta

Prazo de código: **2ª semana de novembro** (~2,5 semanas a partir de 26/10).

| # | Item do recorte | Situação | Falta |
|---|---|---|---|
| 1 | **Fatia vertical completa** | 🟡 Backend completo; front só do consumidor | Painel: onboarding, serviço, profissional, jornada, **pedidos pendentes**, **agenda do dia** |
| 2 | Busca pública geográfica + disponibilidade | 🟡 Backend pronto | Resultados da busca ainda em mock |
| 3 | **Prova de concorrência (RNF-03)** | ✅ Zero dupla reserva, isolamento de tenant (404) e disputa sem 500 observados; defeitos O e P corrigidos (aguardando revisão) | Aceitar a ADR-019 |
| 4 | Dado sensível da vertical de saúde | 🟡 Backend pronto | Tela de consentimento; tenant de saúde no seed |
| 5 | Autenticação, cadastro, recuperação de senha | 🟡 Backend pronto | Telas de recuperação e confirmação de e-mail |

**Prioridade:** 3 → 1 → 4 → 2 → 5 → tela de 409 com alternativas → Lighthouse. Seed de 30 com saúde e histórico: ✅ (Onda 3). k6: ✅ RNF-01 e RNF-02. Endpoint de Admin: ✅ backend (Onda 2); tela do Admin fora do recorte.

**Trabalhos futuros declarados:** avaliações, notificações, upload de fotos, PWA instalável, relatórios, painel administrativo, RLS.

---

## 13. ADRs

| ID | Tema | Situação |
|---|---|---|
| 001, 003, 004, 005, 006, 007, 009, 010, 011 | — | ✅ Aceitos |
| 002 | Revogação do pitch | 📝 Proposto (26/10) |
| 008 | Hospedagem, PostGIS, `btree_gist` | 📝 Proposto (26/10) — candidatos e critérios; provedor em aberto até o spike |
| 012 | Idade mínima de 18 anos e agendamento para terceiro | 📝 Proposto (26/10) |
| 013 | CPF opcional e verificação de identidade como porta | 📝 Proposto (26/10) |
| 014 | Avaliação do profissional e perfil público dividido | 📝 Proposto (26/10) |
| 015 | Categoria como enum (`RequiresSensitiveHandling` como chave jurídica) | 📝 Proposto (26/10). A saída de `Category` do `Base/` está na emenda da ADR-010 |
| 016 | Geocodificação: porta, provedor por fase, confirmação pelo dono | 📝 Proposto (26/10) |
| 017 | Intervalo bloqueado em colunas gravadas, não coluna gerada | 📝 Proposto (26/10) — complementa a 005 |
| 018 | Marca Vagoo e paleta azul (revoga a proibição de azul) | 📝 Proposto (26/10) |
| 019 | Serialização por profissional com advisory lock na criação de agendamento | 📝 Proposto (27/10) — complementa a 005 |
| 020 | Papel de Admin da plataforma | 📝 Proposto (27/10) — complementa a 004 |

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

1. ✅ Ondas 1 a 3 mergeadas em `feat/integracao-front-back` (#14, #15, #16). Onda 4 em revisão.
2. PR #11 `feat/integracao-front-back` → `main`, com a exceção de merge administrativo registrada na descrição.
3. Aceitar as ADRs 019 e 020; decidir as pendências R, T e U. Juntar a branch `dashboard` do Rafael quando ele terminar (conflita em `frontend/src/router/consts.ts` e `route.tsx`).
4. Painel do estabelecimento mínimo para fechar a fatia 1.
5. Seed com 30 estabelecimentos, saúde e histórico: ✅ `bun scripts/seed-demo.ts --historico` (só banco local).
6. Responder F e E com a orientadora.
