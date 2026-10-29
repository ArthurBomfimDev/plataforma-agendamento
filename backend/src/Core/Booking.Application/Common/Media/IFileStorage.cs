namespace Booking.Application.Common.Media;

/// <summary>
/// Porta do armazenamento de arquivos (ADR-023). Hoje, disco local num volume do Docker; depois, um armazenamento
/// compatível com S3 (Cloudflare R2, por exemplo) entra como outro adaptador, sem mexer no domínio.
/// </summary>
public interface IFileStorage
{
    /// <summary>Grava (ou sobrescreve) o arquivo no caminho relativo <paramref name="path"/>.</summary>
    Task SaveAsync(string path, Stream content, string contentType, CancellationToken ct = default);

    /// <summary>Apaga o arquivo. Arquivo que já não existe não é erro.</summary>
    Task DeleteAsync(string path, CancellationToken ct = default);

    /// <summary>URL pública do arquivo: relativa à API (<c>/media/…</c>) ou absoluta.</summary>
    string GetUrl(string path);
}
