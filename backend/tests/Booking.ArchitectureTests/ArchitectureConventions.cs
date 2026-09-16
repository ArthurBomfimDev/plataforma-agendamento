using System.Reflection;

namespace Booking.ArchitectureTests;

/// <summary>
/// Fonte única das convenções verificadas pelos testes de arquitetura.
/// </summary>
/// <remarks>
/// Mudou uma decisão da ADR-010? Mude aqui, no mesmo PR que altera a ADR. Mudar só um dos dois
/// deixa o teste e a decisão escrita contando histórias diferentes.
/// </remarks>
internal static class ArchitectureConventions
{
    /// <summary>Os 8 módulos do monólito modular (docs/produto/modelo-de-dominio.md §1).</summary>
    public static readonly string[] Modules =
    [
        "Identity",
        "Tenancy",
        "People",
        "Catalog",
        "Availability",
        "Scheduling",
        "Reputation",
        "Compliance",
    ];

    /// <summary>Camadas em que um módulo tem código próprio, sempre em <c>Booking.&lt;Camada&gt;.Module.&lt;Contexto&gt;</c>.</summary>
    public static readonly string[] Layers = ["Domain", "Application", "Arguments", "Infrastructure", "Api"];

    /// <summary>
    /// Decisão 2 — únicas entidades que podem usar as abstrações de <c>Base/</c>: cadastros sem regra de estado.
    /// </summary>
    public static readonly string[] EntitiesAllowedInBase = ["Category", "Service", "WorkSchedule"];

    /// <summary>
    /// Decisão 6 — módulos com snapshot ou máquina de estado, onde mapeamento por reflexão é proibido
    /// (Appointment, AppointmentEvent, Review, ConsentRecord, SensitiveAccessLog).
    /// </summary>
    public static readonly string[] StatefulModules = ["Scheduling", "Reputation", "Compliance"];

    /// <summary>Decisão 6 — namespaces de mapeadores automáticos por reflexão.</summary>
    public static readonly string[] ReflectionMappingNamespaces = ["AutoMapper", "Mapster"];

    /// <summary>
    /// Decisões 6 e 7 — pacotes que não podem aparecer em nenhum .csproj nem no Directory.Packages.props.
    /// </summary>
    public static readonly string[] ForbiddenPackages =
    [
        // Decisão 6: mapeamento por reflexão pode recalcular o snapshot congelado do agendamento.
        "AutoMapper",
        "AutoMapper.Extensions.Microsoft.DependencyInjection",

        // Decisão 6: Commands/ e Queries/ como services simples; UnitOfWork e Notification já cobrem o resto.
        "MediatR",
        "MediatR.Contracts",

        // Decisão 7: o Outbox, na mesma transação da escrita, é a fila de eventos. Sem barramento novo.
        "MassTransit",
        "RabbitMQ.Client",
        "Confluent.Kafka",
        "Azure.Messaging.ServiceBus",
        "NServiceBus",
    ];

    public static readonly Assembly[] ProductionAssemblies =
    [
        Booking.Domain.AssemblyReference.Assembly,
        Booking.Application.AssemblyReference.Assembly,
        Booking.Arguments.AssemblyReference.Assembly,
        Booking.Infrastructure.AssemblyReference.Assembly,
        typeof(Program).Assembly,
    ];

    /// <summary>Assembly com violações plantadas de propósito. Ver o .csproj de Booking.ArchitectureTests.Fixtures.</summary>
    public static Assembly FixturesAssembly => typeof(Fixtures.FixtureAssemblyReference).Assembly;

    /// <summary>Casa <c>Booking.&lt;Camada&gt;.Module.&lt;módulo&gt;</c> e qualquer sub-namespace dele.</summary>
    public static string ModuleNamespacePattern(string module) => $@"^Booking\.[A-Za-z]+\.Module\.{module}(\..+)?$";
}
