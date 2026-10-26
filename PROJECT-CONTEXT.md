# PROJECT-CONTEXT.md

> Contexto compartilhado entre sessões (Claude, Claude Code, Figma).
> Leia este arquivo primeiro; só abra os documentos longos se a tarefa exigir.
> **Última atualização:** 2026-10-26 · Fase: **implementação — integração front/back** (branch `feat/integracao-front-back`)
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

## 2. Estado atual (26/10)

Repositório público: `github.com/ArthurBomfimDev/plataforma-agendamento` · `main` protegida, 4 checks obrigatórios, CODEOWNERS com os dois em todo caminho.

### Backend — ~12,7 mil linhas C#

| Módulo | Situação |
|---|---|
| Identity | ✅ `User`, `RefreshToken`, `UserToken`. Argon2id, JWT, refresh rotativo com detecção de reuso, confirmação de e-mail, recuperação de senha, troca de contexto ativo |
| Tenancy | ✅ `Business`, `BusinessMembership`. Cadastro, política de agendamento, endereço, ponto confirmado, submissão, busca com `ST_DWithin` |
| People | ✅ `Customer` (com `BirthDate`), `Professional` (consentimento de perfil público) |
| Catalog | ✅ `Service`, `ServiceProfessional` |
| Availability | ✅ `WorkSchedule`, `ScheduleException`, `Holiday`; `AvailabilityCalculator`; feriados pela Páscoa; calendário de vários dias |
| Scheduling | ✅ `Appointment`, `AppointmentEvent`. Pedido, confirmar, recusar, cancelar, concluir, falta, balcão. **409 com horários alternativos** |
| Compliance | ✅ `ConsentRecord`, `SensitiveAccessLog`. Consentimento versionado que **bloqueia**; log de acesso |
| Reputation | ⬜ Pasta vazia — fora do recorte (§12) |
| Notifications | ⬜ Não existe — fora do recorte (§12) |

- **3 migrations** (`InitialIdentity`, `AddTenancy`, `AddCoreModules`). PostGIS e `btree_gist` habilitados.
- **Constraint de exclusão real** em `scheduling.appointment` (§8).
- Filtro global de tenant no EF Core. **RLS não implementado.**
- Testes: `Booking.ArchitectureTests` (28 casos — regras da ADR-010, com fixtures de violação) e `Booking.UnitTests` (60 métodos de teste, **81 casos executados** — os `[Theory]` rodam um caso por `InlineData`). **Não existe `Booking.IntegrationTests`.**
- **Não existe endpoint de Admin.** O seed aprova estabelecimento por SQL direto.

### 2.1 Onde o código ficou melhor que o planejado — registrar, não reverter

| O que o plano dizia | O que o código faz | Por que é melhor | Onde registrar |
|---|---|---|---|
| `blocked_range` como coluna gerada | Colunas gravadas `blocked_starts_at`/`blocked_ends_at` + `tstzrange` dentro da constraint + check de coerência | A versão planejada **não roda**: coluna gerada exige `IMMUTABLE` e `timestamptz - interval` é `STABLE` | ADR-017 + errata no doc de 22/09 e no `DOCUMENTO-GERAL` |
| — | `Appointment.IdempotencyKey` | Duplo clique ou reenvio por rede ruim não gera dois pedidos — mesmo problema da dupla reserva, do lado do cliente HTTP | Modelo de domínio + capítulo técnico |
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
| RNF-01 | Busca com slots p95 ≤ 800 ms, 30 empresas | k6 | ⬜ Sem script, seed com 3 |
| RNF-02 | Disponibilidade p95 ≤ 200 ms | Teste cronometrado | ⬜ |
| RNF-03 | Zero dupla reserva sob 50 requisições concorrentes | Teste de integração | ⚠️ **Só sonda SQL no CI**, não contra a tabela real nem o endpoint |
| RNF-04 | Lighthouse mobile ≥ 85 perf, ≥ 95 a11y | CI | ⬜ |
| RNF-05 | Busca → confirmação em ≤ 4 passos | Contagem | 🟡 Fluxo existe, contar |
| RNF-06 | Argon2id, TLS, zero dado sensível em página pública | Checklist | 🟡 Argon2id feito |

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
| Pitch: React Native + Node/NestJS + AWS | Descartado. **ADR-002 ainda não escrita** |
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
| G | Hospedagem com PostGIS e `btree_gist` (ADR-008) | Deploy da demonstração | Arthur |
| I | E-mail `@fatec.sp.gov.br` / Azure for Students | Cold start na defesa | Ambos |
| **K** | **Nome técnico:** renomear repositório e `Booking.*` para Vagoo, ou manter neutro e registrar | Consistência | Ambos |
| L | Colisão de marca: **Vagaro** (agendamento de salão) — registrar como risco ou consultar INPI | Uso comercial pós-TCC | Ambos |
| M | Skills ainda com prefixo `agendeaki-` | Nada técnico; ruído | Arthur |
| N | Marca: tiles do ícone de app, favicon, área de proteção | PWA instalável | Rafael |

