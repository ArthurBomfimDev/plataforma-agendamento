# Graph Report - AgendeAki  (2026-10-02)

## Corpus Check
- 70 files · ~39,753 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 60 file(s) not represented in the graph (top: (none) 57, .props 2, .lock 1)

## Summary
- 643 nodes · 754 edges · 37 communities (31 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a31a5bdf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI
- PROJECT-CONTEXT.md
- ADR-006 — Slot é resultado de cálculo, não linha de tabela
- ReflectionRules
- Modelo de Domínio
- ADR-003 — Multi-tenancy por coluna `business_id`, com filtro global e RLS
- microsoft_entityframeworkcore_metadata_builders
- Booking.ArchitectureTests.Rules
- Booking.ArchitectureTests.csproj
- ADR-007 — Monólito modular com fronteira de módulo verificada pelo build
- http
- ADR-005 — Prevenção de dupla reserva por constraint de exclusão no PostgreSQL
- package.json
- ADR-001 — Stack: React + Vite no frontend, .NET 10 no backend, PostgreSQL com PostGIS
- ADR-004 — Identidade única, papéis por associação e conta global do consumidor
- BookingDbContext
- 3. Paleta (Etapa 2 — aprovada)
- post-checkout
- post-commit
- ADR-009 — Paridade mobile completa no painel, como decisão de inclusão digital
- ADR-NNN — Título curto e afirmativo
- Decisões — modelo, localização, identidade e notificação
- compilerOptions
- compilerOptions
- 3. Telas (Etapa 6)
- Decisões de Produto — Blocos 1 e 2
- Decisão
- Objetivo
- CLAUDE.md
- decisions/README.md
- .oxlintrc.json
- Tokens de design
- .prettierrc.json
- tsconfig.json
- Program.cs
- .claude/CLAUDE.md
- commit-msg

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `compilerOptions` - 15 edges
3. `Modelo de Domínio` - 15 edges
4. `ReflectionRules` - 14 edges
5. `Decisões de Produto — Blocos 1 e 2` - 10 edges
6. `ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI` - 9 edges
7. `Decisão` - 9 edges
8. `scripts` - 9 edges
9. `Objetivo` - 9 edges
10. `ADR-011 — Bun como gerenciador de pacotes e executor de scripts do frontend; Vite permanece o bundler` - 9 edges

## Surprising Connections (you probably didn't know these)
- `3. `Guid` v7 em todas as entidades` --references--> `IdentifierTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/IdentifierTests.cs
- `1. Fronteira de módulo por teste de arquitetura, não por projeto físico` --references--> `ModuleBoundaryTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/ModuleBoundaryTests.cs
- `2. `Base/` restrito a cadastro sem regra de estado` --references--> `BaseUsageTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/BaseUsageTests.cs
- `4. Paginação obrigatória` --references--> `PaginationTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/PaginationTests.cs
- `5. Sem entidade de persistência separada` --references--> `PersistenceMappingTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/PersistenceMappingTests.cs

## Import Cycles
- None detected.

## Communities (37 total, 6 thin omitted)

### Community 0 - "ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI"
Cohesion: 0.08
Nodes (26): BaseEntity, Id, Guid, IBaseRepository, Guid, PagedResult, IReadOnlyList, PageRequest (+18 more)

### Community 1 - "PROJECT-CONTEXT.md"
Cohesion: 0.07
Nodes (25): 10. Próximo passo, 1. O que é, 2. Estado real do repositório, 3. Documentos de referência, 4. Decisões fechadas, 5. Decisões em aberto — bloqueiam progresso, 6. Skills e agentes, 7. Contradições resolvidas — não reabrir (+17 more)

### Community 2 - "ADR-006 — Slot é resultado de cálculo, não linha de tabela"
Cohesion: 0.13
Nodes (14): A — Tabela de slots pré-gerada, ADR-006 — Slot é resultado de cálculo, não linha de tabela, Alternativas consideradas, B — Tabela de slots com cache invalidado por evento, C — Cálculo sob demanda, com `Slot` como objeto de valor efêmero, Como saber que erramos, Consequências, Contexto (+6 more)

### Community 3 - "ReflectionRules"
Cohesion: 0.13
Nodes (15): BaseUsageTests, Fact, IdentifierTests, Fact, PaginationTests, Fact, PersistenceMappingTests, Fact (+7 more)

### Community 4 - "Modelo de Domínio"
Cohesion: 0.05
Nodes (39): 10. Reputation, 11. Compliance (LGPD), 12. Notifications ⚠️ módulo novo (decisão 22/09 #8), 13. Eventos de domínio, 14. Divergências em relação ao modelo do Gemini, 1. Visão geral, 2. Objetos de valor, 3. Identity (+31 more)

### Community 5 - "ADR-003 — Multi-tenancy por coluna `business_id`, com filtro global e RLS"
Cohesion: 0.12
Nodes (15): A — Banco por tenant, ADR-003 — Multi-tenancy por coluna `business_id`, com filtro global e RLS, Alternativas consideradas, B — Schema por tenant, C — Coluna `business_id` com filtro global do EF Core, Como saber que erramos, Consequências, Contexto (+7 more)

### Community 7 - "Booking.ArchitectureTests.Rules"
Cohesion: 0.08
Nodes (22): AssemblyReference, Assembly, AssemblyReference, Assembly, AssemblyReference, Assembly, AssemblyReference, Assembly (+14 more)

### Community 8 - "Booking.ArchitectureTests.csproj"
Cohesion: 0.16
Nodes (13): Microsoft.NET.Sdk, Microsoft.NET.Sdk, Microsoft.NET.Sdk, Microsoft.NET.Sdk, Microsoft.NET.Sdk, coverlet.collector, Microsoft.AspNetCore.OpenApi, Microsoft.NET.Test.Sdk (+5 more)

### Community 9 - "ADR-007 — Monólito modular com fronteira de módulo verificada pelo build"
Cohesion: 0.12
Nodes (17): A — Microsserviços, ADR-007 — Monólito modular com fronteira de módulo verificada pelo build, Alternativas consideradas, B — Monólito por camada, sem fronteira de módulo, C — Monólito modular com fronteira por convenção, Como saber que erramos, Consequências, Contexto (+9 more)

### Community 10 - "http"
Cohesion: 0.13
Nodes (15): ASPNETCORE_ENVIRONMENT, applicationUrl, commandName, dotnetRunMessages, environmentVariables, launchBrowser, applicationUrl, commandName (+7 more)

### Community 11 - "ADR-005 — Prevenção de dupla reserva por constraint de exclusão no PostgreSQL"
Cohesion: 0.12
Nodes (15): A — Verificação em código antes do `INSERT`, ADR-005 — Prevenção de dupla reserva por constraint de exclusão no PostgreSQL, Alternativas consideradas, B — Lock distribuído em Redis, C — Isolamento `SERIALIZABLE`, Como saber que erramos, Consequências, Contexto (+7 more)

### Community 12 - "package.json"
Cohesion: 0.05
Nodes (41): ADR-0011, dependencies, react, react-dom, devDependencies, oxlint, prettier, @types/node (+33 more)

### Community 13 - "ADR-001 — Stack: React + Vite no frontend, .NET 10 no backend, PostgreSQL com PostGIS"
Cohesion: 0.12
Nodes (15): A — React + TypeScript + Vite · ASP.NET Core (.NET 10) · PostgreSQL + PostGIS, ADR-001 — Stack: React + Vite no frontend, .NET 10 no backend, PostgreSQL com PostGIS, Alternativas consideradas, B — Node.js + NestJS no backend, mantendo o que o pitch declarou, C — React Native para o app, como o pitch declarou, Como saber que erramos, Consequências, Contexto (+7 more)

### Community 14 - "ADR-004 — Identidade única, papéis por associação e conta global do consumidor"
Cohesion: 0.13
Nodes (14): A — Tipos de conta separados: `CustomerAccount`, `ProfessionalAccount`, `OwnerAccount`, ADR-004 — Identidade única, papéis por associação e conta global do consumidor, Alternativas consideradas, B — Uma conta com um campo `Role` (enum), C — Uma conta global + papéis por associação a empresa, Como saber que erramos, Consequências, Contexto (+6 more)

### Community 15 - "BookingDbContext"
Cohesion: 0.25
Nodes (6): BookingDbContext, Booking.Infrastructure.Persistence.Context, DbContext, DbContextOptions, microsoft_entityframeworkcore, ModelBuilder

### Community 16 - "3. Paleta (Etapa 2 — aprovada)"
Cohesion: 0.13
Nodes (14): 1. Eixo (Etapa 1 — aprovado), 2. Decisão de risco registrada (para o capítulo de limitações), 3. Paleta (Etapa 2 — aprovada), 4. Tipografia (Etapa 3 — aprovada), 5. Tokens no Figma (Etapa 4 — concluída), 6. Próximas etapas, Eixo de marca, paleta e tipografia — aprovado, Escala — 7 tamanhos (+6 more)

### Community 19 - "ADR-009 — Paridade mobile completa no painel, como decisão de inclusão digital"
Cohesion: 0.13
Nodes (14): A — Painel só desktop, mobile depois se sobrar tempo, ADR-009 — Paridade mobile completa no painel, como decisão de inclusão digital, Alternativas consideradas, B — Painel mobile só para as telas críticas (ver agenda, aceitar pedido), C — Paridade completa em 390px, Como saber que erramos, Consequências, Contexto (+6 more)

### Community 20 - "ADR-NNN — Título curto e afirmativo"
Cohesion: 0.14
Nodes (13): A —, ADR-NNN — Título curto e afirmativo, Alternativas consideradas, B —, Como saber que erramos, Consequências, Contexto, Decisão (+5 more)

### Community 21 - "Decisões — modelo, localização, identidade e notificação"
Cohesion: 0.08
Nodes (24): 1.1 Constraint de exclusão — texto definitivo, 1. Correções no modelo de domínio, 2.0 Conta única confirmada, 2.1 Idade mínima — 18 anos, sem exceção, 2.2 CPF e verificação de identidade, 2.3 Antifraude no MVP — o que de fato entra, 2.4 Campos do `Customer`, 2. Identidade (+16 more)

### Community 22 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 23 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 24 - "3. Telas (Etapa 6)"
Cohesion: 0.17
Nodes (11): 1. Estrutura do arquivo, 2. Componentes (Etapa 5), 3. Telas (Etapa 6), 4. Próxima etapa, Componentes e telas — Etapas 5 e 6 concluídas, Consumidor — 390×844 (mobile) e 1440×900 (desktop), Decisões, Defeitos pegos pela validação e corrigidos (+3 more)

### Community 25 - "Decisões de Produto — Blocos 1 e 2"
Cohesion: 0.17
Nodes (11): 0. Glossário canônico, 1.9 Receita e financeiro na interface, 1. Núcleo e proposta de valor, 2. Atores, papéis e identidade, 3. Busca, 4. Fora do MVP, 5. Correções sobre material anterior, 6. ADR-005 (a escrever) — Prevenção de dupla reserva (+3 more)

### Community 26 - "Decisão"
Cohesion: 0.05
Nodes (31): ForbiddenDependencyTests, Fact, MemberData, Theory, TheoryData, LayerDependencyTests, Fact, ModuleBoundaryTests (+23 more)

### Community 27 - "Objetivo"
Cohesion: 0.20
Nodes (9): Breaking changes, Checklist final, Decisões tomadas, Evidência para o TCC, Mudanças, Objetivo, ⚠️ Revisão humana obrigatória, Riscos (+1 more)

### Community 28 - "CLAUDE.md"
Cohesion: 0.13
Nodes (14): 1. Stack e decisões fechadas, 2. Glossário canônico, 3.1 Mobile-first vale para o painel também, 3. As 6 regras de empacotamento, 4. Regras invioláveis, 5. Convenções de código, 6. Comandos, 7. Definition of Done (+6 more)

### Community 29 - "decisions/README.md"
Cohesion: 0.08
Nodes (21): A — Continuar com npm, ADR-011 — Bun como gerenciador de pacotes e executor de scripts do frontend; Vite permanece o bundler, Alternativas consideradas, B — Bun como gerenciador de pacotes e executor de scripts, mantendo o Vite, C — Bun também como bundler, dev server e runtime, Como saber que erramos, Consequências, Contexto (+13 more)

### Community 30 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 31 - "Tokens de design"
Cohesion: 0.25
Nodes (7): As cinco regras, Como ressincronizar, Como usar no componente, ⚠️ Duas advertências, Estado atual, Fonte da verdade, Tokens de design

### Community 32 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 44 - ".claude/CLAUDE.md"
Cohesion: 0.11
Nodes (16): 0. Antes de qualquer tarefa — roteador de skills, 1. Stack e decisões fechadas, 2. Glossário canônico, 3.1 Mobile-first vale para o painel também, 3. As 6 regras de empacotamento, 4. Regras invioláveis, 5. Convenções de código, 6. Comandos (+8 more)

## Knowledge Gaps
- **358 isolated node(s):** `Problema`, `Como as regras são verificadas`, `O que fica mais fácil`, `O que fica mais difícil`, `O que passa a ser proibido` (+353 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 398 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI` connect `ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI` to `Decisão`, `decisions/README.md`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **Why does `5. Convenções de código` connect `CLAUDE.md` to `ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `Organização do backend — camadas como projetos, módulos como pastas` connect `ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI` to `CLAUDE.md`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **What connects `Problema`, `Como as regras são verificadas`, `O que fica mais fácil` to the rest of the system?**
  _358 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI` be split into smaller, more focused modules?**
  _Cohesion score 0.07563025210084033 - nodes in this community are weakly interconnected._
- **Should `PROJECT-CONTEXT.md` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `ADR-006 — Slot é resultado de cálculo, não linha de tabela` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._