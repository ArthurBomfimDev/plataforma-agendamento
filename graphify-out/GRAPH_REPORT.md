# Graph Report - plataforma-agendamento  (2026-10-27)

## Corpus Check
- 445 files · ~380,814 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 91 file(s) not represented in the graph (top: (none) 83, .example 2, .props 2)

## Summary
- 3621 nodes · 8391 edges · 180 communities (172 shown, 8 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 915 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `01b03345`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CLAUDE.md
- plataforma-agendamento
- TimeRange
- ReflectionRules
- 1. Visão geral
- ADR-003 — Multi-tenancy por coluna `business_id`, com filtro global e RLS
- microsoft_entityframeworkcore
- 2. `Base/` restrito a cadastro sem regra de estado
- Booking.Infrastructure.csproj
- ADR-007 — Monólito modular com fronteira de módulo verificada pelo build
- http
- ADR-005 — Prevenção de dupla reserva por constraint de exclusão no PostgreSQL
- UserToken
- ADR-001 — Stack: React + Vite no frontend, .NET 10 no backend, PostgreSQL com PostGIS
- Customer
- BookingDbContext
- IntegrationFixture
- post-checkout
- post-commit
- ADR-009 — Paridade mobile completa no painel, como decisão de inclusão digital
- ADR-NNN — Título curto e afirmativo
- User
- RefreshToken
- Booking.Domain.Exceptions
- Componentes e telas — Etapas 5 e 6 concluídas
- Decisões de Produto — Blocos 1 e 2
- Decisão
- Objetivo
- 7. Modelo de domínio
- .ExecuteAsync
- availability/index.tsx
- sign-in/index.tsx
- AggregateRoot
- IdentityFixture
- Business
- BusinessMembership
- Appointment
- DomainException
- segmented-control/index.tsx
- .ExecuteAsync
- .SeedUser
- home/index.tsx
- business-detail/index.test.tsx
- JwtAccessTokenIssuer.cs
- .claude/CLAUDE.md
- SchedulingActor
- commit-msg
- booking-sent-route.tsx
- avatar/index.tsx
- cn
- react
- .ExecuteAsync
- AppointmentResponse
- ScheduleException
- compilerOptions
- ControllerBase
- ISecureTokenGenerator
- .NewTenantAsync
- availability-route.tsx
- appointments/index.tsx
- TestWorld.cs
- lucide-react
- AppointmentStatus
- .WriteTwoOverlappingAsync
- Service
- Booking.Domain.Entity.Base
- BusinessesController
- Holiday
- .GetSlotStartsAsync
- adapters.ts
- .AddAvailabilityModule
- search-result-card/index.tsx
- client.ts
- .AddIdentityModule
- availability/index.test.tsx
- Booking.Application.Common.Tenancy
- AvailabilityDomainTests
- .NewBusinessAsync
- PeopleControllers.cs
- .ExecuteAsync
- WorkSchedule
- .ModuleNamespacePattern
- components.json
- .ExecuteAsync
- .Grant
- Booking.Domain.ValueObject
- .Calculate
- ServiceProfessional
- Professional
- .ExecuteAsync
- .AddComplianceModule
- .ExecuteAsync
- .List
- package.json
- seed-demo.ts
- LogoutCommand
- dependencies
- IServiceCatalog
- IPeopleDirectory
- Booking.Domain.Entity.Module.Catalog
- ADR-014 — Avaliação do profissional e perfil público dividido
- ADR-016 — Geocodificação: porta, provedor por fase e confirmação pelo dono
- theme-toggle/index.tsx
- Documento Geral do Projeto
- compilerOptions
- TestWorld
- .SaveChangesAsync
- .ToResponse
- .RaceAsync
- .AddPeopleModule
- .ListActiveAsync
- ADR-013 — CPF opcional e verificação de identidade como porta
- ADR-017 — Intervalo bloqueado em colunas gravadas, não coluna gerada
- ADR-018 — Marca Vagoo e paleta azul
- status-chip/index.tsx
- IUnitOfWork
- AppointmentTests
- .ExecuteAsync
- ConsentRecord
- Booking.Infrastructure.Persistence.Context
- ADR-002 — Revogação da stack declarada no pitch
- ADR-008 — Hospedagem com PostGIS e `btree_gist`
- ADR-011 — Bun como gerenciador de pacotes e executor de scripts do frontend; Vite permanece o bundler
- ITenantContext
- Evidência — RNF-03: zero dupla reserva sob 50 requisições concorrentes
- SensitiveAccessLog
- LocationPrecision
- Booking.ArchitectureTests.Rules
- ADR-012 — Idade mínima de 18 anos e agendamento para terceiro
- paths
- PageRequest
- Marca Vagoo — ativos no Figma
- adapters.test.ts
- PROJECT-CONTEXT.md
- IIdentityMailer
- .C4_health_business_with_consent_creates_a_sensitive_appointment_and_logs_business_access
- Document
- button/index.tsx
- .RequiresSensitiveHandling
- main.tsx
- ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI
- .GetBlockedRangesAsync
- IBaseRepository
- decisions/README.md
- Decisões — modelo, localização, identidade e notificação
- devDependencies
- .AddCatalogModule
- CancellationParty
- AppointmentEvent
- tab-bar/index.tsx
- .BuildModel
- DomainExceptionHandler
- .Passes
- .NoViolations
- scripts
- 5. Decisões fechadas — produto
- BaseMapping
- ManageCurrentBusinessCommands.cs
- Tokens de design
- PendingExpirationWorker
- ConsentPurpose
- CardEstablishmentImage/index.tsx
- .BuildTargetModel
- HttpActorContext
- vite.config.ts
- 5. Regras de negócio
- .oxlintrc.json
- .ToPagedAsync
- BusinessStatus
- VerificationLevel
- DesignTimeDbContextFactory
- .BuildTargetModel
- .Collections_on_query_surfaces_are_paginated
- TestCalendar
- 6. Arquitetura
- .prettierrc.json
- vite-env.d.ts
- setup-env.sh
- booking_domain_enum_module_availability

## God Nodes (most connected - your core abstractions)
1. `DomainException` - 115 edges
2. `Appointment` - 103 edges
3. `Business` - 90 edges
4. `Professional` - 57 edges
5. `Booking.Domain.Entity.Base` - 53 edges
6. `Service` - 52 edges
7. `Booking.Domain.Exceptions` - 51 edges
8. `User` - 45 edges
9. `PageRequest` - 43 edges
10. `BookingDbContext` - 43 edges

## Surprising Connections (you probably didn't know these)
- `Contexto` --references--> `SetPublicProfileConsentCommand`  [INFERRED]
  docs/decisions/0014-avaliacao-do-profissional-e-perfil-publico.md → backend/src/Core/Booking.Application/Module/People/Commands/PeopleCommands.cs
- `3. Interpretação` --references--> `CancelMyAppointmentCommand`  [INFERRED]
  docs/tcc/evidencias/isolamento-de-tenant.md → backend/src/Core/Booking.Application/Module/Scheduling/Commands/SchedulingCommands.cs
- `Referências` --references--> `ConfirmLocationCommand`  [INFERRED]
  docs/decisions/0016-geocodificacao-porta-e-confirmacao.md → backend/src/Core/Booking.Application/Module/Tenancy/Commands/ManageCurrentBusinessCommands.cs
- `D — Constraint `EXCLUDE USING gist` sobre profissional e período` --references--> `AvailabilityCalculator`  [INFERRED]
  docs/decisions/0005-dupla-reserva-constraint-exclusao.md → backend/src/Core/Booking.Domain/DomainService/Module/Availability/AvailabilityCalculator.cs
- ``AvailabilityCalculator`` --references--> `AvailabilityCalculator`  [INFERRED]
  docs/produto/modelo-de-dominio.md → backend/src/Core/Booking.Domain/DomainService/Module/Availability/AvailabilityCalculator.cs

## Import Cycles
- None detected.

## Communities (180 total, 8 thin omitted)

### Community 0 - "CLAUDE.md"
Cohesion: 0.12
Nodes (16): 1. Stack e decisões fechadas, 2. Glossário canônico, 3.1 Mobile-first vale para o painel também, 3. As 6 regras de empacotamento, 4. Regras invioláveis, 5. Convenções de código, 6. Comandos, 7. Definition of Done (+8 more)

### Community 1 - "plataforma-agendamento"
Cohesion: 0.15
Nodes (13): Comandos, Configuração do clone, Dados de demonstração, Governança do repositório, Licença, plataforma-agendamento, Por onde começar, Por que `enforce_admins` está desligado (+5 more)

### Community 2 - "TimeRange"
Cohesion: 0.09
Nodes (28): AvailabilityCalculator, AvailabilityRequest, DateOnly, DateTimeOffset, Guid, IReadOnlyCollection, IReadOnlyList, List (+20 more)

### Community 3 - "ReflectionRules"
Cohesion: 0.18
Nodes (11): BaseUsageTests, Fact, PersistenceMappingTests, Fact, ReflectionRules, Assembly, IEnumerable, IReadOnlyList (+3 more)

### Community 4 - "1. Visão geral"
Cohesion: 0.13
Nodes (15): 10. Reputation, 12. Notifications ⚠️ módulo novo (decisão 22/09 #8), 13. Eventos de domínio, 14. Divergências em relação ao modelo do Gemini, 1. Visão geral, 5. People, 9. Serviços de domínio, `AvailabilityCalculator` (+7 more)

### Community 5 - "ADR-003 — Multi-tenancy por coluna `business_id`, com filtro global e RLS"
Cohesion: 0.13
Nodes (14): A — Banco por tenant, ADR-003 — Multi-tenancy por coluna `business_id`, com filtro global e RLS, Alternativas consideradas, B — Schema por tenant, C — Coluna `business_id` com filtro global do EF Core, Como saber que erramos, Consequências, Contexto (+6 more)

### Community 6 - "microsoft_entityframeworkcore"
Cohesion: 0.12
Nodes (16): AuditColumns, WorkScheduleMapping, UserTokenMapping, EntityTypeBuilder, BusinessMembershipMapping, EntityTypeBuilder, Booking.Infrastructure.Persistence.Mapping.Module.People, Booking.Infrastructure.Persistence.Mapping.Base (+8 more)

### Community 7 - "2. `Base/` restrito a cadastro sem regra de estado"
Cohesion: 0.10
Nodes (16): AssemblyReference, Assembly, AssemblyReference, Assembly, AssemblyReference, Assembly, ArchitectureConventions, FixturesAssembly (+8 more)

### Community 8 - "Booking.Infrastructure.csproj"
Cohesion: 0.07
Nodes (32): Microsoft.NET.Sdk, Microsoft.NET.Sdk, Microsoft.NET.Sdk, Microsoft.NET.Sdk, coverlet.collector, Microsoft.NET.Test.Sdk, xunit, xunit.runner.visualstudio (+24 more)

### Community 9 - "ADR-007 — Monólito modular com fronteira de módulo verificada pelo build"
Cohesion: 0.11
Nodes (17): A — Microsserviços, ADR-007 — Monólito modular com fronteira de módulo verificada pelo build, Alternativas consideradas, B — Monólito por camada, sem fronteira de módulo, C — Monólito modular com fronteira por convenção, Como saber que erramos, Consequências, Contexto (+9 more)

### Community 10 - "http"
Cohesion: 0.13
Nodes (15): ASPNETCORE_ENVIRONMENT, applicationUrl, commandName, dotnetRunMessages, environmentVariables, launchBrowser, applicationUrl, commandName (+7 more)

### Community 11 - "ADR-005 — Prevenção de dupla reserva por constraint de exclusão no PostgreSQL"
Cohesion: 0.13
Nodes (14): A — Verificação em código antes do `INSERT`, ADR-005 — Prevenção de dupla reserva por constraint de exclusão no PostgreSQL, Alternativas consideradas, B — Lock distribuído em Redis, C — Isolamento `SERIALIZABLE`, Como saber que erramos, Consequências, D — Constraint `EXCLUDE USING gist` sobre profissional e período (+6 more)

### Community 12 - "UserToken"
Cohesion: 0.06
Nodes (36): ConfirmEmailCommand, CancellationToken, Task, TimeProvider, ForgotPasswordCommand, CancellationToken, Task, TimeProvider (+28 more)

### Community 13 - "ADR-001 — Stack: React + Vite no frontend, .NET 10 no backend, PostgreSQL com PostGIS"
Cohesion: 0.12
Nodes (15): A — React + TypeScript + Vite · ASP.NET Core (.NET 10) · PostgreSQL + PostGIS, ADR-001 — Stack: React + Vite no frontend, .NET 10 no backend, PostgreSQL com PostGIS, Alternativas consideradas, B — Node.js + NestJS no backend, mantendo o que o pitch declarou, C — React Native para o app, como o pitch declarou, Como saber que erramos, Consequências, Contexto (+7 more)

### Community 14 - "Customer"
Cohesion: 0.08
Nodes (27): Customer, BirthDate, SocialName, UserId, DateOnly, Guid, CustomerMapping, A — Tipos de conta separados: `CustomerAccount`, `ProfessionalAccount`, `OwnerAccount` (+19 more)

### Community 15 - "BookingDbContext"
Cohesion: 0.13
Nodes (13): BookingDbContext, CurrentBusinessId, CancellationToken, Guid, ModelBuilder, Task, TenantScope, Guid (+5 more)

### Community 16 - "IntegrationFixture"
Cohesion: 0.10
Nodes (18): DatabaseServer, Origin, Task, ValueTask, IntegrationCollection, IntegrationFixture, Client, ConnectionString (+10 more)

### Community 19 - "ADR-009 — Paridade mobile completa no painel, como decisão de inclusão digital"
Cohesion: 0.13
Nodes (14): A — Painel só desktop, mobile depois se sobrar tempo, ADR-009 — Paridade mobile completa no painel, como decisão de inclusão digital, Alternativas consideradas, B — Painel mobile só para as telas críticas (ver agenda, aceitar pedido), C — Paridade completa em 390px, Como saber que erramos, Consequências, Contexto (+6 more)

### Community 20 - "ADR-NNN — Título curto e afirmativo"
Cohesion: 0.14
Nodes (13): A —, ADR-NNN — Título curto e afirmativo, Alternativas consideradas, B —, Como saber que erramos, Consequências, Contexto, Decisão (+5 more)

### Community 21 - "User"
Cohesion: 0.08
Nodes (21): User, Email, EmailConfirmedAt, FullName, PasswordHash, Status, DateTimeOffset, Email (+13 more)

### Community 22 - "RefreshToken"
Cohesion: 0.08
Nodes (25): CancellationToken, Task, DateTimeOffset, RefreshToken, ExpiresAt, ReplacedByTokenHash, RevokedAt, TokenHash (+17 more)

### Community 23 - "Booking.Domain.Exceptions"
Cohesion: 0.17
Nodes (14): Booking.Domain.Exceptions, Booking.Application.Module.Identity.Queries, Booking.UnitTests.Identity, Booking.Application.Common.Persistence, Booking.Application.Contracts.Identity, Booking.Infrastructure.Module.Identity.Repository, Booking.Domain.Enum.Module.Identity, Booking.Application.Module.Identity.Commands (+6 more)

### Community 24 - "Componentes e telas — Etapas 5 e 6 concluídas"
Cohesion: 0.17
Nodes (11): 1. Estrutura do arquivo, 2. Componentes (Etapa 5), 3. Telas (Etapa 6), 4. Agenda do dia — refeita com eixo de tempo contínuo, 5. Pendências abertas, 6. Próxima etapa — Etapa 7 (executada no Figma; registro original mantido), Componentes e telas — Etapas 5 e 6 concluídas, Decisões (+3 more)

### Community 25 - "Decisões de Produto — Blocos 1 e 2"
Cohesion: 0.17
Nodes (11): 0. Glossário canônico, 1.9 Receita e financeiro na interface, 1. Núcleo e proposta de valor, 2. Atores, papéis e identidade, 3. Busca, 4. Fora do MVP, 5. Correções sobre material anterior, 6. ADR-005 (a escrever) — Prevenção de dupla reserva (+3 more)

### Community 26 - "Decisão"
Cohesion: 0.12
Nodes (12): ForbiddenDependencyTests, Fact, TheoryData, PackageRules, IReadOnlyList, BackendRoot, DirectoryInfo, 6. `Converter/` manual obrigatório onde há snapshot ou máquina de estado (+4 more)

### Community 27 - "Objetivo"
Cohesion: 0.20
Nodes (9): Breaking changes, Checklist final, Decisões tomadas, Evidência para o TCC, Mudanças, Objetivo, ⚠️ Revisão humana obrigatória, Riscos (+1 more)

### Community 28 - "7. Modelo de domínio"
Cohesion: 0.11
Nodes (15): GetPublicBusinessQuery, SearchBusinessesQuery, CancellationToken, Guid, Task, Email, Address, GeoPoint (+7 more)

### Community 29 - ".ExecuteAsync"
Cohesion: 0.08
Nodes (22): IPasswordHasher, LoginCommand, CancellationToken, Task, TimeProvider, PasswordRules, RegisterUserCommand, CancellationToken (+14 more)

### Community 30 - "availability/index.tsx"
Cohesion: 0.12
Nodes (19): Breadcrumb(), BreadcrumbItem, BreadcrumbProps, countLabel(), SlotPeriod(), SlotPeriodProps, TIME_SLOT_CHIP_CLASSES, TimeSlotGroup() (+11 more)

### Community 31 - "sign-in/index.tsx"
Cohesion: 0.10
Nodes (30): LOGOTYPE_HEIGHT, LOGOTYPE_WIDTH, Logotype(), LogotypeProps, TextField(), TextFieldProps, Input(), HeroPanel() (+22 more)

### Community 32 - "AggregateRoot"
Cohesion: 0.24
Nodes (6): AggregateRoot, DomainEvents, IReadOnlyCollection, List, IDomainEvent, Booking.Domain.Event.Base

### Community 33 - "IdentityFixture"
Cohesion: 0.08
Nodes (31): IdentityFixture, AccessTokens, Clock, Hasher, JwtSettings, Mailer, Policy, RefreshTokens (+23 more)

### Community 34 - "Business"
Cohesion: 0.06
Nodes (37): Business, AutoConfirm, BookingHorizonDays, CancellationWindowHours, Category, City, District, Document (+29 more)

### Community 35 - "BusinessMembership"
Cohesion: 0.09
Nodes (24): BusinessMembership, AcceptedAt, BusinessId, RemovedAt, Role, Status, UserId, DateTimeOffset (+16 more)

### Community 36 - "Appointment"
Cohesion: 0.06
Nodes (33): Appointment, BlockedEndsAt, BlockedRange, BlockedStartsAt, BufferAfterMinutes, BufferBeforeMinutes, BusinessId, BusinessNotes (+25 more)

### Community 37 - "DomainException"
Cohesion: 0.09
Nodes (14): DomainException, Code, Details, UserDomainTests, Fact, InlineData, Theory, TenancyAndCatalogDomainTests (+6 more)

### Community 38 - "segmented-control/index.tsx"
Cohesion: 0.18
Nodes (12): INDICATOR_TRANSITION, SegmentedControl(), SegmentedControlOption, SegmentedControlProps, ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle() (+4 more)

### Community 39 - ".ExecuteAsync"
Cohesion: 0.08
Nodes (27): AccessToken, BusinessContext, DateTimeOffset, Guid, CancellationToken, Guid, Task, GetCurrentUserQuery (+19 more)

### Community 40 - ".SeedUser"
Cohesion: 0.22
Nodes (11): ConfirmEmailRequest, ForgotPasswordRequest, LoginRequest, LogoutRequest, RefreshSessionRequest, RegisterUserRequest, ResetPasswordRequest, AuthFlowTests (+3 more)

### Community 41 - "home/index.tsx"
Cohesion: 0.15
Nodes (14): CONTENT_BOTTOM_PADDING, ITEMS, BottomNavigation(), BottomNavigationProps, NavigationItemId, CardEstablishmentProps, CategoryCard(), CategoryCardProps (+6 more)

### Community 42 - "business-detail/index.test.tsx"
Cohesion: 0.09
Nodes (25): render(), screen(), BookingBusiness, BookingReviewScreenProps, render(), screen(), BookingSentScreenProps, BusinessDetailScreen() (+17 more)

### Community 43 - "JwtAccessTokenIssuer.cs"
Cohesion: 0.08
Nodes (23): AssemblyReference, Assembly, Program, BookingApiFactory, ConnectionString, Booking.Infrastructure, Booking.Infrastructure.Module.Identity.Security, Booking.Api.Common (+15 more)

### Community 45 - "SchedulingActor"
Cohesion: 0.30
Nodes (4): ServiceSnapshot, DateTimeOffset, Guid, SchedulingActor

### Community 47 - "booking-sent-route.tsx"
Cohesion: 0.12
Nodes (37): ADR-0012, NotFoundScreen(), errorMessage(), MESSAGES, useBusinesses(), useCancelAppointment(), useMe(), useMyAppointments() (+29 more)

### Community 48 - "avatar/index.tsx"
Cohesion: 0.23
Nodes (6): Avatar(), AvatarProps, Avatar(), AvatarFallback(), AvatarImage(), ref_base_ui_react_avatar

### Community 49 - "cn"
Cohesion: 0.12
Nodes (24): STATUSES, AvailabilityDayButton(), MARKER_CLASSES, DayMarker(), DayMarkerProps, HolidayMarker(), HolidayMarkerProps, capitalize() (+16 more)

### Community 50 - "react"
Cohesion: 0.08
Nodes (17): ConfirmDialogProps, TextAreaField(), TextAreaFieldProps, AlertDialog(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogTitle() (+9 more)

### Community 51 - ".ExecuteAsync"
Cohesion: 0.11
Nodes (19): RegisterBusinessCommand, CancellationToken, Guid, Task, TimeProvider, RegisterBusinessRequest, IBusinessRepository, CancellationToken (+11 more)

### Community 52 - "AppointmentResponse"
Cohesion: 0.06
Nodes (58): Action, BusinessMembershipInfo, BusinessSchedulingInfo, CancellationToken, Guid, Task, ManageAppointmentCommand, SlotGuard (+50 more)

### Community 53 - "ScheduleException"
Cohesion: 0.05
Nodes (28): BaseEntity, Id, Guid, IAuditable, ITenantScoped, BusinessId, Guid, ScheduleException (+20 more)

### Community 54 - "compilerOptions"
Cohesion: 0.07
Nodes (29): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, ignoreDeprecations, jsx, lib (+21 more)

### Community 55 - "ControllerBase"
Cohesion: 0.15
Nodes (21): AddScheduleExceptionCommand, RemoveScheduleExceptionCommand, ListWorkSchedulesQuery, PublicAvailabilityController, ScheduleExceptionsController, WorkSchedulesController, CancellationToken, DateOnly (+13 more)

### Community 56 - "ISecureTokenGenerator"
Cohesion: 0.10
Nodes (20): GeneratedToken, ISecureTokenGenerator, JwtAccessTokenIssuer, IOptions, JwtOptions, AccessTokenMinutes, Audience, Issuer (+12 more)

### Community 57 - ".NewTenantAsync"
Cohesion: 0.25
Nodes (9): HttpResponseMessage, Task, TenantIsolationTests, Fact, Guid, ITestOutputHelper, Task, HttpStatusCode (+1 more)

### Community 58 - "availability-route.tsx"
Cohesion: 0.12
Nodes (39): ErrorScreen(), LoadingScreen(), isNotFound(), useAvailabilityCalendars(), useBusiness(), useDaySlots(), useProfessionals(), useRequestAppointment() (+31 more)

### Community 59 - "appointments/index.tsx"
Cohesion: 0.09
Nodes (29): ConfirmDialog(), AppointmentsScreen(), dayLabel(), emptyState(), expiryLabel(), parseDay(), TODO: a tela de avaliação ainda não existe; o botão não faz nada., summary() (+21 more)

### Community 60 - "TestWorld.cs"
Cohesion: 0.13
Nodes (16): Cnpj, Concurrently, Booking.IntegrationTests.Scheduling, Booking.IntegrationTests.Tenancy, Booking.Arguments.Module.Scheduling, Booking.IntegrationTests.Infrastructure, microsoft_entityframeworkcore_diagnostics, microsoft_extensions_dependencyinjection (+8 more)

### Community 61 - "lucide-react"
Cohesion: 0.08
Nodes (26): Button(), VerifiedBadge(), distanceFormat, ratingFormat, CardEstablishment(), WIDTHS, PageContainer(), PageContainerProps (+18 more)

### Community 62 - "AppointmentStatus"
Cohesion: 0.18
Nodes (10): AppointmentStatus, Cancelled, Completed, Confirmed, Expired, NoShow, Pending, Rejected (+2 more)

### Community 63 - ".WriteTwoOverlappingAsync"
Cohesion: 0.10
Nodes (18): DirectDbContext, Db, LastPostgresError, FailureCapture, Last, CancellationToken, Exception, PostgresException (+10 more)

### Community 64 - "Service"
Cohesion: 0.11
Nodes (14): Service, BufferAfterMinutes, BufferBeforeMinutes, BusinessId, Description, DurationMinutes, IsActive, Name (+6 more)

### Community 65 - "Booking.Domain.Entity.Base"
Cohesion: 0.06
Nodes (36): Booking.Arguments.Module.Compliance, Booking.Domain.Entity.Base, Booking.Domain.Enum.Module.Compliance, Booking.Application.Module.Availability.Commands, Booking.Application.Contracts.Scheduling, Booking.UnitTests.Scheduling, Booking.Application.Module.Compliance.Queries, Booking.Application.Contracts.Catalog (+28 more)

### Community 66 - "BusinessesController"
Cohesion: 0.18
Nodes (17): ConfirmLocationRequest, SearchBusinessesRequest, UpdateAddressRequest, UpdateSchedulingPolicyRequest, BusinessesController, AllowAnonymous, CancellationToken, Guid (+9 more)

### Community 67 - "Holiday"
Cohesion: 0.18
Nodes (10): Holiday, Date, Kind, Name, DateOnly, HolidayKind, Fixed, Movable (+2 more)

### Community 68 - ".GetSlotStartsAsync"
Cohesion: 0.18
Nodes (14): AvailabilityService, CancellationToken, DateTimeOffset, Guid, IReadOnlyList, Task, TimeProvider, IScheduleExceptionRepository (+6 more)

### Community 69 - "adapters.ts"
Cohesion: 0.11
Nodes (28): appointmentsApi, authApi, availabilityApi, businessesApi, customersApi, AvailabilityTarget, queryKeys, AddressResponse (+20 more)

### Community 70 - ".AddAvailabilityModule"
Cohesion: 0.15
Nodes (16): IAvailabilityService, SlotQuery, CancellationToken, DateOnly, DateTimeOffset, Guid, IReadOnlyList, Task (+8 more)

### Community 71 - "search-result-card/index.tsx"
Cohesion: 0.10
Nodes (20): FilterChip(), FilterChipProps, SearchField(), SearchFieldProps, NO_AVAILABILITY_MESSAGE, priceFormat, priceWholeFormat, SearchResultCard() (+12 more)

### Community 72 - "client.ts"
Cohesion: 0.19
Nodes (12): api(), parse(), refreshAccessToken(), RequestOptions, send(), session, url(), apiBaseUrl (+4 more)

### Community 73 - ".AddIdentityModule"
Cohesion: 0.14
Nodes (16): IAccessTokenIssuer, IdentityPolicy, EmailConfirmationLifetime, PasswordResetLifetime, RefreshTokenLifetime, TimeSpan, RefreshSessionCommand, TimeProvider (+8 more)

### Community 74 - "availability/index.test.tsx"
Cohesion: 0.15
Nodes (17): CalendarDayInfo, firstDay, render(), screen(), CLOSED_WEEKDAYS, dateKey(), FULLY_BOOKED, getMockDayInfo() (+9 more)

### Community 75 - "Booking.Application.Common.Tenancy"
Cohesion: 0.14
Nodes (13): TenantClaims, Booking.Domain.Enum.Module.Availability, Booking.Arguments.Module.Availability, Booking.Domain.DomainService.Module.Availability, Booking.Application.Module.Availability.Converter, Booking.Domain.Entity.Module.Availability, Booking.UnitTests.Availability, Booking.Infrastructure.Module.Availability.Repository (+5 more)

### Community 76 - "AvailabilityDomainTests"
Cohesion: 0.14
Nodes (11): BrazilianHolidays, DateOnly, AvailabilityDomainTests, Fact, Guid, InlineData, Theory, TimeOnly (+3 more)

### Community 77 - ".NewBusinessAsync"
Cohesion: 0.32
Nodes (7): DateTimeOffset, ServiceSpec, DayOfWeek, DoubleBookingTests, Fact, ITestOutputHelper, Task

### Community 78 - "PeopleControllers.cs"
Cohesion: 0.17
Nodes (18): CustomersController, ProfessionalsController, PublicProfessionalsController, CancellationToken, Guid, HttpDelete, HttpGet, HttpPost (+10 more)

### Community 79 - ".ExecuteAsync"
Cohesion: 0.13
Nodes (14): CancellationToken, Guid, Task, PeopleConverter, CreateProfessionalRequest, CustomerResponse, ProfessionalResponse, PublicProfessionalResponse (+6 more)

### Community 80 - "WorkSchedule"
Cohesion: 0.12
Nodes (18): WorkSchedule, BusinessId, DayOfWeek, EffectiveFrom, EffectiveTo, EndTime, ProfessionalId, StartTime (+10 more)

### Community 81 - ".ModuleNamespacePattern"
Cohesion: 0.16
Nodes (12): ModuleBoundaryTests, Fact, MemberData, Theory, TheoryData, NamespaceRules, Assembly, IEnumerable (+4 more)

### Community 82 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 83 - ".ExecuteAsync"
Cohesion: 0.18
Nodes (17): CancellationToken, Guid, Task, AvailabilityConverter, AddScheduleExceptionRequest, AddWorkScheduleRequest, AvailabilityCalendarResponse, AvailabilityDayResponse (+9 more)

### Community 84 - ".Grant"
Cohesion: 0.17
Nodes (13): GetConsentVersionsQuery, ConsentVersionsResponse, ConsentsController, AllowAnonymous, CancellationToken, HttpDelete, HttpGet, HttpPost (+5 more)

### Community 85 - "Booking.Domain.ValueObject"
Cohesion: 0.13
Nodes (12): Booking.Api.Module.Tenancy, Booking.Application.Module.Tenancy.Commands, Booking.UnitTests.Tenancy, Booking.Arguments.Module.Tenancy, Booking.Domain.Enum.Module.Tenancy, Booking.Domain.ValueObject, Booking.Domain.Entity.Module.Tenancy, Booking.Application.Module.Tenancy.Converter (+4 more)

### Community 86 - ".Calculate"
Cohesion: 0.27
Nodes (8): AvailabilityCalculatorTests, DateOnly, DateTimeOffset, Fact, Guid, IReadOnlyCollection, IReadOnlyList, TimeZoneInfo

### Community 87 - "ServiceProfessional"
Cohesion: 0.16
Nodes (8): ServiceProfessional, BusinessId, DurationOverrideMinutes, PriceOverrideCents, ProfessionalId, ServiceId, Guid, ServiceProfessionalMapping

### Community 88 - "Professional"
Cohesion: 0.11
Nodes (17): Professional, Bio, BusinessId, BusinessMembershipId, DisplayName, IsActive, IsPubliclyVisible, PublicProfileConsentAt (+9 more)

### Community 89 - ".ExecuteAsync"
Cohesion: 0.23
Nodes (10): CancellationToken, Task, BusinessConverter, AddressResponse, BusinessDetailResponse, BusinessResponse, BusinessSearchItemResponse, PublicBusinessResponse (+2 more)

### Community 90 - ".AddComplianceModule"
Cohesion: 0.15
Nodes (12): IComplianceGateway, CancellationToken, DateTimeOffset, Guid, Task, ComplianceGateway, CancellationToken, DateTimeOffset (+4 more)

### Community 91 - ".ExecuteAsync"
Cohesion: 0.20
Nodes (9): CancellationToken, Guid, Task, CancellationToken, DateOnly, DateTimeOffset, Guid, Task (+1 more)

### Community 92 - ".List"
Cohesion: 0.23
Nodes (13): EnableProfessionalRequest, ServicesController, CancellationToken, Guid, HttpDelete, HttpGet, HttpPost, HttpPut (+5 more)

### Community 93 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, type, version, @base-ui/react, @fontsource-variable/ibm-plex-sans, oxlint, prettier (+11 more)

### Community 94 - "seed-demo.ts"
Cohesion: 0.16
Nodes (18): ApiCallError, approvePendingBusinesses(), BUSINESSES, call(), cnpjFrom(), CUSTOMER, DemoBusiness, DemoProfessional (+10 more)

### Community 95 - "LogoutCommand"
Cohesion: 0.26
Nodes (10): LogoutCommand, CancellationToken, Task, TimeProvider, AuthController, CancellationToken, HttpPost, IActionResult (+2 more)

### Community 96 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @base-ui/react, class-variance-authority, cn, date-fns, @fontsource-variable/ibm-plex-sans, framer-motion, lucide-react (+11 more)

### Community 97 - "IServiceCatalog"
Cohesion: 0.19
Nodes (13): BookableService, IServiceCatalog, CancellationToken, Guid, IReadOnlyCollection, IReadOnlySet, Task, ServiceCatalog (+5 more)

### Community 98 - "IPeopleDirectory"
Cohesion: 0.27
Nodes (9): IPeopleDirectory, ProfessionalInfo, CancellationToken, Guid, Task, PeopleDirectory, CancellationToken, Guid (+1 more)

### Community 99 - "Booking.Domain.Entity.Module.Catalog"
Cohesion: 0.17
Nodes (9): PublicServicesController, Booking.Api.Module.Catalog, Booking.Application.Module.Catalog.Queries, Booking.Infrastructure.Module.Catalog.Repository, Booking.Domain.Interface.Repository.Module.Catalog, Booking.Domain.Entity.Module.Catalog, Booking.Application.Module.Catalog.Commands, Booking.Arguments.Module.Catalog (+1 more)

### Community 100 - "ADR-014 — Avaliação do profissional e perfil público dividido"
Cohesion: 0.14
Nodes (13): A — Perfil inteiro só com consentimento, avaliação só do estabelecimento (decisões 2.7 e 2.10), ADR-014 — Avaliação do profissional e perfil público dividido, Alternativas consideradas, B — Nome sempre público; perfil completo com consentimento; nota opcional do profissional na mesma avaliação, C — Avaliação por par serviço × profissional, Como saber que erramos, Consequências, Contexto (+5 more)

### Community 101 - "ADR-016 — Geocodificação: porta, provedor por fase e confirmação pelo dono"
Cohesion: 0.14
Nodes (13): A — Ponto do geocodificador, sem confirmação, ADR-016 — Geocodificação: porta, provedor por fase e confirmação pelo dono, Alternativas consideradas, B — Ponto digitado ou marcado pelo dono, sem geocodificador, C — Geocodificador dá o palpite, o dono confirma o pino; provedor atrás de porta, Como saber que erramos, Consequências, O que fica mais difícil (+5 more)

### Community 102 - "theme-toggle/index.tsx"
Cohesion: 0.20
Nodes (12): ThemeToggle(), ThemeToggleProps, DARK_QUERY, subscribeToSystemTheme(), usePrefersDark(), useResolvedTheme(), THEME_STORAGE_KEY, useThemeStore (+4 more)

### Community 103 - "Documento Geral do Projeto"
Cohesion: 0.09
Nodes (22): 10. Conformidade com a LGPD, 11.1 Método, 11.2 Hipóteses, 11.3 Requisitos não funcionais medíveis, 11.4 Dados de demonstração, 11. Método e avaliação, 12.1 O que existe hoje, 12.2 O recorte proposto (+14 more)

### Community 104 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 105 - "TestWorld"
Cohesion: 0.22
Nodes (13): TestBusiness, TestService, TestUser, TestWorld, Client, DateTimeOffset, Guid, HttpClient (+5 more)

### Community 106 - ".SaveChangesAsync"
Cohesion: 0.20
Nodes (11): CancellationToken, Task, CancellationToken, Guid, Task, SaveServiceRequest, CancellationToken, Guid (+3 more)

### Community 107 - ".ToResponse"
Cohesion: 0.25
Nodes (10): CatalogConverter, IEnumerable, CancellationToken, Guid, Task, PublicServiceResponse, ServiceProfessionalResponse, ServiceResponse (+2 more)

### Community 108 - ".RaceAsync"
Cohesion: 0.13
Nodes (12): HttpClient, HttpRequestMessage, HttpResponseMessage, IReadOnlyList, Task, RaceResult, DateTimeOffset, Func (+4 more)

### Community 109 - ".AddPeopleModule"
Cohesion: 0.21
Nodes (15): CreateProfessionalCommand, RegisterCustomerCommand, SetPublicProfileConsentCommand, UpdateProfessionalCommand, TimeProvider, GetMyCustomerProfileQuery, ListProfessionalsQuery, ListPublicProfessionalsQuery (+7 more)

### Community 110 - ".ListActiveAsync"
Cohesion: 0.17
Nodes (13): ListMyConsentsQuery, CancellationToken, Task, IConsentRecordRepository, CancellationToken, Guid, IReadOnlyList, Task (+5 more)

### Community 111 - "ADR-013 — CPF opcional e verificação de identidade como porta"
Cohesion: 0.12
Nodes (15): A — CPF obrigatório no cadastro, sem verificação, ADR-013 — CPF opcional e verificação de identidade como porta, Alternativas consideradas, B — CPF obrigatório e verificado na base oficial, como faz a Uber, C — CPF opcional, pedido só quando há finalidade, e verificação como porta sem adaptador, Como saber que erramos, Consequências, Contexto (+7 more)

### Community 112 - "ADR-017 — Intervalo bloqueado em colunas gravadas, não coluna gerada"
Cohesion: 0.12
Nodes (15): A — Coluna gerada com função própria marcada como `IMMUTABLE`, ADR-017 — Intervalo bloqueado em colunas gravadas, não coluna gerada, Alternativas consideradas, B — Calcular o intervalo dentro da própria constraint, a partir de `starts_at` e dos buffers, C — Colunas comuns gravadas pela aplicação, com check de coerência, Como saber que erramos, Consequências, Contexto (+7 more)

### Community 113 - "ADR-018 — Marca Vagoo e paleta azul"
Cohesion: 0.12
Nodes (15): A — Manter o azul-água da R4 e usar a marca só no logotipo, ADR-018 — Marca Vagoo e paleta azul, Alternativas consideradas, B — Seguir a marca e revogar a proibição de azul, C — Seguir a marca com `#3B82F6` também no fundo do botão, com texto escuro, Como saber que erramos, Consequências, Contexto (+7 more)

### Community 114 - "status-chip/index.tsx"
Cohesion: 0.21
Nodes (10): AppointmentCard(), AppointmentCardProps, STATUS, StatusChip(), AppointmentStatus, StatusChipProps, Badge(), badgeVariants (+2 more)

### Community 115 - "IUnitOfWork"
Cohesion: 0.16
Nodes (22): IUnitOfWork, ActorContextExtensions, Guid, IActorContext, BusinessId, BusinessRole, UserId, Guid (+14 more)

### Community 116 - "AppointmentTests"
Cohesion: 0.23
Nodes (4): BookingPolicy, AppointmentTests, DateTimeOffset, Fact

### Community 117 - ".ExecuteAsync"
Cohesion: 0.22
Nodes (9): GrantConsentCommand, RevokeConsentCommand, CancellationToken, Task, TimeProvider, ConsentResponse, GrantConsentRequest, DateTimeOffset (+1 more)

### Community 118 - "ConsentRecord"
Cohesion: 0.17
Nodes (10): ConsentRecord, GrantedAt, Purpose, RevokedAt, UserId, Version, DateTimeOffset, Guid (+2 more)

### Community 119 - "Booking.Infrastructure.Persistence.Context"
Cohesion: 0.08
Nodes (30): DateOnly, DateTimeOffset, Guid, MigrationBuilder, InitialIdentity, DateOnly, DateTimeOffset, Guid (+22 more)

### Community 120 - "ADR-002 — Revogação da stack declarada no pitch"
Cohesion: 0.13
Nodes (14): A — Manter o pitch como referência e ajustar o projeto a ele, ADR-002 — Revogação da stack declarada no pitch, Alternativas consideradas, B — Deixar a mudança implícita na ADR-001, C — Revogar formalmente o pitch, item por item, Como saber que erramos, Consequências, Contexto (+6 more)

### Community 121 - "ADR-008 — Hospedagem com PostGIS e `btree_gist`"
Cohesion: 0.13
Nodes (14): A — Banco gerenciado no Azure, via Azure for Students, ADR-008 — Hospedagem com PostGIS e `btree_gist`, Alternativas consideradas, B — PostgreSQL em camada gratuita de outro provedor, C — VPS com a mesma imagem do Docker Compose, Como saber que erramos, Consequências, Critérios de decisão (+6 more)

### Community 122 - "ADR-011 — Bun como gerenciador de pacotes e executor de scripts do frontend; Vite permanece o bundler"
Cohesion: 0.12
Nodes (15): A — Continuar com npm, ADR-011 — Bun como gerenciador de pacotes e executor de scripts do frontend; Vite permanece o bundler, Alternativas consideradas, B — Bun como gerenciador de pacotes e executor de scripts, mantendo o Vite, C — Bun também como bundler, dev server e runtime, Como saber que erramos, Consequências, Contexto (+7 more)

### Community 123 - "ITenantContext"
Cohesion: 0.12
Nodes (13): ITenantContext, BusinessId, Guid, TenantContextExtensions, Guid, HttpTenantContext, BusinessId, Guid (+5 more)

### Community 124 - "Evidência — RNF-03: zero dupla reserva sob 50 requisições concorrentes"
Cohesion: 0.13
Nodes (13): 1. Ambiente, 2. O que cada teste faz e o que foi observado, 3. Interpretação, 4. Limitações, Evidência — isolamento entre estabelecimentos (multi-tenancy, ADR-003), 1. Ambiente, 3. Resultado — evidência, 4. Interpretação (+5 more)

### Community 125 - "SensitiveAccessLog"
Cohesion: 0.16
Nodes (12): SensitiveAccessLog, Action, ActorUserId, AppointmentId, BusinessId, OccurredAt, DateTimeOffset, Guid (+4 more)

### Community 126 - "LocationPrecision"
Cohesion: 0.12
Nodes (15): LocationPrecision, City, Locality, Rooftop, Street, Contexto, 5.1 Princípio, 5.2 Campos novos em `Business` (+7 more)

### Community 127 - "Booking.ArchitectureTests.Rules"
Cohesion: 0.31
Nodes (5): Booking.ArchitectureTests.Rules, Booking.ArchitectureTests, Booking.ArchitectureTests.Support, netarchtest_rules, system_text_regularexpressions

### Community 128 - "ADR-012 — Idade mínima de 18 anos e agendamento para terceiro"
Cohesion: 0.14
Nodes (14): A — Cadastro aberto a qualquer idade, com consentimento de responsável para menores, ADR-012 — Idade mínima de 18 anos e agendamento para terceiro, Alternativas consideradas, B — Cadastro só para maiores, com agendamento para outra pessoa, Como saber que erramos, Consequências, Contexto, Decisão (+6 more)

### Community 129 - "paths"
Cohesion: 0.14
Nodes (13): compilerOptions, baseUrl, ignoreDeprecations, paths, files, @components/*, @features/*, @global/* (+5 more)

### Community 130 - "PageRequest"
Cohesion: 0.10
Nodes (25): CancellationToken, Guid, Task, PagedResult, IReadOnlyList, PageRequest, CancellationToken, Task (+17 more)

### Community 131 - "Marca Vagoo — ativos no Figma"
Cohesion: 0.17
Nodes (7): Ativos de referência na seção Marca, Componentes, Identidade, Marca Vagoo — ativos no Figma, Onde o logotipo aparece, Pendências, Regra de uso

### Community 132 - "adapters.test.ts"
Cohesion: 0.48
Nodes (5): streetLine(), toCustomerAppointment(), readBookingSearch(), readSentSearch(), validInstant()

### Community 133 - "PROJECT-CONTEXT.md"
Cohesion: 0.10
Nodes (19): 10. Contradições resolvidas — não reabrir, 11. Pendências abertas, 12. Recorte de entrega e o que falta, 14. Restrições permanentes, 15. Regras de trabalho, 16. Próximo passo, 1. O que é, 2. Estado atual (26/10) (+11 more)

### Community 134 - "IIdentityMailer"
Cohesion: 0.23
Nodes (7): IIdentityMailer, CancellationToken, Task, LoggingIdentityMailer, CancellationToken, ILogger, Task

### Community 135 - ".C4_health_business_with_consent_creates_a_sensitive_appointment_and_logs_business_access"
Cohesion: 0.36
Nodes (5): IdempotencyAndConsentTests, Fact, Guid, ITestOutputHelper, Task

### Community 136 - "Document"
Cohesion: 0.23
Nodes (6): Document, Kind, Number, DocumentKind, Cnpj, Cpf

### Community 137 - "button/index.tsx"
Cohesion: 0.24
Nodes (7): SIZE_CLASSES, VARIANT_CLASSES, ButtonProps, DEFAULT_LOCATION, TODO: trocar pela localização do aparelho (regra 5 de empacotamento: atrás de…, TopBar(), TopBarProps

### Community 138 - ".RequiresSensitiveHandling"
Cohesion: 0.12
Nodes (18): BusinessCategory, Beleza, Saude, BusinessCategoryExtensions, A — Tabela `category`, com `RequiresSensitiveHandling` como coluna, ADR-015 — Categoria como enum, Alternativas consideradas, B — Enum em código (+10 more)

### Community 139 - "main.tsx"
Cohesion: 0.15
Nodes (15): App(), useApplyTheme(), frontend_src_index, createQueryClient(), frontend_src_lib_toast_slide, frontend_src_lib_toast_toastcontainer, queryClient, AppRoutes() (+7 more)

### Community 140 - "ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI"
Cohesion: 0.18
Nodes (10): ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI, Como saber que erramos, Consequências, Contexto, O que fica mais difícil, O que fica mais fácil, O que passa a ser proibido, Premissa não verificada (+2 more)

### Community 141 - ".GetBlockedRangesAsync"
Cohesion: 0.14
Nodes (14): BlockedRange, IAgendaOccupancy, CancellationToken, DateTimeOffset, Guid, IReadOnlyList, Task, AgendaOccupancy (+6 more)

### Community 142 - "IBaseRepository"
Cohesion: 0.29
Nodes (4): IBaseRepository, CancellationToken, Guid, Task

### Community 143 - "decisions/README.md"
Cohesion: 0.22
Nodes (6): Como escrever, Decisões arquiteturais (ADRs), Notas sobre a fila, Por que ADR, Status possíveis, Índice

### Community 144 - "Decisões — modelo, localização, identidade e notificação"
Cohesion: 0.20
Nodes (9): 3. Reputação e perfil público, 4. Categoria como enum, 6.1 Lembretes viram configuração, 6.2 Conteúdo da notificação, 6.3 Canais, 6.4 WhatsApp, 6. Notificações, 7. ADRs a corrigir ou escrever (+1 more)

### Community 145 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, oxlint, prettier, @types/node, @types/react, @types/react-dom, typescript, vite (+2 more)

### Community 146 - ".AddCatalogModule"
Cohesion: 0.44
Nodes (9): CreateServiceCommand, DisableProfessionalCommand, EnableProfessionalCommand, UpdateServiceCommand, ListPublicServicesQuery, ListServicesQuery, IServiceProfessionalRepository, IServiceRepository (+1 more)

### Community 147 - "CancellationParty"
Cohesion: 0.25
Nodes (7): AppointmentSource, Counter, Online, CancellationParty, Business, Customer, System

### Community 148 - "AppointmentEvent"
Cohesion: 0.20
Nodes (11): AppointmentEvent, ActorRole, ActorUserId, AppointmentId, BusinessId, FromStatus, Note, OccurredAt (+3 more)

### Community 149 - "tab-bar/index.tsx"
Cohesion: 0.27
Nodes (9): TabBar(), TabBarItem, TabBarProps, Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger() (+1 more)

### Community 150 - ".BuildModel"
Cohesion: 0.22
Nodes (8): BookingDbContextModelSnapshot, DateOnly, DateTimeOffset, Guid, ModelBuilder, Point, TimeOnly, ModelSnapshot

### Community 151 - "DomainExceptionHandler"
Cohesion: 0.25
Nodes (7): DomainExceptionHandler, CancellationToken, Exception, ValueTask, HttpContext, IExceptionHandler, IProblemDetailsService

### Community 152 - ".Passes"
Cohesion: 0.24
Nodes (6): MemberData, Theory, LayerDependencyTests, Fact, ArchAssert, TestResult

### Community 153 - ".NoViolations"
Cohesion: 0.28
Nodes (5): IdentifierTests, ProbeEntity, Fact, IReadOnlyCollection, 3. `Guid` v7 em todas as entidades

### Community 154 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, format, format:check, lint, preview, test (+1 more)

### Community 155 - "5. Decisões fechadas — produto"
Cohesion: 0.22
Nodes (9): 5. Decisões fechadas — produto, Avaliação, Feriados, Glossário — a palavra "cliente" está banida, Identidade, Localização, Matriz de permissões, Notificações (fora do recorte de entrega, decisão mantida) (+1 more)

### Community 156 - "BaseMapping"
Cohesion: 0.24
Nodes (7): BaseMapping, DateTimeOffset, EntityTypeBuilder, AppointmentEventMapping, AppointmentMapping, EntityTypeBuilder, IEntityTypeConfiguration

### Community 157 - "ManageCurrentBusinessCommands.cs"
Cohesion: 0.47
Nodes (7): ConfirmLocationCommand, CurrentBusinessLoader, SubmitBusinessCommand, UpdateAddressCommand, UpdateSchedulingPolicyCommand, TimeProvider, GetCurrentBusinessQuery

### Community 158 - "Tokens de design"
Cohesion: 0.29
Nodes (6): As cinco regras, Como ressincronizar, Como usar no componente, ⚠️ Duas advertências, Fonte da verdade, Tokens de design

### Community 159 - "PendingExpirationWorker"
Cohesion: 0.25
Nodes (7): PendingExpirationWorker, CancellationToken, ILogger, Task, TimeSpan, BackgroundService, IServiceScopeFactory

### Community 160 - "ConsentPurpose"
Cohesion: 0.29
Nodes (5): ConsentTexts, ConsentPurpose, Marketing, PublicProfile, SensitiveScheduling

### Community 161 - "CardEstablishmentImage/index.tsx"
Cohesion: 0.47
Nodes (3): BASE_CLASS_NAME, CardEstablishmentImage(), CardEstablishmentImageProps

### Community 162 - ".BuildTargetModel"
Cohesion: 0.29
Nodes (6): DateOnly, DateTimeOffset, Guid, ModelBuilder, Point, TimeOnly

### Community 163 - "HttpActorContext"
Cohesion: 0.33
Nodes (6): HttpActorContext, BusinessId, BusinessRole, UserId, Guid, IHttpContextAccessor

### Community 164 - "vite.config.ts"
Cohesion: 0.29
Nodes (5): ADR-0011, ref_node_path, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 165 - "5. Regras de negócio"
Cohesion: 0.29
Nodes (7): 5.1 Agendamento, 5.2 Ciclo de vida do agendamento, 5.3 Preço e duração congelados, 5.4 Feriados, 5.5 Avaliação, 5.6 Verificação do estabelecimento, 5. Regras de negócio

### Community 166 - ".oxlintrc.json"
Cohesion: 0.29
Nodes (6): overrides, plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 167 - ".ToPagedAsync"
Cohesion: 0.40
Nodes (4): Paging, CancellationToken, IQueryable, Task

### Community 168 - "BusinessStatus"
Cohesion: 0.33
Nodes (5): BusinessStatus, Active, Draft, PendingReview, Suspended

### Community 169 - "VerificationLevel"
Cohesion: 0.33
Nodes (5): VerificationLevel, Rejected, UnderReview, Unverified, Verified

### Community 170 - "DesignTimeDbContextFactory"
Cohesion: 0.40
Nodes (5): DesignTimeDbContextFactory, NoTenantContext, BusinessId, Guid, IDesignTimeDbContextFactory

### Community 171 - ".BuildTargetModel"
Cohesion: 0.33
Nodes (5): DateOnly, DateTimeOffset, Guid, ModelBuilder, Point

### Community 172 - ".Collections_on_query_surfaces_are_paginated"
Cohesion: 0.50
Nodes (3): PaginationTests, Fact, 4. Paginação obrigatória

### Community 173 - "TestCalendar"
Cohesion: 0.50
Nodes (4): TestCalendar, BookableDay, DateOnly, TimeZoneInfo

### Community 178 - "6. Arquitetura"
Cohesion: 0.40
Nodes (5): 6.1 Stack, 6.2 Monólito modular, 6.3 Multi-tenancy, 6.4 Organização do backend, 6. Arquitetura

### Community 179 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

## Knowledge Gaps
- **815 isolated node(s):** `Booking.Application`, `Assembly`, `Microsoft.NET.Sdk`, `UserId`, `BusinessId` (+810 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1226 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `CLAUDE.md` to `adapters.ts`?**
  _High betweenness centrality (0.259) - this node is a cross-community bridge._
- **Why does `2. Glossário canônico` connect `CLAUDE.md` to `Service`, `Business`, `Appointment`, `Customer`, `Professional`?**
  _High betweenness centrality (0.251) - this node is a cross-community bridge._
- **Are the 87 inferred relationships involving `DomainException` (e.g. with `.RequireBusinessId()` and `.RequireOwner()`) actually correct?**
  _`DomainException` has 87 INFERRED edges - model-reasoned connections that need verification._
- **Are the 18 inferred relationships involving `Appointment` (e.g. with `2. Glossário canônico` and `2. `Base/` restrito a cadastro sem regra de estado`) actually correct?**
  _`Appointment` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `Business` (e.g. with `2. Glossário canônico` and `Nomenclatura`) actually correct?**
  _`Business` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `Professional` (e.g. with `2. Glossário canônico` and `B — Uma conta com um campo `Role` (enum)`) actually correct?**
  _`Professional` has 19 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Booking.Application`, `Assembly`, `Microsoft.NET.Sdk` to the rest of the system?**
  _815 weakly-connected nodes found - possible documentation gaps or missing edges._