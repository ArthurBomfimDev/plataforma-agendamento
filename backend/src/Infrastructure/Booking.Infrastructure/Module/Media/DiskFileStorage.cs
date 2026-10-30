using System.Text.RegularExpressions;
using Booking.Application.Common.Media;
using Microsoft.Extensions.Options;

namespace Booking.Infrastructure.Module.Media;

/// <summary>Seção <c>Storage</c>: onde ficam os arquivos (<c>Storage__Root</c>) — no Docker, o volume <c>media-data</c>.</summary>
public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>Pasta raiz. Relativa é resolvida a partir da pasta de trabalho do processo.</summary>
    public string Root { get; set; } = "media-data";

    /// <summary>Caminho público em que a API serve os arquivos.</summary>
    public const string RequestPath = "/media";

    public string ResolvedRoot => Path.GetFullPath(Root);
}

/// <summary>
/// Armazenamento em disco local (ADR-023). O disco do contêiner não é o armazenamento: a pasta é um volume, com
/// backup junto com o do banco. Recusa qualquer caminho que não seja o formato gerado pelo sistema, e confere que o
/// caminho final continua dentro da raiz: sem saída da pasta por nome.
/// </summary>
public sealed partial class DiskFileStorage(IOptions<StorageOptions> options) : IFileStorage
{
    private readonly string _root = EnsureTrailingSeparator(options.Value.ResolvedRoot);

    public async Task SaveAsync(string path, Stream content, string contentType, CancellationToken ct = default)
    {
        string fullPath = Resolve(path);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        // Grava ao lado e troca: quem lê nunca vê o arquivo pela metade.
        string temporary = $"{fullPath}.{Guid.NewGuid():N}.tmp";
        await using (var file = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81_920, useAsync: true))
        {
            await content.CopyToAsync(file, ct);
        }

        File.Move(temporary, fullPath, overwrite: true);
    }

    public Task DeleteAsync(string path, CancellationToken ct = default)
    {
        string fullPath = Resolve(path);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    public string GetUrl(string path) => $"{StorageOptions.RequestPath}/{Validate(path)}";

    private string Resolve(string path)
    {
        string fullPath = Path.GetFullPath(Path.Combine(_root, Validate(path)));

        // Segunda barreira, além do formato: o caminho resolvido precisa continuar dentro da raiz.
        if (!fullPath.StartsWith(_root, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Caminho de arquivo fora da pasta de mídia.");
        }

        return fullPath;
    }

    private static string Validate(string path) => Pattern().IsMatch(path)
        ? path
        : throw new InvalidOperationException("Caminho de arquivo inválido.");

    private static string EnsureTrailingSeparator(string root) =>
        root.EndsWith(Path.DirectorySeparatorChar) ? root : root + Path.DirectorySeparatorChar;

    // O formato do ImageStore: segmentos minúsculos separados por "/", e um arquivo .webp no fim.
    [GeneratedRegex("^[a-z0-9][a-z0-9-]*(/[a-z0-9][a-z0-9-]*)*\\.webp$")]
    private static partial Regex Pattern();
}
