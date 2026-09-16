using System.Collections;
using System.Reflection;
using System.Runtime.CompilerServices;
using Booking.Domain.Base;
using Microsoft.EntityFrameworkCore;

namespace Booking.ArchitectureTests.Rules;

/// <summary>
/// Regras de forma — herança, tipo de propriedade, tipo de retorno. Reflexão basta aqui:
/// o que se verifica está na assinatura, não no corpo do método.
/// </summary>
internal static class ReflectionRules
{
    internal const BindingFlags DeclaredMembers =
        BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly;

    public static IReadOnlyList<Type> TypesOf(IEnumerable<Assembly> assemblies) =>
        assemblies
            .SelectMany(assembly => assembly.GetTypes())
            .Where(type => !type.IsDefined(typeof(CompilerGeneratedAttribute), inherit: false))
            .ToList();

    /// <summary>
    /// Decisão 2: abstração genérica de <c>Base/</c> só pode ser fechada com entidade da lista permitida.
    /// </summary>
    public static IReadOnlyList<string> ForbiddenBaseUsages(IEnumerable<Type> types)
    {
        List<string> violations = [];

        foreach (Type type in types)
        {
            foreach (Type baseAbstraction in GenericAncestors(type).Where(IsBaseAbstraction))
            {
                foreach (Type argument in baseAbstraction.GetGenericArguments())
                {
                    bool isEntity = !argument.IsGenericParameter && typeof(BaseEntity).IsAssignableFrom(argument);

                    if (isEntity && !ArchitectureConventions.EntitiesAllowedInBase.Contains(argument.Name))
                    {
                        violations.Add($"{type.FullName} usa {baseAbstraction.GetGenericTypeDefinition().Name} com {argument.Name}");
                    }
                }
            }
        }

        return violations.Distinct().ToList();
    }

    /// <summary>
    /// Decisão 3: toda propriedade <c>Id</c> ou <c>…Id</c> no domínio é <c>Guid</c>.
    /// </summary>
    public static IReadOnlyList<string> NonGuidIdentifiers(IEnumerable<Type> types) =>
        types
            .Where(type => type.Namespace?.StartsWith("Booking.Domain", StringComparison.Ordinal) == true)
            .SelectMany(type => type.GetProperties(DeclaredMembers)
                .Where(property => property.Name.EndsWith("Id", StringComparison.Ordinal))
                .Where(property => property.PropertyType != typeof(Guid) && property.PropertyType != typeof(Guid?))
                .Select(property => $"{type.FullName}.{property.Name} é {property.PropertyType.Name}"))
            .ToList();

    /// <summary>
    /// Decisão 4: base, <c>Queries/</c> e <c>*QueryService</c> não devolvem coleção fora de <see cref="PagedResult{T}"/>.
    /// </summary>
    public static IReadOnlyList<string> UnpaginatedCollections(IEnumerable<Type> types) =>
        types
            .Where(IsQuerySurface)
            .SelectMany(type => type.GetMethods(DeclaredMembers)
                .Where(method => method.IsPublic && !method.IsSpecialName)
                .Where(method => IsUnpaginatedCollection(UnwrapTask(method.ReturnType)))
                .Select(method => $"{type.FullName}.{method.Name} retorna {method.ReturnType.Name}"))
            .ToList();

    /// <summary>Decisão 5: não existe entidade de persistência separada.</summary>
    public static IReadOnlyList<string> SeparatePersistenceEntities(IEnumerable<Type> types) =>
        types
            .Where(type => type.Namespace?.Contains(".Persistence.Entit", StringComparison.Ordinal) == true)
            .Select(type => type.FullName ?? type.Name)
            .ToList();

    /// <summary>
    /// Decisão 5: o EF mapeia a entidade de domínio direto — configuração e DbSet só de tipo do domínio.
    /// </summary>
    public static IReadOnlyList<string> NonDomainPersistenceMappings(IEnumerable<Type> types)
    {
        List<string> violations = [];

        foreach (Type type in types)
        {
            IEnumerable<Type> configurations = type.GetInterfaces()
                .Where(contract => contract.IsGenericType && contract.GetGenericTypeDefinition() == typeof(IEntityTypeConfiguration<>));

            foreach (Type configuration in configurations)
            {
                Type mapped = configuration.GetGenericArguments()[0];
                if (!IsDomainType(mapped))
                {
                    violations.Add($"{type.FullName} mapeia {mapped.FullName}");
                }
            }

            if (!typeof(DbContext).IsAssignableFrom(type))
            {
                continue;
            }

            foreach (PropertyInfo property in type.GetProperties(DeclaredMembers))
            {
                bool isDbSet = property.PropertyType.IsGenericType
                    && property.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>);

                if (isDbSet && !IsDomainType(property.PropertyType.GetGenericArguments()[0]))
                {
                    violations.Add($"{type.FullName}.{property.Name} expõe DbSet<{property.PropertyType.GetGenericArguments()[0].Name}>");
                }
            }
        }

        return violations;
    }

    private static IEnumerable<Type> GenericAncestors(Type type)
    {
        for (Type? current = type.BaseType; current is not null; current = current.BaseType)
        {
            if (current.IsGenericType)
            {
                yield return current;
            }
        }

        foreach (Type contract in type.GetInterfaces())
        {
            if (contract.IsGenericType)
            {
                yield return contract;
            }
        }
    }

    private static bool IsBaseAbstraction(Type genericType)
    {
        string? ns = genericType.GetGenericTypeDefinition().Namespace;
        return ns is not null
            && ns.StartsWith("Booking.", StringComparison.Ordinal)
            && ns.EndsWith(".Base", StringComparison.Ordinal);
    }

    private static bool IsQuerySurface(Type type)
    {
        string ns = type.Namespace ?? string.Empty;
        if (!ns.StartsWith("Booking.", StringComparison.Ordinal))
        {
            return false;
        }

        return ns.EndsWith(".Base", StringComparison.Ordinal)
            || ns.Split('.').Contains("Queries")
            || type.Name.EndsWith("QueryService", StringComparison.Ordinal);
    }

    private static Type UnwrapTask(Type type)
    {
        if (!type.IsGenericType)
        {
            return type;
        }

        Type definition = type.GetGenericTypeDefinition();
        return definition == typeof(Task<>) || definition == typeof(ValueTask<>)
            ? type.GetGenericArguments()[0]
            : type;
    }

    private static bool IsUnpaginatedCollection(Type type)
    {
        if (type == typeof(string))
        {
            return false;
        }

        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(PagedResult<>))
        {
            return false;
        }

        bool isAsyncStream = type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IAsyncEnumerable<>);
        return isAsyncStream || typeof(IEnumerable).IsAssignableFrom(type);
    }

    private static bool IsDomainType(Type type) =>
        type.Namespace?.StartsWith("Booking.Domain.", StringComparison.Ordinal) == true;
}
