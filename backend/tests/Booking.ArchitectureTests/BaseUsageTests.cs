using Booking.ArchitectureTests.Rules;
using Booking.ArchitectureTests.Support;

namespace Booking.ArchitectureTests;

/// <summary>
/// ADR-010, decisão 2 — <c>Base/</c> restrito a cadastro sem regra de estado.
/// </summary>
/// <remarks>
/// Lista permitida, não lista proibida: entidade nova começa fora do <c>Base</c> e só entra por decisão
/// explícita, editando <see cref="ArchitectureConventions.EntitiesAllowedInBase"/>. Uma lista proibida
/// deixaria passar o próximo agregado com máquina de estado que ninguém lembrou de incluir.
/// </remarks>
public sealed class BaseUsageTests
{
    [Fact]
    public void Only_stateless_catalog_entities_use_base_abstractions()
    {
        IReadOnlyList<string> violations = ReflectionRules.ForbiddenBaseUsages(
            ReflectionRules.TypesOf(ArchitectureConventions.ProductionAssemblies));

        ArchAssert.NoViolations(
            violations,
            "Entidade fora da lista permitida usa abstração de Base/. Update e Remove genéricos pulariam a " +
            "máquina de estados e apagariam o histórico. Use Commands/ e Queries/ (ADR-010, decisão 2).");
    }

    [Fact]
    public void Rule_catches_appointment_on_base_repository_and_allows_category()
    {
        IReadOnlyList<string> violations = ReflectionRules.ForbiddenBaseUsages(
            ReflectionRules.TypesOf([ArchitectureConventions.FixturesAssembly]));

        Assert.Contains(violations, v => v.StartsWith("Booking.Domain.Module.Scheduling.IAppointmentRepository ", StringComparison.Ordinal));
        Assert.DoesNotContain(violations, v => v.StartsWith("Booking.Domain.Module.Catalog.ICategoryRepository ", StringComparison.Ordinal));
    }
}
