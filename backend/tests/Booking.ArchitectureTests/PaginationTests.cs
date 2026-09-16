using Booking.ArchitectureTests.Rules;
using Booking.ArchitectureTests.Support;

namespace Booking.ArchitectureTests;

/// <summary>
/// ADR-010, decisão 4 — paginação obrigatória no <c>Base</c>, em <c>Queries/</c> e em todo <c>*QueryService</c>.
/// </summary>
/// <remarks>
/// Sustenta o RNF-01: busca com slots, p95 ≤ 800 ms com 30 empresas semeadas. Uma única listagem sem
/// limite sobre agendamentos derruba essa meta conforme a base cresce.
/// </remarks>
public sealed class PaginationTests
{
    [Fact]
    public void Collections_on_query_surfaces_are_paginated()
    {
        IReadOnlyList<string> violations = ReflectionRules.UnpaginatedCollections(
            ReflectionRules.TypesOf(ArchitectureConventions.ProductionAssemblies));

        ArchAssert.NoViolations(
            violations,
            "Método de consulta devolve coleção sem paginação. Devolva PagedResult<T> (ADR-010, decisão 4).");
    }

    [Fact]
    public void Rule_catches_unpaginated_queries_and_allows_paged_result()
    {
        IReadOnlyList<string> violations = ReflectionRules.UnpaginatedCollections(
            ReflectionRules.TypesOf([ArchitectureConventions.FixturesAssembly]));

        Assert.Contains(violations, v => v.StartsWith("Booking.Application.Module.Catalog.Queries.IServiceListing.ListAll ", StringComparison.Ordinal));
        Assert.Contains(violations, v => v.StartsWith("Booking.Application.Module.Availability.HolidayQueryService.ListNames ", StringComparison.Ordinal));
        Assert.DoesNotContain(violations, v => v.StartsWith("Booking.Application.Module.Catalog.Queries.IServiceListing.List ", StringComparison.Ordinal));
    }
}
