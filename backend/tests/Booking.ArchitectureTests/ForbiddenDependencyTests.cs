using Booking.ArchitectureTests.Rules;
using Booking.ArchitectureTests.Support;
using NetArchTest.Rules;

namespace Booking.ArchitectureTests;

/// <summary>
/// ADR-010, decisões 6 e 7 — conversão manual, sem mediator de licença comercial, sem barramento novo.
/// </summary>
/// <remarks>
/// <para>
/// Decisão 6. O motivo de não usar AutoMapper é correção, não custo: mapeamento por reflexão é o lugar
/// mais provável de recalcular o preço atual em vez de preservar o congelado — bug silencioso que não
/// aparece em teste. Nos módulos com snapshot ou máquina de estado, a conversão é manual em <c>Converter/</c>.
/// </para>
/// <para>
/// Decisão 7. O Outbox, gravado na mesma transação da escrita, é a fila de eventos. A garantia
/// transacional em si é verificada por teste de integração quando o Outbox existir.
/// </para>
/// </remarks>
public sealed class ForbiddenDependencyTests
{
    public static TheoryData<string> StatefulModules()
    {
        TheoryData<string> data = new();
        foreach (string module in ArchitectureConventions.StatefulModules)
        {
            data.Add(module);
        }

        return data;
    }

    [Fact]
    public void No_project_declares_a_forbidden_package()
    {
        DirectoryInfo root = BackendRoot.Find();
        string binSegment = $"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}";
        string objSegment = $"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}";

        List<string> violations = root.EnumerateFiles("*.csproj", SearchOption.AllDirectories)
            .Concat(root.EnumerateFiles("Directory.*.props", SearchOption.TopDirectoryOnly))
            .Where(file => !file.FullName.Contains(binSegment, StringComparison.Ordinal)
                        && !file.FullName.Contains(objSegment, StringComparison.Ordinal))
            .SelectMany(file => PackageRules.ForbiddenPackages(File.ReadAllText(file.FullName))
                .Select(package => $"{Path.GetRelativePath(root.FullName, file.FullName)}: {package}"))
            .ToList();

        ArchAssert.NoViolations(
            violations,
            "Pacote proibido declarado. AutoMapper e MediatR: ADR-010, decisão 6. Barramento de mensagens: decisão 7. " +
            "Se precisar de mediator, a alternativa MIT avaliada é Mediator (martinothamar).");
    }

    [Fact]
    public void Scan_catches_forbidden_packages_and_allows_mit_alternative()
    {
        const string CentralPackages = """
            <Project>
              <ItemGroup>
                <PackageVersion Include="MediatR" Version="0.0.0" />
                <PackageVersion Include="Mediator.Abstractions" Version="0.0.0" />
                <PackageVersion Include="MassTransit" Version="0.0.0" />
              </ItemGroup>
            </Project>
            """;

        IReadOnlyList<string> found = PackageRules.ForbiddenPackages(CentralPackages);

        Assert.Equal(new[] { "MediatR", "MassTransit" }, found);
    }

    [Theory]
    [MemberData(nameof(StatefulModules))]
    public void Stateful_module_does_not_use_reflection_mapping(string module)
    {
        TestResult result = NamespaceRules.NoReflectionMapping(ArchitectureConventions.ProductionAssemblies, module);

        ArchAssert.Passes(
            result,
            $"O módulo {module} tem snapshot ou máquina de estado e usa mapeador por reflexão. " +
            "Converta manualmente em Converter/ (ADR-010, decisão 6).");
    }

    [Fact]
    public void Rule_catches_reflection_mapper_in_stateful_module()
    {
        TestResult result = NamespaceRules.NoReflectionMapping([ArchitectureConventions.FixturesAssembly], "Scheduling");

        ArchAssert.Detects(
            result,
            violators: ["Booking.Application.Module.Scheduling.Converter.AppointmentSnapshotMapper"],
            compliant: ["Booking.Application.Module.Scheduling.Commands.RequestAppointmentThroughCatalogContract"]);
    }
}
