using Booking.ArchitectureTests.Rules;
using Booking.ArchitectureTests.Support;
using NetArchTest.Rules;

namespace Booking.ArchitectureTests;

/// <summary>
/// ADR-010, decisão 1 · ADR-007 — fronteira de módulo verificada por namespace.
/// </summary>
/// <remarks>
/// Os projetos são camadas; os módulos são pastas <c>Module/&lt;Contexto&gt;</c> em cada camada. O compilador
/// não impede o Scheduling de usar a entidade do Catalog — este teste impede. Vale para Controller,
/// Command, Query, repositório e mapeamento: tudo que estiver dentro de <c>Module.X</c>.
///
/// Comunicação permitida entre módulos: <c>Booking.Application.Contracts.&lt;Módulo&gt;</c>, ou evento de
/// domínio publicado pelo Outbox.
/// </remarks>
public sealed class ModuleBoundaryTests
{
    public static TheoryData<string> Modules()
    {
        TheoryData<string> data = new();
        foreach (string module in ArchitectureConventions.Modules)
        {
            data.Add(module);
        }

        return data;
    }

    [Theory]
    [MemberData(nameof(Modules))]
    public void Module_reaches_other_modules_only_through_contracts(string module)
    {
        TestResult result = NamespaceRules.ModuleBoundary(ArchitectureConventions.ProductionAssemblies, module);

        ArchAssert.Passes(
            result,
            $"O módulo {module} depende de código interno de outro módulo. " +
            "Use Booking.Application.Contracts.<Módulo> ou um evento de domínio (ADR-007; ADR-010, decisão 1).");
    }

    [Fact]
    public void Rule_catches_planted_cross_module_dependency_and_allows_contract()
    {
        TestResult result = NamespaceRules.ModuleBoundary([ArchitectureConventions.FixturesAssembly], "Scheduling");

        ArchAssert.Detects(
            result,
            violators: ["Booking.Application.Module.Scheduling.Commands.ConfirmAppointmentReadingCatalogInternals"],
            compliant: ["Booking.Application.Module.Scheduling.Commands.RequestAppointmentThroughCatalogContract"]);
    }
}
