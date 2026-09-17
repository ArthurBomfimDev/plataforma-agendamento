# Graph Report - AgendeAki  (2026-09-17)

## Corpus Check
- 58 files · ~31,648 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 57 file(s) not represented in the graph (top: (none) 55, .props 2)

## Summary
- 484 nodes · 595 edges · 30 communities (24 shown, 6 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `57586434`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- IBaseRepository
- CLAUDE.md
- decisions/README.md
- ReflectionRules
- Modelo de Domínio
- ADR-003 — Multi-tenancy por coluna `business_id`, com filtro global e RLS
- microsoft_entityframeworkcore_metadata_builders
- Booking.ArchitectureTests.Rules
- Booking.ArchitectureTests.csproj
- ADR-007 — Monólito modular com fronteira de módulo verificada pelo build
- http
- ADR-005 — Prevenção de dupla reserva por constraint de exclusão no PostgreSQL
- PROJECT-CONTEXT.md
- ADR-001 — Stack: React + Vite no frontend, .NET 10 no backend, PostgreSQL com PostGIS
- ADR-004 — Identidade única, papéis por associação e conta global do consumidor
- BookingDbContext
- 3. Paleta (Etapa 2 — aprovada)
- post-checkout
- post-commit
- ADR-009 — Paridade mobile completa no painel, como decisão de inclusão digital
- ADR-NNN — Título curto e afirmativo
- Decisão
- 3. Telas (Etapa 6)
- Decisões de Produto — Blocos 1 e 2
- .ModuleBoundary
- Objetivo
- Tokens de design
- Program.cs
- graphify
- commit-msg

## God Nodes (most connected - your core abstractions)
1. `ReflectionRules` - 14 edges
2. `Modelo de Domínio` - 14 edges
3. `Decisões de Produto — Blocos 1 e 2` - 10 edges
4. `Booking.ArchitectureTests.Rules` - 9 edges
5. `Booking.ArchitectureTests.Support` - 9 edges
6. `Decisão` - 9 edges
7. `Objetivo` - 9 edges
8. `ADR-007 — Monólito modular com fronteira de módulo verificada pelo build` - 9 edges
9. `ForbiddenDependencyTests` - 8 edges
10. `ADR-005 — Prevenção de dupla reserva por constraint de exclusão no PostgreSQL` - 8 edges

## Surprising Connections (you probably didn't know these)
- `3. `Guid` v7 em todas as entidades` --references--> `IdentifierTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/IdentifierTests.cs
- `6. `Converter/` manual obrigatório onde há snapshot ou máquina de estado` --references--> `ForbiddenDependencyTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/ForbiddenDependencyTests.cs
- `7. Outbox como fila de evento` --references--> `ForbiddenDependencyTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/ForbiddenDependencyTests.cs
- `1. Fronteira de módulo por teste de arquitetura, não por projeto físico` --references--> `ModuleBoundaryTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/ModuleBoundaryTests.cs
- `5. Sem entidade de persistência separada` --references--> `PersistenceMappingTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/PersistenceMappingTests.cs

## Import Cycles
- None detected.

## Communities (30 total, 6 thin omitted)

### Community 0 - "IBaseRepository"
Cohesion: 0.09
Nodes (19): BaseEntity, Id, Guid, IBaseRepository, Guid, PagedResult, IReadOnlyList, PageRequest (+11 more)

### Community 1 - "CLAUDE.md"
Cohesion: 0.08
Nodes (21): 1. Stack e decisões fechadas, 2. Glossário canônico, 3.1 Mobile-first vale para o painel também, 3. As 6 regras de empacotamento, 4. Regras invioláveis, 6. Comandos, 7. Definition of Done, 8. Onde encontrar o resto (+13 more)

### Community 2 - "decisions/README.md"
Cohesion: 0.06
Nodes (29): A — Tabela de slots pré-gerada, ADR-006 — Slot é resultado de cálculo, não linha de tabela, Alternativas consideradas, B — Tabela de slots com cache invalidado por evento, C — Cálculo sob demanda, com `Slot` como objeto de valor efêmero, Como saber que erramos, Consequências, Contexto (+21 more)

### Community 3 - "ReflectionRules"
Cohesion: 0.13
Nodes (15): BaseUsageTests, Fact, IdentifierTests, Fact, PaginationTests, Fact, PersistenceMappingTests, Fact (+7 more)

### Community 4 - "Modelo de Domínio"
Cohesion: 0.06
Nodes (36): 10. Reputation, 11. Compliance (LGPD), 12. Eventos de domínio, 13. Divergências em relação ao modelo do Gemini, 1. Visão geral, 2. Objetos de valor, 3. Identity, 4. Tenancy (+28 more)

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

### Community 12 - "PROJECT-CONTEXT.md"
Cohesion: 0.13
Nodes (14): 10. Próximo passo, 1. O que é, 2. Estado real do repositório, 3. Documentos de referência, 4. Decisões fechadas, 5. Decisões em aberto — bloqueiam progresso, 6. Skills e agentes, 7. Contradições resolvidas — não reabrir (+6 more)

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

### Community 21 - "Decisão"
Cohesion: 0.10
Nodes (15): ForbiddenDependencyTests, Fact, TheoryData, PackageRules, IReadOnlyList, BackendRoot, DirectoryInfo, 3. `Guid` v7 em todas as entidades (+7 more)

### Community 24 - "3. Telas (Etapa 6)"
Cohesion: 0.17
Nodes (11): 1. Estrutura do arquivo, 2. Componentes (Etapa 5), 3. Telas (Etapa 6), 4. Próxima etapa, Componentes e telas — Etapas 5 e 6 concluídas, Consumidor — 390×844 (mobile) e 1440×900 (desktop), Decisões, Defeitos pegos pela validação e corrigidos (+3 more)

### Community 25 - "Decisões de Produto — Blocos 1 e 2"
Cohesion: 0.17
Nodes (11): 0. Glossário canônico, 1.9 Receita e financeiro na interface, 1. Núcleo e proposta de valor, 2. Atores, papéis e identidade, 3. Busca, 4. Fora do MVP, 5. Correções sobre material anterior, 6. ADR-005 (a escrever) — Prevenção de dupla reserva (+3 more)

### Community 26 - ".ModuleBoundary"
Cohesion: 0.10
Nodes (16): MemberData, Theory, LayerDependencyTests, Fact, ModuleBoundaryTests, Fact, MemberData, Theory (+8 more)

### Community 27 - "Objetivo"
Cohesion: 0.20
Nodes (9): Breaking changes, Checklist final, Decisões tomadas, Evidência para o TCC, Mudanças, Objetivo, ⚠️ Revisão humana obrigatória, Riscos (+1 more)

### Community 31 - "Tokens de design"
Cohesion: 0.25
Nodes (7): As cinco regras, Como ressincronizar, Como usar no componente, ⚠️ Duas advertências, Estado atual, Fonte da verdade, Tokens de design

## Knowledge Gaps
- **239 isolated node(s):** `graphify`, `1. Stack e decisões fechadas`, `2. Glossário canônico`, `3.1 Mobile-first vale para o painel também`, `4. Regras invioláveis` (+234 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 276 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI` connect `decisions/README.md` to `IBaseRepository`, `Decisão`?**
  _High betweenness centrality (0.269) - this node is a cross-community bridge._
- **Why does `5. Convenções de código` connect `IBaseRepository` to `CLAUDE.md`?**
  _High betweenness centrality (0.198) - this node is a cross-community bridge._
- **What connects `graphify`, `1. Stack e decisões fechadas`, `2. Glossário canônico` to the rest of the system?**
  _239 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `IBaseRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.08994708994708994 - nodes in this community are weakly interconnected._
- **Should `CLAUDE.md` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `decisions/README.md` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `ReflectionRules` be split into smaller, more focused modules?**
  _Cohesion score 0.12612612612612611 - nodes in this community are weakly interconnected._