⚠️ O estado de F, G e I não foi registrado desde setembro. Atualizar aqui quando houver resposta.

---

## 12. Recorte de entrega e o que falta

Prazo de código: **2ª semana de novembro** (~2,5 semanas a partir de 26/10).

| # | Item do recorte | Situação | Falta |
|---|---|---|---|
| 1 | **Fatia vertical completa** | 🟡 Backend completo; front só do consumidor | Painel: onboarding, serviço, profissional, jornada, **pedidos pendentes**, **agenda do dia** |
| 2 | Busca pública geográfica + disponibilidade | 🟡 Backend pronto | Resultados da busca ainda em mock |
| 3 | **Prova de concorrência (RNF-03)** | ⚠️ Não existe | `Booking.IntegrationTests` com 50 requisições simultâneas contra o endpoint real; teste de isolamento de tenant (404) |
| 4 | Dado sensível da vertical de saúde | 🟡 Backend pronto | Tela de consentimento; tenant de saúde no seed |
| 5 | Autenticação, cadastro, recuperação de senha | 🟡 Backend pronto | Telas de recuperação e confirmação de e-mail |

**Prioridade:** 3 → 1 → seed de 30 com saúde → 4 → 2 → 5 → tela de 409 com alternativas → endpoint de Admin → k6 e Lighthouse.

**Trabalhos futuros declarados:** avaliações, notificações, upload de fotos, PWA instalável, relatórios, painel administrativo, RLS.

---

## 13. ADRs

| ID | Tema | Situação |
|---|---|---|
| 001, 003, 004, 005, 006, 007, 009, 010, 011 | — | ✅ Aceitos |
| 002 | Revogação do pitch | ⬜ Pendente |
| 008 | Hospedagem, PostGIS, `btree_gist` | ⬜ Pendente |
| 012 | Idade mínima de 18 anos e agendamento para terceiro | ⬜ A escrever |
| 013 | CPF opcional e verificação de identidade como porta | ⬜ A escrever |
| 014 | Avaliação do profissional e perfil público dividido | ⬜ A escrever |
| 015 | Categoria como enum (`RequiresSensitiveHandling` como chave jurídica) | ⬜ A escrever. A saída de `Category` do `Base/` já está na emenda da ADR-010 |
| 016 | Geocodificação: porta, provedor por fase, confirmação pelo dono | ⬜ A escrever |
| 017 | Intervalo bloqueado em colunas gravadas, não coluna gerada | ⬜ A escrever — complementa a 005 |
| 018 | Marca Vagoo e paleta azul (revoga a proibição de azul) | ⬜ A escrever |

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

1. Mergear a correção de documentação (inclui a branch `docs/modelo-dominio-revisado`).
2. PR `feat/integracao-front-back` → `main`. A integração já contém tudo da `main` (32 commits à frente, nenhum atrás).
3. `Booking.IntegrationTests` com Testcontainers + PostGIS: RNF-03 e isolamento de tenant.
4. Painel do estabelecimento mínimo para fechar a fatia 1.
5. Seed com 30 estabelecimentos, incluindo saúde e histórico.
6. Responder F e E com a orientadora.
