using System.Reflection;
using System.Text.RegularExpressions;
using NetArchTest.Rules;

namespace Booking.ArchitectureTests.Rules;

/// <summary>
/// Regras de dependência por namespace. Usam o NetArchTest, que lê o IL — pega a dependência também
/// dentro do corpo de método, não só em assinatura, campo e propriedade.
/// </summary>
internal static class NamespaceRules
{
    /// <summary>
    /// Decisão 1: código em <c>Booking.*.Module.X</c> não depende de <c>Booking.*.Module.Y</c>.
    /// </summary>
    /// <remarks>
    /// A superfície pública de um módulo fica fora de <c>Module</c>, em
    /// <c>Booking.Application.Contracts.Y</c> — por isso não entra na lista proibida.
    ///
    /// A lista proibida sai dos namespaces que existem nos assemblies, filtrados pelo mesmo
    /// <see cref="ArchitectureConventions.ModuleNamespacePattern"/> que seleciona o módulo. Montar os
    /// prefixos à mão deixava de fora as categorias (<c>Domain.Entity.Module</c>,
    /// <c>Infrastructure.Persistence.Mapping.Module</c>) e a regra passava sem enxergar nada.
    /// </remarks>
    public static TestResult ModuleBoundary(IEnumerable<Assembly> assemblies, string module)
    {
        Assembly[] scanned = assemblies.ToArray();

        Regex[] otherModules = ArchitectureConventions.Modules
            .Where(other => other != module)
            .Select(other => new Regex(ArchitectureConventions.ModuleNamespacePattern(other)))
            .ToArray();

        string[] otherModulesInternals = scanned
            .SelectMany(assembly => assembly.GetTypes())
            .Select(type => type.Namespace)
            .OfType<string>()
            .Distinct()
            .Where(ns => otherModules.Any(pattern => pattern.IsMatch(ns)))
            .ToArray();

        return Types.InAssemblies(scanned)
            .That()
            .ResideInNamespaceMatching(ArchitectureConventions.ModuleNamespacePattern(module))
            .Should()
            .NotHaveDependencyOnAny(otherModulesInternals)
            .GetResult();
    }

    /// <summary>
    /// Decisão 6: módulo com snapshot ou máquina de estado não usa mapeador automático por reflexão.
    /// </summary>
    public static TestResult NoReflectionMapping(IEnumerable<Assembly> assemblies, string module)
    {
        return Types.InAssemblies(assemblies)
            .That()
            .ResideInNamespaceMatching(ArchitectureConventions.ModuleNamespacePattern(module))
            .Should()
            .NotHaveDependencyOnAny(ArchitectureConventions.ReflectionMappingNamespaces)
            .GetResult();
    }
}
