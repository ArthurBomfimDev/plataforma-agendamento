using Booking.ArchitectureTests.Rules;
using Booking.ArchitectureTests.Support;
using Booking.Domain.Base;

namespace Booking.ArchitectureTests;

/// <summary>
/// ADR-010, decisão 3 — Guid v7 em todas as entidades.
/// </summary>
/// <remarks>
/// A busca pública atravessa todos os estabelecimentos no mesmo endpoint (ADR-003). Id sequencial
/// deixaria enumerar dado de outro tenant incrementando um número.
/// </remarks>
public sealed class IdentifierTests
{
    [Fact]
    public void Base_entity_generates_guid_version_7()
    {
        ProbeEntity first = new();
        ProbeEntity second = new();

        Assert.Equal(typeof(Guid), typeof(BaseEntity).GetProperty(nameof(BaseEntity.Id))!.PropertyType);
        Assert.Equal(7, first.Id.Version);
        Assert.Equal(7, second.Id.Version);
        Assert.NotEqual(first.Id, second.Id);
    }

    [Fact]
    public void Every_identifier_in_domain_is_guid()
    {
        IReadOnlyList<string> violations = ReflectionRules.NonGuidIdentifiers(
            ReflectionRules.TypesOf(ArchitectureConventions.ProductionAssemblies));

        ArchAssert.NoViolations(
            violations,
            "Identificador no domínio que não é Guid. Id sequencial permite enumerar dado de outro tenant (ADR-010, decisão 3).");
    }

    [Fact]
    public void Rule_catches_sequential_identifiers_and_allows_guid()
    {
        IReadOnlyList<string> violations = ReflectionRules.NonGuidIdentifiers(
            ReflectionRules.TypesOf([ArchitectureConventions.FixturesAssembly]));

        Assert.Contains(violations, v => v.StartsWith("Booking.Domain.Module.People.LegacyCustomer.Id ", StringComparison.Ordinal));
        Assert.Contains(violations, v => v.StartsWith("Booking.Domain.Module.People.LegacyCustomer.BusinessId ", StringComparison.Ordinal));
        Assert.DoesNotContain(violations, v => v.StartsWith("Booking.Domain.Module.People.LegacyCustomer.PublicId ", StringComparison.Ordinal));
    }

    private sealed class ProbeEntity : BaseEntity;
}
