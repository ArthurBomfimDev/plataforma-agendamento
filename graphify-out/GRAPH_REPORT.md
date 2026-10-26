# Graph Report - plataforma-agendamento  (2026-10-26)

## Corpus Check
- 433 files · ~373,731 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 91 file(s) not represented in the graph (top: (none) 83, .example 2, .props 2)

## Summary
- 3419 nodes · 7832 edges · 186 communities (178 shown, 8 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 811 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `da9b89ba`
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
- Eixo de marca, paleta e tipografia
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
- .AddIdentityModule
- availability/index.tsx
- sign-in/index.tsx
- AggregateRoot
- IdentityFixture
- Business
- BusinessMembership
- Appointment
- DomainException
- cn
- .ExecuteAsync
- .SeedUser
- lucide-react
- business-detail/index.test.tsx
- JwtAccessTokenIssuer.cs
- .claude/CLAUDE.md
- SchedulingActor
- commit-msg
- router/consts.ts
- choose-professional/index.tsx
- availability-calendar/index.tsx
- button/index.tsx
- .ExecuteAsync
- .Pending
- ScheduleException
- compilerOptions
- ControllerBase
- JwtOptions
- react
- availability-route.tsx
- appointments/index.tsx
- DependencyInjection.cs
- business-detail/index.tsx
- AppointmentEvent
- IActorContext
- Service
- Booking.Domain.Entity.Base
- BusinessesController
- BaseEntity
- .ListOfProfessionalAsync
- queries.ts
- .GetSlotStartsAsync
- search-result-card/index.tsx
- client.ts
- adapters.ts
- .ExecuteAsync
- Booking.Domain.ValueObject
- AvailabilityDomainTests
- PageRequest
- .Update
- .ExecuteAsync
- WorkSchedule
- .ModuleNamespacePattern
- components.json
- .ExecuteAsync
- .Grant
- ManageCurrentBusinessCommands.cs
- .Calculate
- ServiceProfessional
- Professional
- .SaveChangesAsync
- .AddComplianceModule
- PagedResult
- .List
- package.json
- seed-demo.ts
- .ExecuteAsync
- dependencies
- IServiceCatalog
- IPeopleDirectory
- Booking.Application.Common.Tenancy
- ADR-014 — Avaliação do profissional e perfil público dividido
- ConfirmLocationCommand
- .ExecuteAsync
- Documento Geral do Projeto
- compilerOptions
- ISecureTokenGenerator
- .ExecuteAsync
- .ToResponse
- PeopleCommands.cs
- .AddPeopleModule
- .ListActiveAsync
- ADR-013 — CPF opcional e verificação de identidade como porta
- ADR-017 — Intervalo bloqueado em colunas gravadas, não coluna gerada
- ADR-018 — Marca Vagoo e paleta azul
- status-chip/index.tsx
- IUnitOfWork
- ConsentCommands.cs
- .ExecuteAsync
- ConsentRecord
- 20261014015234_AddTenancy.Designer.cs
- ADR-002 — Revogação da stack declarada no pitch
- ADR-008 — Hospedagem com PostGIS e `btree_gist`
- ADR-011 — Bun como gerenciador de pacotes e executor de scripts do frontend; Vite permanece o bundler
- ITenantContext
- .GetSchedulingInfoAsync
- SensitiveAccessLog
- LocationPrecision
- Booking.ArchitectureTests.Rules
- ADR-012 — Idade mínima de 18 anos e agendamento para terceiro
- paths
- AppointmentRepository
- Marca Vagoo — ativos no Figma
- booking-review-route.tsx
- PROJECT-CONTEXT.md
- IIdentityMailer
- .ListInRangeAsync
- Document
- ServiceProfessionalRepository
- ADR-015 — Categoria como enum
- main.tsx
- ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI
- .GetBlockedRangesAsync
- IBaseRepository
- decisions/README.md
- Decisões — modelo, localização, identidade e notificação
- devDependencies
- .AddCatalogModule
- `Appointment` — raiz de agregado ⚠️ campos revisados em 22/09 §1.3 e §1.7
- .RequiresSensitiveHandling
- .GetBookableAsync
- .BuildModel
- .TryHandleAsync
- .Passes
- .NoViolations
- scripts
- 5. Decisões fechadas — produto
- InitialIdentity
- Backend — ~12,7 mil linhas C#
- AddCoreModules
- PendingExpirationWorker
- ConsentPurpose
- .GetBlockedRangesAsync
- .BuildTargetModel
- HttpActorContext
- vite.config.ts
- 5. Regras de negócio
- .oxlintrc.json
- errorMessage
- BusinessStatus
- VerificationLevel
- DesignTimeDbContextFactory
- .BuildTargetModel
- Alternativas consideradas
- useAddToCalendar.ts
- .RestrictToProfessionalAsync
- .OfBusiness
- .BuildTargetModel
- 11. Método e avaliação
- 6. Arquitetura
- .prettierrc.json
- 8. Scheduling — o núcleo
- vite-env.d.ts
- 4. Decisões fechadas — técnicas
- setup-env.sh
- booking_domain_enum_module_availability

## God Nodes (most connected - your core abstractions)
1. `DomainException` - 114 edges
2. `Appointment` - 103 edges
3. `Business` - 89 edges
4. `Professional` - 56 edges
5. `Booking.Domain.Entity.Base` - 52 edges
6. `Service` - 52 edges
7. `Booking.Domain.Exceptions` - 50 edges
8. `User` - 45 edges
9. `PageRequest` - 43 edges
10. `cn` - 43 edges

## Surprising Connections (you probably didn't know these)
- `Contexto` --references--> `SetPublicProfileConsentCommand`  [INFERRED]
  docs/decisions/0014-avaliacao-do-profissional-e-perfil-publico.md → backend/src/Core/Booking.Application/Module/People/Commands/PeopleCommands.cs
- `D — Constraint `EXCLUDE USING gist` sobre profissional e período` --references--> `AvailabilityCalculator`  [INFERRED]
  docs/decisions/0005-dupla-reserva-constraint-exclusao.md → backend/src/Core/Booking.Domain/DomainService/Module/Availability/AvailabilityCalculator.cs
- ``AvailabilityCalculator`` --references--> `AvailabilityCalculator`  [INFERRED]
  docs/produto/modelo-de-dominio.md → backend/src/Core/Booking.Domain/DomainService/Module/Availability/AvailabilityCalculator.cs
- ``WorkSchedule` — jornada recorrente` --references--> `WorkSchedule`  [INFERRED]
  docs/produto/modelo-de-dominio.md → backend/src/Core/Booking.Domain/Entity/Module/Availability/WorkSchedule.cs
- `4. Fora do MVP` --references--> `Service`  [INFERRED]
  docs/produto/decisoes-produto-blocos-1-2.md → backend/src/Core/Booking.Domain/Entity/Module/Catalog/Service.cs

## Import Cycles
- None detected.

## Communities (186 total, 8 thin omitted)

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
Cohesion: 0.16
Nodes (11): Fact, Fact, PersistenceMappingTests, Fact, ReflectionRules, Assembly, IEnumerable, IReadOnlyList (+3 more)

### Community 4 - "1. Visão geral"
Cohesion: 0.11
Nodes (18): 10. Reputation, 12. Notifications ⚠️ módulo novo (decisão 22/09 #8), 13. Eventos de domínio, 1. Visão geral, 3. Identity, 4. Tenancy, 5. People, 9. Serviços de domínio (+10 more)

### Community 5 - "ADR-003 — Multi-tenancy por coluna `business_id`, com filtro global e RLS"
Cohesion: 0.13
Nodes (14): A — Banco por tenant, ADR-003 — Multi-tenancy por coluna `business_id`, com filtro global e RLS, Alternativas consideradas, B — Schema por tenant, C — Coluna `business_id` com filtro global do EF Core, Como saber que erramos, Consequências, Contexto (+6 more)

### Community 6 - "microsoft_entityframeworkcore"
Cohesion: 0.10
Nodes (16): AuditColumns, Booking.Infrastructure.Persistence.Mapping.Module.People, Booking.Infrastructure.Persistence.Context, Booking.Infrastructure.Persistence.Mapping.Base, Booking.Infrastructure.Persistence.Mapping.Module.Scheduling, Booking.Infrastructure.Persistence.Mapping.Module.Compliance, Booking.Infrastructure.Persistence.Mapping.Module.Tenancy, Booking.Infrastructure.Module.Identity.Repository (+8 more)

### Community 7 - "2. `Base/` restrito a cadastro sem regra de estado"
Cohesion: 0.09
Nodes (17): AssemblyReference, Assembly, AssemblyReference, Assembly, AssemblyReference, Assembly, ArchitectureConventions, FixturesAssembly (+9 more)

### Community 8 - "Booking.Infrastructure.csproj"
Cohesion: 0.09
Nodes (25): Microsoft.NET.Sdk, Microsoft.NET.Sdk, Microsoft.NET.Sdk, Microsoft.NET.Sdk, coverlet.collector, Microsoft.NET.Test.Sdk, xunit, xunit.runner.visualstudio (+17 more)

### Community 9 - "ADR-007 — Monólito modular com fronteira de módulo verificada pelo build"
Cohesion: 0.17
Nodes (11): ADR-007 — Monólito modular com fronteira de módulo verificada pelo build, Como saber que erramos, Consequências, Contexto, Decisão, O que fica mais difícil, O que fica mais fácil, O que passa a ser proibido (+3 more)

### Community 10 - "http"
Cohesion: 0.13
Nodes (15): ASPNETCORE_ENVIRONMENT, applicationUrl, commandName, dotnetRunMessages, environmentVariables, launchBrowser, applicationUrl, commandName (+7 more)

### Community 11 - "ADR-005 — Prevenção de dupla reserva por constraint de exclusão no PostgreSQL"
Cohesion: 0.13
Nodes (14): A — Verificação em código antes do `INSERT`, ADR-005 — Prevenção de dupla reserva por constraint de exclusão no PostgreSQL, Alternativas consideradas, B — Lock distribuído em Redis, C — Isolamento `SERIALIZABLE`, Como saber que erramos, Consequências, D — Constraint `EXCLUDE USING gist` sobre profissional e período (+6 more)

### Community 12 - "UserToken"
Cohesion: 0.08
Nodes (28): ForgotPasswordCommand, CancellationToken, Task, TimeProvider, UserToken, ExpiresAt, TokenHash, Type (+20 more)

### Community 13 - "ADR-001 — Stack: React + Vite no frontend, .NET 10 no backend, PostgreSQL com PostGIS"
Cohesion: 0.12
Nodes (15): A — React + TypeScript + Vite · ASP.NET Core (.NET 10) · PostgreSQL + PostGIS, ADR-001 — Stack: React + Vite no frontend, .NET 10 no backend, PostgreSQL com PostGIS, Alternativas consideradas, B — Node.js + NestJS no backend, mantendo o que o pitch declarou, C — React Native para o app, como o pitch declarou, Como saber que erramos, Consequências, Contexto (+7 more)

### Community 14 - "Customer"
Cohesion: 0.10
Nodes (24): Customer, BirthDate, SocialName, UserId, DateOnly, Guid, CustomerMapping, EntityTypeBuilder (+16 more)

### Community 15 - "BookingDbContext"
Cohesion: 0.17
Nodes (10): BookingDbContext, CurrentBusinessId, CancellationToken, Guid, ModelBuilder, Task, DbContext, DbContextOptions (+2 more)

### Community 16 - "Eixo de marca, paleta e tipografia"
Cohesion: 0.18
Nodes (10): 0. Histórico, 10. Estrutura de páginas do arquivo, 1. Eixo, 2. Decisão de risco registrada (capítulo de limitações), 5. Marca, 6. Tipografia, 7. Tokens, 8. Regra de geometria — permanente (+2 more)

### Community 19 - "ADR-009 — Paridade mobile completa no painel, como decisão de inclusão digital"
Cohesion: 0.13
Nodes (14): A — Painel só desktop, mobile depois se sobrar tempo, ADR-009 — Paridade mobile completa no painel, como decisão de inclusão digital, Alternativas consideradas, B — Painel mobile só para as telas críticas (ver agenda, aceitar pedido), C — Paridade completa em 390px, Como saber que erramos, Consequências, Contexto (+6 more)

### Community 20 - "ADR-NNN — Título curto e afirmativo"
Cohesion: 0.14
Nodes (13): A —, ADR-NNN — Título curto e afirmativo, Alternativas consideradas, B —, Como saber que erramos, Consequências, Contexto, Decisão (+5 more)

### Community 21 - "User"
Cohesion: 0.09
Nodes (21): User, Email, EmailConfirmedAt, FullName, PasswordHash, Status, DateTimeOffset, Email (+13 more)

### Community 22 - "RefreshToken"
Cohesion: 0.07
Nodes (27): LogoutCommand, CancellationToken, Task, TimeProvider, CancellationToken, Task, DateTimeOffset, RefreshToken (+19 more)

### Community 23 - "Booking.Domain.Exceptions"
Cohesion: 0.25
Nodes (9): Booking.Domain.Exceptions, Booking.UnitTests.Identity, Booking.Application.Common.Persistence, Booking.Application.Contracts.Identity, Booking.Domain.Enum.Module.Identity, Booking.Application.Module.Identity.Commands, Booking.Domain.Interface.Repository.Module.Identity, Booking.Arguments.Module.Identity (+1 more)

### Community 24 - "Componentes e telas — Etapas 5 e 6 concluídas"
Cohesion: 0.17
Nodes (11): 1. Estrutura do arquivo, 2. Componentes (Etapa 5), 3. Telas (Etapa 6), 4. Agenda do dia — refeita com eixo de tempo contínuo, 5. Pendências abertas, 6. Próxima etapa — Etapa 7 (executada no Figma; registro original mantido), Componentes e telas — Etapas 5 e 6 concluídas, Decisões (+3 more)

### Community 25 - "Decisões de Produto — Blocos 1 e 2"
Cohesion: 0.17
Nodes (11): 0. Glossário canônico, 1.9 Receita e financeiro na interface, 1. Núcleo e proposta de valor, 2. Atores, papéis e identidade, 3. Busca, 4. Fora do MVP, 5. Correções sobre material anterior, 6. ADR-005 (a escrever) — Prevenção de dupla reserva (+3 more)

### Community 26 - "Decisão"
Cohesion: 0.10
Nodes (15): ForbiddenDependencyTests, Fact, TheoryData, PaginationTests, PackageRules, IReadOnlyList, TestResult, BackendRoot (+7 more)

### Community 27 - "Objetivo"
Cohesion: 0.20
Nodes (9): Breaking changes, Checklist final, Decisões tomadas, Evidência para o TCC, Mudanças, Objetivo, ⚠️ Revisão humana obrigatória, Riscos (+1 more)

### Community 28 - "7. Modelo de domínio"
Cohesion: 0.18
Nodes (10): Email, Address, GeoPoint, Latitude, Longitude, GeoPointValueConverter, Point, 7. Modelo de domínio (+2 more)

### Community 29 - ".AddIdentityModule"
Cohesion: 0.07
Nodes (33): IAccessTokenIssuer, IdentityPolicy, EmailConfirmationLifetime, PasswordResetLifetime, RefreshTokenLifetime, TimeSpan, IPasswordHasher, LoginCommand (+25 more)

### Community 30 - "availability/index.tsx"
Cohesion: 0.07
Nodes (35): CalendarDayInfo, countLabel(), SlotPeriod(), SlotPeriodProps, TIME_SLOT_CHIP_CLASSES, TimeSlotChip(), TimeSlotChipProps, TimeSlotGroup() (+27 more)

### Community 31 - "sign-in/index.tsx"
Cohesion: 0.06
Nodes (51): App(), LOGOTYPE_HEIGHT, LOGOTYPE_WIDTH, Logotype(), LogotypeProps, TextField(), TextFieldProps, ThemeToggle() (+43 more)

### Community 32 - "AggregateRoot"
Cohesion: 0.24
Nodes (6): AggregateRoot, DomainEvents, IReadOnlyCollection, List, IDomainEvent, Booking.Domain.Event.Base

### Community 33 - "IdentityFixture"
Cohesion: 0.07
Nodes (31): IdentityFixture, AccessTokens, Clock, Hasher, JwtSettings, Mailer, Policy, RefreshTokens (+23 more)

### Community 34 - "Business"
Cohesion: 0.06
Nodes (37): Business, AutoConfirm, BookingHorizonDays, CancellationWindowHours, Category, City, District, Document (+29 more)

### Community 35 - "BusinessMembership"
Cohesion: 0.08
Nodes (26): BusinessMembership, AcceptedAt, BusinessId, RemovedAt, Role, Status, UserId, DateTimeOffset (+18 more)

### Community 36 - "Appointment"
Cohesion: 0.06
Nodes (34): Appointment, BlockedEndsAt, BlockedRange, BlockedStartsAt, BufferAfterMinutes, BufferBeforeMinutes, BusinessId, BusinessNotes (+26 more)

### Community 37 - "DomainException"
Cohesion: 0.09
Nodes (14): DomainException, Code, Details, UserDomainTests, Fact, InlineData, Theory, TenancyAndCatalogDomainTests (+6 more)

### Community 38 - "cn"
Cohesion: 0.09
Nodes (25): INDICATOR_TRANSITION, SegmentedControl(), SegmentedControlOption, SegmentedControlProps, TabBarItem, TabBarProps, TextAreaField(), TextAreaFieldProps (+17 more)

### Community 39 - ".ExecuteAsync"
Cohesion: 0.08
Nodes (27): AccessToken, BusinessContext, DateTimeOffset, Guid, CancellationToken, Guid, Task, GetCurrentUserQuery (+19 more)

### Community 40 - ".SeedUser"
Cohesion: 0.22
Nodes (11): ConfirmEmailRequest, ForgotPasswordRequest, LoginRequest, LogoutRequest, RefreshSessionRequest, RegisterUserRequest, ResetPasswordRequest, AuthFlowTests (+3 more)

### Community 41 - "lucide-react"
Cohesion: 0.10
Nodes (22): CONTENT_BOTTOM_PADDING, ITEMS, BottomNavigation(), BottomNavigationProps, NavigationItemId, Button(), CategoryCard(), CategoryCardProps (+14 more)

### Community 42 - "business-detail/index.test.tsx"
Cohesion: 0.10
Nodes (22): ServiceCardProps, render(), screen(), BookingBusiness, BookingReviewScreenProps, render(), screen(), BookingSentScreenProps (+14 more)

### Community 43 - "JwtAccessTokenIssuer.cs"
Cohesion: 0.12
Nodes (16): AssemblyReference, Assembly, Program, Booking.Infrastructure, Booking.Infrastructure.Module.Identity.Security, Booking.Api.Common, konscious_security_cryptography, microsoft_aspnetcore_authentication_jwtbearer (+8 more)

### Community 45 - "SchedulingActor"
Cohesion: 0.16
Nodes (8): BookingPolicy, ServiceSnapshot, DateTimeOffset, Guid, SchedulingActor, AppointmentTests, DateTimeOffset, Fact

### Community 47 - "router/consts.ts"
Cohesion: 0.12
Nodes (26): ADR-0012, HomeScreen(), useSignIn(), useSignUp(), frontend_src_lib_toast_slide, frontend_src_lib_toast_toastcontainer, BookingReviewRoute(), BookingSentRoute() (+18 more)

### Community 48 - "choose-professional/index.tsx"
Cohesion: 0.09
Nodes (19): Avatar(), AvatarProps, Breadcrumb(), BreadcrumbItem, BreadcrumbProps, ProfessionalOption(), ProfessionalOptionProps, Avatar() (+11 more)

### Community 49 - "availability-calendar/index.tsx"
Cohesion: 0.14
Nodes (18): STATUSES, AvailabilityDayButton(), MARKER_CLASSES, DayMarker(), DayMarkerProps, HolidayMarker(), HolidayMarkerProps, capitalize() (+10 more)

### Community 50 - "button/index.tsx"
Cohesion: 0.11
Nodes (16): SIZE_CLASSES, VARIANT_CLASSES, ButtonProps, ConfirmDialog(), ConfirmDialogProps, AlertDialog(), AlertDialogCancel(), AlertDialogContent() (+8 more)

### Community 51 - ".ExecuteAsync"
Cohesion: 0.11
Nodes (18): GetPublicBusinessQuery, SearchBusinessesQuery, CancellationToken, Guid, Task, IBusinessRepository, CancellationToken, Document (+10 more)

### Community 52 - ".Pending"
Cohesion: 0.20
Nodes (19): ReasonRequest, AppointmentsController, BusinessAppointmentsController, CancellationToken, DateOnly, Guid, HttpGet, HttpPost (+11 more)

### Community 53 - "ScheduleException"
Cohesion: 0.08
Nodes (23): ITenantScoped, BusinessId, Guid, ScheduleException, BusinessId, EndsAt, Kind, Period (+15 more)

### Community 54 - "compilerOptions"
Cohesion: 0.07
Nodes (29): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, ignoreDeprecations, jsx, lib (+21 more)

### Community 55 - "ControllerBase"
Cohesion: 0.15
Nodes (20): RemoveWorkScheduleCommand, Guid, PublicAvailabilityController, ScheduleExceptionsController, WorkSchedulesController, CancellationToken, DateOnly, Guid (+12 more)

### Community 56 - "JwtOptions"
Cohesion: 0.10
Nodes (19): Argon2PasswordHasher, JwtAccessTokenIssuer, IOptions, JwtOptions, AccessTokenMinutes, Audience, Issuer, SigningKey (+11 more)

### Community 57 - "react"
Cohesion: 0.12
Nodes (16): WIDTHS, PageContainer(), PageContainerProps, priceFormat, MOCK_FREE_CANCELLATION_HOURS, NOTE_MAX_LENGTH, BookingReviewScreen(), timeRange() (+8 more)

### Community 58 - "availability-route.tsx"
Cohesion: 0.21
Nodes (22): ErrorScreen(), LoadingScreen(), NotFoundScreen(), isNotFound(), useAvailabilityCalendars(), useBusiness(), useDaySlots(), useProfessionals() (+14 more)

### Community 59 - "appointments/index.tsx"
Cohesion: 0.14
Nodes (21): AppointmentsScreen(), dayLabel(), emptyState(), expiryLabel(), parseDay(), TODO: a tela de avaliação ainda não existe; o botão não faz nada., summary(), ready (+13 more)

### Community 60 - "DependencyInjection.cs"
Cohesion: 0.08
Nodes (22): Booking.Application.Module.Availability.Commands, Booking.Application.Contracts.Scheduling, Booking.Application.Module.Identity.Queries, Booking.Infrastructure.Module.Tenancy, Booking.Infrastructure.Module.Scheduling.Repository, Booking.Infrastructure.Module.Catalog, Booking.Infrastructure.Module.Scheduling, Booking.Infrastructure.Module.Catalog.Repository (+14 more)

### Community 61 - "business-detail/index.tsx"
Cohesion: 0.12
Nodes (13): BASE_CLASS_NAME, CardEstablishmentImage(), CardEstablishmentImageProps, VerifiedBadge(), distanceFormat, ratingFormat, CardEstablishment(), CardEstablishmentProps (+5 more)

### Community 62 - "AppointmentEvent"
Cohesion: 0.09
Nodes (23): AppointmentEvent, ActorRole, ActorUserId, AppointmentId, BusinessId, FromStatus, Note, OccurredAt (+15 more)

### Community 63 - "IActorContext"
Cohesion: 0.14
Nodes (20): ActorContextExtensions, Guid, IActorContext, BusinessId, BusinessRole, UserId, Guid, IAvailabilityService (+12 more)

### Community 64 - "Service"
Cohesion: 0.10
Nodes (14): Service, BufferAfterMinutes, BufferBeforeMinutes, BusinessId, Description, DurationMinutes, IsActive, Name (+6 more)

### Community 65 - "Booking.Domain.Entity.Base"
Cohesion: 0.15
Nodes (13): Booking.Domain.Entity.Base, Booking.UnitTests.Scheduling, Booking.Domain.Enum.Module.Scheduling, Booking.Application.Contracts.People, Booking.Application.Module.Scheduling.Queries, Booking.Application.Contracts.Tenancy, Booking.Api.Module.Scheduling, Booking.Application.Module.Scheduling.Converter (+5 more)

### Community 66 - "BusinessesController"
Cohesion: 0.18
Nodes (17): ConfirmLocationRequest, SearchBusinessesRequest, UpdateAddressRequest, UpdateSchedulingPolicyRequest, BusinessesController, AllowAnonymous, CancellationToken, Guid (+9 more)

### Community 67 - "BaseEntity"
Cohesion: 0.09
Nodes (18): BaseEntity, Id, Guid, Holiday, Date, Kind, Name, DateOnly (+10 more)

### Community 68 - ".ListOfProfessionalAsync"
Cohesion: 0.19
Nodes (12): CancellationToken, DateTimeOffset, Guid, IReadOnlyList, Task, ScheduleExceptionRepository, WorkScheduleRepository, CancellationToken (+4 more)

### Community 69 - "queries.ts"
Cohesion: 0.13
Nodes (23): appointmentsApi, authApi, availabilityApi, businessesApi, customersApi, AvailabilityTarget, queryKeys, AddressResponse (+15 more)

### Community 70 - ".GetSlotStartsAsync"
Cohesion: 0.13
Nodes (16): SlotQuery, CancellationToken, DateOnly, DateTimeOffset, Guid, IReadOnlyList, Task, CancellationToken (+8 more)

### Community 71 - "search-result-card/index.tsx"
Cohesion: 0.14
Nodes (16): FilterChip(), FilterChipProps, NO_AVAILABILITY_MESSAGE, priceFormat, priceWholeFormat, SearchResultCard(), SearchResultAvailability, SearchResultCardProps (+8 more)

### Community 72 - "client.ts"
Cohesion: 0.15
Nodes (17): api(), parse(), refreshAccessToken(), RequestOptions, send(), session, url(), apiBaseUrl (+9 more)

### Community 73 - "adapters.ts"
Cohesion: 0.16
Nodes (21): useBusinesses(), useCancelAppointment(), useMyAppointments(), dateFormatter(), dateFormatters, dateKeyIn(), DEFAULT_TIME_ZONE, timeFormatter() (+13 more)

### Community 74 - ".ExecuteAsync"
Cohesion: 0.24
Nodes (11): Action, ManageAppointmentCommand, CancellationToken, Guid, Task, AppointmentConverter, AppointmentResponse, CounterAppointmentRequest (+3 more)

### Community 75 - "Booking.Domain.ValueObject"
Cohesion: 0.17
Nodes (10): Booking.Domain.Enum.Module.Availability, Booking.Arguments.Module.Availability, Booking.Domain.DomainService.Module.Availability, Booking.Application.Module.Availability.Converter, Booking.Domain.Entity.Module.Availability, Booking.UnitTests.Availability, Booking.Domain.ValueObject, Booking.Application.Contracts.Availability (+2 more)

### Community 76 - "AvailabilityDomainTests"
Cohesion: 0.14
Nodes (11): BrazilianHolidays, DateOnly, AvailabilityDomainTests, Fact, Guid, InlineData, Theory, TimeOnly (+3 more)

### Community 77 - "PageRequest"
Cohesion: 0.18
Nodes (11): CancellationToken, Guid, Task, PageRequest, CancellationToken, Guid, Task, ProfessionalRepository (+3 more)

### Community 78 - ".Update"
Cohesion: 0.21
Nodes (15): CustomersController, ProfessionalsController, PublicProfessionalsController, CancellationToken, Guid, HttpDelete, HttpGet, HttpPost (+7 more)

### Community 79 - ".ExecuteAsync"
Cohesion: 0.17
Nodes (11): CancellationToken, Guid, Task, CreateProfessionalRequest, CustomerResponse, ProfessionalResponse, PublicProfessionalResponse, RegisterCustomerRequest (+3 more)

### Community 80 - "WorkSchedule"
Cohesion: 0.13
Nodes (13): IAuditable, WorkSchedule, BusinessId, DayOfWeek, EffectiveFrom, EffectiveTo, EndTime, ProfessionalId (+5 more)

### Community 81 - ".ModuleNamespacePattern"
Cohesion: 0.13
Nodes (16): ModuleBoundaryTests, Fact, MemberData, Theory, TheoryData, NamespaceRules, Assembly, IEnumerable (+8 more)

### Community 82 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 83 - ".ExecuteAsync"
Cohesion: 0.20
Nodes (16): CancellationToken, Task, AvailabilityConverter, AddScheduleExceptionRequest, AddWorkScheduleRequest, AvailabilityCalendarResponse, AvailabilityDayResponse, AvailableSlotsResponse (+8 more)

### Community 84 - ".Grant"
Cohesion: 0.14
Nodes (15): GetConsentVersionsQuery, ListMyConsentsQuery, CancellationToken, Task, ConsentsController, AllowAnonymous, CancellationToken, HttpDelete (+7 more)

### Community 85 - "ManageCurrentBusinessCommands.cs"
Cohesion: 0.20
Nodes (10): Booking.Api.Module.Tenancy, Booking.Application.Contracts.Catalog, Booking.Application.Module.Tenancy.Commands, Booking.UnitTests.Tenancy, Booking.Arguments.Module.Tenancy, Booking.Domain.Enum.Module.Tenancy, Booking.Domain.Entity.Module.Tenancy, Booking.Application.Module.Tenancy.Converter (+2 more)

### Community 86 - ".Calculate"
Cohesion: 0.22
Nodes (9): Guid, AvailabilityCalculatorTests, DateOnly, DateTimeOffset, Fact, Guid, IReadOnlyCollection, IReadOnlyList (+1 more)

### Community 87 - "ServiceProfessional"
Cohesion: 0.12
Nodes (12): ServiceProfessional, BusinessId, DurationOverrideMinutes, PriceOverrideCents, ProfessionalId, ServiceId, Guid, ServiceProfessionalMapping (+4 more)

### Community 88 - "Professional"
Cohesion: 0.12
Nodes (16): Professional, Bio, BusinessId, BusinessMembershipId, DisplayName, IsActive, IsPubliclyVisible, PublicProfileConsentAt (+8 more)

### Community 89 - ".SaveChangesAsync"
Cohesion: 0.25
Nodes (11): CancellationToken, Task, CurrentBusinessLoader, SubmitBusinessCommand, UpdateAddressCommand, UpdateSchedulingPolicyCommand, CancellationToken, Task (+3 more)

### Community 90 - ".AddComplianceModule"
Cohesion: 0.15
Nodes (12): IComplianceGateway, CancellationToken, DateTimeOffset, Guid, Task, ComplianceGateway, CancellationToken, DateTimeOffset (+4 more)

### Community 91 - "PagedResult"
Cohesion: 0.15
Nodes (12): CancellationToken, DateOnly, DateTimeOffset, Guid, Task, TimeZoneInfo, PagedResult, IReadOnlyList (+4 more)

### Community 92 - ".List"
Cohesion: 0.22
Nodes (14): SaveServiceRequest, PublicServicesController, ServicesController, CancellationToken, Guid, HttpDelete, HttpGet, HttpPost (+6 more)

### Community 93 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, type, version, @base-ui/react, @fontsource-variable/ibm-plex-sans, oxlint, prettier (+11 more)

### Community 94 - "seed-demo.ts"
Cohesion: 0.16
Nodes (18): ApiCallError, approvePendingBusinesses(), BUSINESSES, call(), cnpjFrom(), CUSTOMER, DemoBusiness, DemoProfessional (+10 more)

### Community 95 - ".ExecuteAsync"
Cohesion: 0.26
Nodes (10): ConfirmEmailCommand, CancellationToken, Task, TimeProvider, AuthController, CancellationToken, HttpPost, IActionResult (+2 more)

### Community 96 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @base-ui/react, class-variance-authority, cn, date-fns, @fontsource-variable/ibm-plex-sans, framer-motion, lucide-react (+11 more)

### Community 97 - "IServiceCatalog"
Cohesion: 0.23
Nodes (10): BookableService, IServiceCatalog, CancellationToken, Guid, IReadOnlyCollection, IReadOnlySet, Task, SlotGuard (+2 more)

### Community 98 - "IPeopleDirectory"
Cohesion: 0.27
Nodes (9): IPeopleDirectory, ProfessionalInfo, CancellationToken, Guid, Task, PeopleDirectory, CancellationToken, Guid (+1 more)

### Community 99 - "Booking.Application.Common.Tenancy"
Cohesion: 0.19
Nodes (9): TenantClaims, Booking.Api.Module.Catalog, Booking.Application.Module.Catalog.Queries, Booking.Domain.Interface.Repository.Module.Catalog, Booking.Domain.Entity.Module.Catalog, Booking.Application.Module.Catalog.Commands, Booking.Arguments.Module.Catalog, Booking.Application.Module.Catalog.Converter (+1 more)

### Community 100 - "ADR-014 — Avaliação do profissional e perfil público dividido"
Cohesion: 0.12
Nodes (15): PeopleConverter, A — Perfil inteiro só com consentimento, avaliação só do estabelecimento (decisões 2.7 e 2.10), ADR-014 — Avaliação do profissional e perfil público dividido, Alternativas consideradas, B — Nome sempre público; perfil completo com consentimento; nota opcional do profissional na mesma avaliação, C — Avaliação por par serviço × profissional, Como saber que erramos, Consequências (+7 more)

### Community 101 - "ConfirmLocationCommand"
Cohesion: 0.12
Nodes (16): ConfirmLocationCommand, TimeProvider, A — Ponto do geocodificador, sem confirmação, ADR-016 — Geocodificação: porta, provedor por fase e confirmação pelo dono, Alternativas consideradas, B — Ponto digitado ou marcado pelo dono, sem geocodificador, C — Geocodificador dá o palpite, o dono confirma o pino; provedor atrás de porta, Como saber que erramos (+8 more)

### Community 102 - ".ExecuteAsync"
Cohesion: 0.17
Nodes (12): RegisterBusinessCommand, CancellationToken, Guid, Task, TimeProvider, BusinessConverter, RegisterBusinessRequest, AddressResponse (+4 more)

### Community 103 - "Documento Geral do Projeto"
Cohesion: 0.12
Nodes (17): 10. Conformidade com a LGPD, 12.1 O que existe hoje, 12.2 O recorte proposto, 12. Estado atual e recorte de entrega, 13. Limitações, 14. Artefatos do projeto, 15. Pendências abertas, 1. O problema (+9 more)

### Community 104 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 105 - "ISecureTokenGenerator"
Cohesion: 0.20
Nodes (8): GeneratedToken, ISecureTokenGenerator, UserTokenLookup, CancellationToken, DateTimeOffset, Task, SecureTokenGenerator, GeneratedToken_Pair

### Community 106 - ".ExecuteAsync"
Cohesion: 0.26
Nodes (8): CancellationToken, Guid, Task, CancellationToken, Guid, IReadOnlyCollection, IReadOnlyList, Task

### Community 107 - ".ToResponse"
Cohesion: 0.23
Nodes (11): CatalogConverter, IEnumerable, CancellationToken, Guid, Task, EnableProfessionalRequest, PublicServiceResponse, ServiceProfessionalResponse (+3 more)

### Community 108 - "PeopleCommands.cs"
Cohesion: 0.20
Nodes (8): Booking.Application.Module.People.Converter, Booking.Infrastructure.Module.People.Repository, Booking.Domain.Entity.Module.People, Booking.Application.Module.People.Commands, Booking.Domain.Interface.Repository.Module.People, Booking.Api.Module.People, Booking.Arguments.Module.People, Booking.Application.Module.People.Queries

### Community 109 - ".AddPeopleModule"
Cohesion: 0.22
Nodes (11): CreateProfessionalCommand, RegisterCustomerCommand, SetPublicProfileConsentCommand, UpdateProfessionalCommand, TimeProvider, GetMyCustomerProfileQuery, ListProfessionalsQuery, ListPublicProfessionalsQuery (+3 more)

### Community 110 - ".ListActiveAsync"
Cohesion: 0.20
Nodes (10): IConsentRecordRepository, CancellationToken, Guid, IReadOnlyList, Task, ConsentRecordRepository, CancellationToken, Guid (+2 more)

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
Cohesion: 0.35
Nodes (13): IUnitOfWork, IBusinessDirectory, AppointmentAccess, TimeProvider, CancelMyAppointmentCommand, CreateCounterAppointmentCommand, ExpirePendingAppointmentsCommand, RequestAppointmentCommand (+5 more)

### Community 116 - "ConsentCommands.cs"
Cohesion: 0.25
Nodes (8): Booking.Arguments.Module.Compliance, Booking.Domain.Enum.Module.Compliance, Booking.Application.Module.Compliance.Queries, Booking.Domain.Interface.Repository.Module.Compliance, Booking.Api.Module.Compliance, Booking.Application.Module.Compliance.Integration, Booking.Application.Module.Compliance.Commands, Booking.Domain.Entity.Module.Compliance

### Community 117 - ".ExecuteAsync"
Cohesion: 0.20
Nodes (10): GrantConsentCommand, RevokeConsentCommand, CancellationToken, Task, TimeProvider, ConsentResponse, ConsentVersionsResponse, GrantConsentRequest (+2 more)

### Community 118 - "ConsentRecord"
Cohesion: 0.19
Nodes (10): ConsentRecord, GrantedAt, Purpose, RevokedAt, UserId, Version, DateTimeOffset, Guid (+2 more)

### Community 119 - "20261014015234_AddTenancy.Designer.cs"
Cohesion: 0.36
Nodes (7): Booking.Infrastructure.Persistence.Migrations, microsoft_entityframeworkcore_infrastructure, microsoft_entityframeworkcore_migrations, microsoft_entityframeworkcore_storage_valueconversion, nettopologysuite_geometries, npgsql_entityframeworkcore_postgresql_metadata, system

### Community 120 - "ADR-002 — Revogação da stack declarada no pitch"
Cohesion: 0.13
Nodes (14): A — Manter o pitch como referência e ajustar o projeto a ele, ADR-002 — Revogação da stack declarada no pitch, Alternativas consideradas, B — Deixar a mudança implícita na ADR-001, C — Revogar formalmente o pitch, item por item, Como saber que erramos, Consequências, Contexto (+6 more)

### Community 121 - "ADR-008 — Hospedagem com PostGIS e `btree_gist`"
Cohesion: 0.13
Nodes (14): A — Banco gerenciado no Azure, via Azure for Students, ADR-008 — Hospedagem com PostGIS e `btree_gist`, Alternativas consideradas, B — PostgreSQL em camada gratuita de outro provedor, C — VPS com a mesma imagem do Docker Compose, Como saber que erramos, Consequências, Critérios de decisão (+6 more)

### Community 122 - "ADR-011 — Bun como gerenciador de pacotes e executor de scripts do frontend; Vite permanece o bundler"
Cohesion: 0.13
Nodes (15): A — Continuar com npm, ADR-011 — Bun como gerenciador de pacotes e executor de scripts do frontend; Vite permanece o bundler, Alternativas consideradas, B — Bun como gerenciador de pacotes e executor de scripts, mantendo o Vite, C — Bun também como bundler, dev server e runtime, Como saber que erramos, Consequências, Contexto (+7 more)

### Community 123 - "ITenantContext"
Cohesion: 0.14
Nodes (10): ITenantContext, BusinessId, Guid, TenantContextExtensions, Guid, HttpTenantContext, BusinessId, Guid (+2 more)

### Community 124 - ".GetSchedulingInfoAsync"
Cohesion: 0.26
Nodes (9): BusinessMembershipInfo, BusinessSchedulingInfo, CancellationToken, Guid, Task, BusinessDirectory, CancellationToken, Guid (+1 more)

### Community 125 - "SensitiveAccessLog"
Cohesion: 0.18
Nodes (12): SensitiveAccessLog, Action, ActorUserId, AppointmentId, BusinessId, OccurredAt, DateTimeOffset, Guid (+4 more)

### Community 126 - "LocationPrecision"
Cohesion: 0.14
Nodes (12): LocationPrecision, City, Locality, Rooftop, Street, 5.1 Princípio, 5.2 Campos novos em `Business`, 5.4 Fluxo de onboarding (+4 more)

### Community 127 - "Booking.ArchitectureTests.Rules"
Cohesion: 0.31
Nodes (5): Booking.ArchitectureTests.Rules, Booking.ArchitectureTests, Booking.ArchitectureTests.Support, netarchtest_rules, system_text_regularexpressions

### Community 128 - "ADR-012 — Idade mínima de 18 anos e agendamento para terceiro"
Cohesion: 0.14
Nodes (14): A — Cadastro aberto a qualquer idade, com consentimento de responsável para menores, ADR-012 — Idade mínima de 18 anos e agendamento para terceiro, Alternativas consideradas, B — Cadastro só para maiores, com agendamento para outra pessoa, Como saber que erramos, Consequências, Contexto, Decisão (+6 more)

### Community 129 - "paths"
Cohesion: 0.14
Nodes (13): compilerOptions, baseUrl, ignoreDeprecations, paths, files, @components/*, @features/*, @global/* (+5 more)

### Community 130 - "AppointmentRepository"
Cohesion: 0.38
Nodes (6): AppointmentRepository, CancellationToken, DateTimeOffset, Guid, IReadOnlyList, Task

### Community 131 - "Marca Vagoo — ativos no Figma"
Cohesion: 0.17
Nodes (7): Ativos de referência na seção Marca, Componentes, Identidade, Marca Vagoo — ativos no Figma, Onde o logotipo aparece, Pendências, Regra de uso

### Community 132 - "booking-review-route.tsx"
Cohesion: 0.31
Nodes (10): useRequestAppointment(), dayFromKey(), BookingReview(), newIdempotencyKey(), readBookingSearch(), readSentSearch(), validInstant(), bookingSentPath() (+2 more)

### Community 133 - "PROJECT-CONTEXT.md"
Cohesion: 0.15
Nodes (12): 10. Contradições resolvidas — não reabrir, 11. Pendências abertas, 12. Recorte de entrega e o que falta, 14. Restrições permanentes, 15. Regras de trabalho, 16. Próximo passo, 1. O que é, 3. Documentos (+4 more)

### Community 134 - "IIdentityMailer"
Cohesion: 0.23
Nodes (7): IIdentityMailer, CancellationToken, Task, LoggingIdentityMailer, CancellationToken, ILogger, Task

### Community 135 - ".ListInRangeAsync"
Cohesion: 0.35
Nodes (5): CancellationToken, DateTimeOffset, Guid, IReadOnlyList, Task

### Community 136 - "Document"
Cohesion: 0.23
Nodes (6): Document, Kind, Number, DocumentKind, Cnpj, Cpf

### Community 137 - "ServiceProfessionalRepository"
Cohesion: 0.32
Nodes (7): ServiceProfessionalRepository, ServiceRepository, CancellationToken, Guid, IReadOnlyCollection, IReadOnlyList, Task

### Community 138 - "ADR-015 — Categoria como enum"
Cohesion: 0.17
Nodes (11): A — Tabela `category`, com `RequiresSensitiveHandling` como coluna, ADR-015 — Categoria como enum, Alternativas consideradas, B — Enum em código, Como saber que erramos, Consequências, O que fica mais difícil, O que fica mais fácil (+3 more)

### Community 139 - "main.tsx"
Cohesion: 0.24
Nodes (9): frontend_src_index, createQueryClient(), queryClient, renderAt(), frontend_src_styles_toast, frontend_src_styles_tokens, ref_react_dom_client, ref_react_toastify_dist_reacttoastify_css (+1 more)

### Community 140 - "ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI"
Cohesion: 0.18
Nodes (10): ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI, Como saber que erramos, Consequências, Contexto, O que fica mais difícil, O que fica mais fácil, O que passa a ser proibido, Premissa não verificada (+2 more)

### Community 141 - ".GetBlockedRangesAsync"
Cohesion: 0.24
Nodes (8): BlockedRange, IAgendaOccupancy, CancellationToken, DateTimeOffset, Guid, IReadOnlyList, Task, AgendaOccupancy

### Community 142 - "IBaseRepository"
Cohesion: 0.29
Nodes (4): IBaseRepository, CancellationToken, Guid, Task

### Community 143 - "decisions/README.md"
Cohesion: 0.20
Nodes (6): Como escrever, Decisões arquiteturais (ADRs), Notas sobre a fila, Por que ADR, Status possíveis, Índice

### Community 144 - "Decisões — modelo, localização, identidade e notificação"
Cohesion: 0.20
Nodes (9): 3. Reputação e perfil público, 4. Categoria como enum, 6.1 Lembretes viram configuração, 6.2 Conteúdo da notificação, 6.3 Canais, 6.4 WhatsApp, 6. Notificações, 7. ADRs a corrigir ou escrever (+1 more)

### Community 145 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, oxlint, prettier, @types/node, @types/react, @types/react-dom, typescript, vite (+2 more)

### Community 146 - ".AddCatalogModule"
Cohesion: 0.50
Nodes (8): CreateServiceCommand, DisableProfessionalCommand, EnableProfessionalCommand, UpdateServiceCommand, ListPublicServicesQuery, ListServicesQuery, IServiceProfessionalRepository, IServiceRepository

### Community 147 - "`Appointment` — raiz de agregado ⚠️ campos revisados em 22/09 §1.3 e §1.7"
Cohesion: 0.25
Nodes (8): AppointmentSource, Counter, Online, CancellationParty, Business, Customer, System, `Appointment` — raiz de agregado ⚠️ campos revisados em 22/09 §1.3 e §1.7

### Community 148 - ".RequiresSensitiveHandling"
Cohesion: 0.31
Nodes (7): BusinessCategory, Beleza, Saude, BusinessCategoryExtensions, Contexto, Decisão, 13. ADRs

### Community 149 - ".GetBookableAsync"
Cohesion: 0.39
Nodes (6): ServiceCatalog, CancellationToken, Guid, IReadOnlyCollection, IReadOnlySet, Task

### Community 150 - ".BuildModel"
Cohesion: 0.22
Nodes (8): BookingDbContextModelSnapshot, DateOnly, DateTimeOffset, Guid, ModelBuilder, Point, TimeOnly, ModelSnapshot

### Community 151 - ".TryHandleAsync"
Cohesion: 0.25
Nodes (7): DomainExceptionHandler, CancellationToken, Exception, HttpContext, IExceptionHandler, IProblemDetailsService, ValueTask

### Community 152 - ".Passes"
Cohesion: 0.33
Nodes (4): MemberData, Theory, LayerDependencyTests, Fact

### Community 153 - ".NoViolations"
Cohesion: 0.25
Nodes (6): IdentifierTests, ProbeEntity, Fact, ArchAssert, IReadOnlyCollection, 3. `Guid` v7 em todas as entidades

### Community 154 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, format, format:check, lint, preview, test (+1 more)

### Community 155 - "5. Decisões fechadas — produto"
Cohesion: 0.22
Nodes (9): 5. Decisões fechadas — produto, Avaliação, Feriados, Glossário — a palavra "cliente" está banida, Identidade, Localização, Matriz de permissões, Notificações (fora do recorte de entrega, decisão mantida) (+1 more)

### Community 156 - "InitialIdentity"
Cohesion: 0.29
Nodes (6): DateOnly, DateTimeOffset, Guid, MigrationBuilder, InitialIdentity, Migration

### Community 157 - "Backend — ~12,7 mil linhas C#"
Cohesion: 0.29
Nodes (6): DateTimeOffset, Guid, MigrationBuilder, Point, AddTenancy, Backend — ~12,7 mil linhas C#

### Community 158 - "AddCoreModules"
Cohesion: 0.29
Nodes (6): DateOnly, DateTimeOffset, Guid, MigrationBuilder, TimeOnly, AddCoreModules

### Community 159 - "PendingExpirationWorker"
Cohesion: 0.25
Nodes (7): PendingExpirationWorker, CancellationToken, ILogger, Task, TimeSpan, BackgroundService, IServiceScopeFactory

### Community 160 - "ConsentPurpose"
Cohesion: 0.29
Nodes (5): ConsentTexts, ConsentPurpose, Marketing, PublicProfile, SensitiveScheduling

### Community 161 - ".GetBlockedRangesAsync"
Cohesion: 0.29
Nodes (6): CancellationToken, DateTimeOffset, Guid, IReadOnlyList, Task, BlockedRange

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

### Community 167 - "errorMessage"
Cohesion: 0.48
Nodes (5): errorMessage(), MESSAGES, useSearchBusinesses(), toHomeEstablishment(), HomeRoute()

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

### Community 172 - "Alternativas consideradas"
Cohesion: 0.33
Nodes (6): A — Microsserviços, Alternativas consideradas, B — Monólito por camada, sem fronteira de módulo, C — Monólito modular com fronteira por convenção, D — Monólito modular com fronteira verificada pelo build, por namespace, E — Monólito modular com um projeto por módulo (e projeto `.Contracts` separado)

### Community 173 - "useAddToCalendar.ts"
Cohesion: 0.47
Nodes (5): CalendarEvent, escapeText(), toIcs(), RFC-5545, useAddToCalendar()

### Community 174 - ".RestrictToProfessionalAsync"
Cohesion: 0.70
Nodes (3): CancellationToken, Guid, Task

### Community 175 - ".OfBusiness"
Cohesion: 0.50
Nodes (3): TenantScope, Guid, IQueryable

### Community 176 - ".BuildTargetModel"
Cohesion: 0.40
Nodes (4): DateOnly, DateTimeOffset, Guid, ModelBuilder

### Community 177 - "11. Método e avaliação"
Cohesion: 0.40
Nodes (5): 11.1 Método, 11.2 Hipóteses, 11.3 Requisitos não funcionais medíveis, 11.4 Dados de demonstração, 11. Método e avaliação

### Community 178 - "6. Arquitetura"
Cohesion: 0.40
Nodes (5): 6.1 Stack, 6.2 Monólito modular, 6.3 Multi-tenancy, 6.4 Organização do backend, 6. Arquitetura

### Community 179 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 180 - "8. Scheduling — o núcleo"
Cohesion: 0.50
Nodes (4): 8.2 Invariantes, 8.3 `AppointmentEvent`, 8.4 Prevenção de dupla reserva, 8. Scheduling — o núcleo

### Community 182 - "4. Decisões fechadas — técnicas"
Cohesion: 0.67
Nodes (3): 4.1 Paridade mobile do painel (ADR-009), 4.2 As 6 regras de empacotamento, 4. Decisões fechadas — técnicas

## Knowledge Gaps
- **789 isolated node(s):** `Booking.Application`, `Assembly`, `Microsoft.NET.Sdk`, `UserId`, `BusinessId` (+784 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1154 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `CLAUDE.md` to `queries.ts`?**
  _High betweenness centrality (0.268) - this node is a cross-community bridge._
- **Why does `2. Glossário canônico` connect `CLAUDE.md` to `Service`, `Business`, `Appointment`, `Customer`, `Professional`?**
  _High betweenness centrality (0.258) - this node is a cross-community bridge._
- **Are the 87 inferred relationships involving `DomainException` (e.g. with `.RequireBusinessId()` and `.RequireOwner()`) actually correct?**
  _`DomainException` has 87 INFERRED edges - model-reasoned connections that need verification._
- **Are the 18 inferred relationships involving `Appointment` (e.g. with `2. Glossário canônico` and `2. `Base/` restrito a cadastro sem regra de estado`) actually correct?**
  _`Appointment` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `Business` (e.g. with `2. Glossário canônico` and `Nomenclatura`) actually correct?**
  _`Business` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 18 inferred relationships involving `Professional` (e.g. with `2. Glossário canônico` and `B — Uma conta com um campo `Role` (enum)`) actually correct?**
  _`Professional` has 18 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Booking.Application`, `Assembly`, `Microsoft.NET.Sdk` to the rest of the system?**
  _789 weakly-connected nodes found - possible documentation gaps or missing edges._