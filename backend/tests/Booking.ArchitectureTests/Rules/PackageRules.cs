using System.Xml.Linq;

namespace Booking.ArchitectureTests.Rules;

internal static class PackageRules
{
    /// <summary>
    /// Decisões 6 e 7: pacotes proibidos declarados em um .csproj ou .props.
    /// </summary>
    /// <remarks>
    /// Lê o arquivo, não o assembly compilado: pacote referenciado e ainda não usado some da lista de
    /// referências do assembly, mas continua sendo uma dependência instalada — e é aí que ele entra.
    /// </remarks>
    public static IReadOnlyList<string> ForbiddenPackages(string projectFileContent)
    {
        XDocument document = XDocument.Parse(projectFileContent);

        return document.Descendants()
            .Where(element => element.Name.LocalName is "PackageReference" or "PackageVersion" or "GlobalPackageReference")
            .Select(element => (string?)element.Attribute("Include") ?? (string?)element.Attribute("Update"))
            .OfType<string>()
            .Where(id => ArchitectureConventions.ForbiddenPackages.Contains(id, StringComparer.OrdinalIgnoreCase))
            .ToList();
    }
}
