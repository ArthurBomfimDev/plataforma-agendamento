using System.Reflection;
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
    /// </remarks>
    public static TestResult ModuleBoundary(IEnumerable<Assembly> assemblies, string module)
    {
        string[] otherModulesInternals = ArchitectureConventions.Modules
            .Where(other => other != module)
            .SelectMany(other => ArchitectureConventions.Layers.Select(layer => $"Booking.{layer}.Module.{other}"))
            .ToArray();

        return Types.InAssemblies(assemblies)
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
