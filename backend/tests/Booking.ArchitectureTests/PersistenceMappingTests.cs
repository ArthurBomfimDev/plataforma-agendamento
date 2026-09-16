using Booking.ArchitectureTests.Rules;
using Booking.ArchitectureTests.Support;

namespace Booking.ArchitectureTests;

/// <summary>
/// ADR-010, decisão 5 — sem entidade de persistência separada; o EF mapeia a entidade de domínio direto.
/// </summary>
/// <remarks>
/// Elimina a quarta forma do mesmo objeto (Domain, DTO, Arguments e Persistence). Cada conversão a mais
/// é mais um lugar onde um bug reescreve o snapshot de preço, duração e nome do agendamento.
/// </remarks>
public sealed class PersistenceMappingTests
{
    [Fact]
    public void Ef_maps_domain_entities_directly()
    {
        IReadOnlyList<Type> types = ReflectionRules.TypesOf(ArchitectureConventions.ProductionAssemblies);
        List<string> violations =
        [
            .. ReflectionRules.SeparatePersistenceEntities(types).Select(type => $"{type} é entidade de persistência separada"),
            .. ReflectionRules.NonDomainPersistenceMappings(types),
        ];

        ArchAssert.NoViolations(
            violations,
            "O EF deve mapear a entidade de domínio direto, via Fluent API em Mapping/ (ADR-010, decisão 5).");
    }

    [Fact]
    public void Rule_catches_persistence_entity_its_mapping_and_dbset()
    {
        IReadOnlyList<Type> types = ReflectionRules.TypesOf([ArchitectureConventions.FixturesAssembly]);
        IReadOnlyList<string> entities = ReflectionRules.SeparatePersistenceEntities(types);
        IReadOnlyList<string> mappings = ReflectionRules.NonDomainPersistenceMappings(types);

        Assert.Contains("Booking.Infrastructure.Persistence.Entity.AppointmentRecord", entities);

        Assert.Contains(mappings, v => v.StartsWith("Booking.Infrastructure.Module.Scheduling.Mapping.AppointmentRecordMapping ", StringComparison.Ordinal));
        Assert.Contains(mappings, v => v.StartsWith("Booking.Infrastructure.Persistence.Context.LegacyDbContext.AppointmentRecords ", StringComparison.Ordinal));

        Assert.DoesNotContain(mappings, v => v.StartsWith("Booking.Infrastructure.Module.Scheduling.Mapping.AppointmentMapping ", StringComparison.Ordinal));
        Assert.DoesNotContain(mappings, v => v.StartsWith("Booking.Infrastructure.Persistence.Context.LegacyDbContext.Appointments ", StringComparison.Ordinal));
    }
}
