# Graph Report - AgendeAki  (2026-10-04)

## Corpus Check
- 90 files · ~33,999 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 84 file(s) not represented in the graph (top: (none) 81, .props 2, .lock 1)

## Summary
- 560 nodes · 702 edges · 39 communities (29 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e26c731b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CLAUDE.md
- PROJECT-CONTEXT.md
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
- UserToken
- ADR-001 — Stack: React + Vite no frontend, .NET 10 no backend, PostgreSQL com PostGIS
- ADR-004 — Identidade única, papéis por associação e conta global do consumidor
- BookingDbContext
- 3. Paleta (Etapa 2 — aprovada)
- post-checkout
- post-commit
- ADR-009 — Paridade mobile completa no painel, como decisão de inclusão digital
- ADR-NNN — Título curto e afirmativo
- User
- RefreshToken
- User.cs
- 3. Telas (Etapa 6)
- Decisões de Produto — Blocos 1 e 2
- ForbiddenDependencyTests
- Objetivo
- IUserRepository.cs
- IUserRepository
- UserStatus
- Tokens de design
- IDomainEvent.cs
- Guid
- Guid
- IReadOnlyList
- Program.cs
- graphify
- commit-msg

## God Nodes (most connected - your core abstractions)
1. `User` - 20 edges
2. `DomainException` - 15 edges
3. `UserToken` - 14 edges
4. `ReflectionRules` - 14 edges
5. `Modelo de Domínio` - 14 edges
6. `RefreshToken` - 13 edges
7. `Decisões de Produto — Blocos 1 e 2` - 10 edges
8. `Decisão` - 9 edges
9. `Objetivo` - 9 edges
10. `Booking.ArchitectureTests.Rules` - 9 edges

## Surprising Connections (you probably didn't know these)
- `6. `Converter/` manual obrigatório onde há snapshot ou máquina de estado` --references--> `ForbiddenDependencyTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/ForbiddenDependencyTests.cs
- `7. Outbox como fila de evento` --references--> `ForbiddenDependencyTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/ForbiddenDependencyTests.cs
- `1. Fronteira de módulo por teste de arquitetura, não por projeto físico` --references--> `ModuleBoundaryTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/ModuleBoundaryTests.cs
- `3. `Guid` v7 em todas as entidades` --references--> `IdentifierTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/IdentifierTests.cs
- `2. `Base/` restrito a cadastro sem regra de estado` --references--> `BaseUsageTests`  [INFERRED]
  docs/decisions/0010-organizacao-do-backend.md → backend/tests/Booking.ArchitectureTests/BaseUsageTests.cs

## Import Cycles
- None detected.

## Communities (39 total, 10 thin omitted)

### Community 0 - "CLAUDE.md"
Cohesion: 0.12
Nodes (15): 1. Stack e decisões fechadas, 2. Glossário canônico, 3.1 Mobile-first vale para o painel também, 3. As 6 regras de empacotamento, 4. Regras invioláveis, 5. Convenções de código, 6. Comandos, 7. Definition of Done (+7 more)

### Community 1 - "PROJECT-CONTEXT.md"
Cohesion: 0.07
Nodes (25): 10. Próximo passo, 1. O que é, 2. Estado real do repositório, 3. Documentos de referência, 4. Decisões fechadas, 5. Decisões em aberto — bloqueiam progresso, 6. Skills e agentes, 7. Contradições resolvidas — não reabrir (+17 more)

### Community 2 - "decisions/README.md"
Cohesion: 0.06
Nodes (30): A — Tabela de slots pré-gerada, ADR-006 — Slot é resultado de cálculo, não linha de tabela, Alternativas consideradas, B — Tabela de slots com cache invalidado por evento, C — Cálculo sob demanda, com `Slot` como objeto de valor efêmero, Como saber que erramos, Consequências, Contexto (+22 more)

### Community 3 - "ReflectionRules"
Cohesion: 0.10
Nodes (22): BaseUsageTests, Fact, IdentifierTests, ProbeEntity, Fact, PaginationTests, Fact, PersistenceMappingTests (+14 more)

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
Nodes (13): Microsoft.NET.Sdk, Microsoft.NET.Sdk, Microsoft.NET.Sdk, Microsoft.NET.Sdk, coverlet.collector, Microsoft.AspNetCore.OpenApi, Microsoft.NET.Test.Sdk, NetArchTest.eNhancedEdition (+5 more)

### Community 9 - "ADR-007 — Monólito modular com fronteira de módulo verificada pelo build"
Cohesion: 0.12
Nodes (17): A — Microsserviços, ADR-007 — Monólito modular com fronteira de módulo verificada pelo build, Alternativas consideradas, B — Monólito por camada, sem fronteira de módulo, C — Monólito modular com fronteira por convenção, Como saber que erramos, Consequências, Contexto (+9 more)

### Community 10 - "http"
Cohesion: 0.13
Nodes (15): ASPNETCORE_ENVIRONMENT, applicationUrl, commandName, dotnetRunMessages, environmentVariables, launchBrowser, applicationUrl, commandName (+7 more)

### Community 11 - "ADR-005 — Prevenção de dupla reserva por constraint de exclusão no PostgreSQL"
Cohesion: 0.13
Nodes (15): A — Verificação em código antes do `INSERT`, ADR-005 — Prevenção de dupla reserva por constraint de exclusão no PostgreSQL, Alternativas consideradas, B — Lock distribuído em Redis, C — Isolamento `SERIALIZABLE`, Como saber que erramos, Consequências, Contexto (+7 more)

### Community 12 - "UserToken"
Cohesion: 0.11
Nodes (19): Holiday, Date, Kind, Name, UserToken, ExpiresAt, TokenHash, Type (+11 more)

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

### Community 21 - "User"
Cohesion: 0.16
Nodes (12): AggregateRoot, User, Email, EmailConfirmedAt, FullName, PasswordHash, Status, DateTimeOffset (+4 more)

### Community 22 - "RefreshToken"
Cohesion: 0.21
Nodes (9): IAuditable, RefreshToken, ExpiresAt, ReplacedByTokenHash, RevokedAt, TokenHash, UserId, DateTimeOffset (+1 more)

### Community 23 - "User.cs"
Cohesion: 0.26
Nodes (6): booking_domain_enum_module_availability, Booking.Domain.Exceptions, Booking.Domain.Entity.Base, Booking.Domain.Entity.Module.Availability, Booking.Domain.Enum.Module.Identity, Booking.Domain.Entity.Module.Identity

### Community 24 - "3. Telas (Etapa 6)"
Cohesion: 0.17
Nodes (11): 1. Estrutura do arquivo, 2. Componentes (Etapa 5), 3. Telas (Etapa 6), 4. Próxima etapa, Componentes e telas — Etapas 5 e 6 concluídas, Consumidor — 390×844 (mobile) e 1440×900 (desktop), Decisões, Defeitos pegos pela validação e corrigidos (+3 more)

### Community 25 - "Decisões de Produto — Blocos 1 e 2"
Cohesion: 0.17
Nodes (11): 0. Glossário canônico, 1.9 Receita e financeiro na interface, 1. Núcleo e proposta de valor, 2. Atores, papéis e identidade, 3. Busca, 4. Fora do MVP, 5. Correções sobre material anterior, 6. ADR-005 (a escrever) — Prevenção de dupla reserva (+3 more)

### Community 26 - "ForbiddenDependencyTests"
Cohesion: 0.06
Nodes (26): ForbiddenDependencyTests, Fact, MemberData, Theory, TheoryData, LayerDependencyTests, Fact, ModuleBoundaryTests (+18 more)

### Community 27 - "Objetivo"
Cohesion: 0.20
Nodes (9): Breaking changes, Checklist final, Decisões tomadas, Evidência para o TCC, Mudanças, Objetivo, ⚠️ Revisão humana obrigatória, Riscos (+1 more)

### Community 28 - "IUserRepository.cs"
Cohesion: 0.22
Nodes (5): Email, Address, Booking.Domain.ValueObject, Booking.Domain.Interface.Repository.Module.Identity, system_net_mail

### Community 29 - "IUserRepository"
Cohesion: 0.36
Nodes (5): IUserRepository, Email, Guid, CancellationToken, Task

### Community 30 - "UserStatus"
Cohesion: 0.33
Nodes (5): UserStatus, Active, Deleted, Inactive, Suspended

### Community 31 - "Tokens de design"
Cohesion: 0.25
Nodes (7): As cinco regras, Como ressincronizar, Como usar no componente, ⚠️ Duas advertências, Estado atual, Fonte da verdade, Tokens de design

## Knowledge Gaps
- **272 isolated node(s):** `Microsoft.NET.Sdk`, `Booking.Domain.Entity.Module.Availability`, `Date`, `Name`, `Kind` (+267 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 315 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI` connect `decisions/README.md` to `ReflectionRules`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `Decisão` connect `ReflectionRules` to `decisions/README.md`, `ForbiddenDependencyTests`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `ForbiddenDependencyTests` connect `ForbiddenDependencyTests` to `Booking.ArchitectureTests.Rules`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `DomainException` (e.g. with `.Create()` and `.Issue()`) actually correct?**
  _`DomainException` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Microsoft.NET.Sdk`, `Booking.Domain.Entity.Module.Availability`, `Date` to the rest of the system?**
  _272 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CLAUDE.md` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `PROJECT-CONTEXT.md` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._