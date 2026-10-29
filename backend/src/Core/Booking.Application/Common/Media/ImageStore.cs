using Booking.Arguments.Common;
using Booking.Domain.Exceptions;

namespace Booking.Application.Common.Media;

/// <summary>Monta as URLs de uma imagem guardada. Os conversores recebem isto para preencher as respostas.</summary>
public interface IImageUrls
{
    /// <summary>Nulo quando não há imagem: o frontend mostra o padrão visual.</summary>
    ImageSetResponse? For(string? key);
}

/// <summary>
/// Recebe, confere, processa e guarda uma imagem (ADR-023). A ordem importa: tamanho, depois assinatura, depois
/// decodificação — o arquivo errado é recusado antes de qualquer biblioteca de imagem tocar nele.
/// </summary>
public sealed class ImageStore(IFileStorage storage, IImageProcessor processor) : IImageUrls
{
    /// <summary>5 MB.</summary>
    public const long MaxBytes = 5 * 1024 * 1024;

    private static readonly ImageSize[] _sizes = [ImageSize.Small, ImageSize.Medium, ImageSize.Large];

    /// <summary>
    /// Guarda os três tamanhos em <c>{folder}/{guid}-{s|m|l}.webp</c> e devolve a referência (<c>{folder}/{guid}</c>).
    /// O nome enviado é ignorado: o arquivo ganha um nome aleatório, nunca reutilizado.
    /// </summary>
    public async Task<string> StoreAsync(Stream upload, string folder, CancellationToken ct = default)
    {
        byte[] content = await ReadLimitedAsync(upload, ct);

        if (ImageSignature.Detect(content) == ImageFormat.Unknown)
        {
            throw new DomainException("image.unsupported_type");
        }

        IReadOnlyList<ImageVariant> variants = await processor.ProcessAsync(content, ct);
        string key = $"{folder}/{Guid.CreateVersion7():N}";
        var saved = new List<string>();

        try
        {
            foreach (ImageVariant variant in variants)
            {
                string path = PathOf(key, variant.Size);
                using var stream = new MemoryStream(variant.Webp, writable: false);
                await storage.SaveAsync(path, stream, "image/webp", ct);
                saved.Add(path);
            }
        }
        catch
        {
            // Nada de meia imagem no disco.
            foreach (string path in saved)
            {
                await storage.DeleteAsync(path, CancellationToken.None);
            }

            throw;
        }

        return key;
    }

    /// <summary>Apaga os três tamanhos. Sem referência, não faz nada.</summary>
    public async Task DeleteAsync(string? key, CancellationToken ct = default)
    {
        if (key is null)
        {
            return;
        }

        foreach (ImageSize size in _sizes)
        {
            await storage.DeleteAsync(PathOf(key, size), ct);
        }
    }

    public ImageSetResponse? For(string? key) => key is null
        ? null
        : new ImageSetResponse(
            storage.GetUrl(PathOf(key, ImageSize.Small)),
            storage.GetUrl(PathOf(key, ImageSize.Medium)),
            storage.GetUrl(PathOf(key, ImageSize.Large)));

    public static string PathOf(string key, ImageSize size) => size switch
    {
        ImageSize.Small => $"{key}-s.webp",
        ImageSize.Medium => $"{key}-m.webp",
        _ => $"{key}-l.webp",
    };

    /// <summary>Lê no máximo <see cref="MaxBytes"/> + 1: o arquivo grande demais é recusado sem ser lido inteiro.</summary>
    private static async Task<byte[]> ReadLimitedAsync(Stream upload, CancellationToken ct)
    {
        using var buffer = new MemoryStream();
        byte[] chunk = new byte[81_920];
        int read;

        while ((read = await upload.ReadAsync(chunk, ct)) > 0)
        {
            if (buffer.Length + read > MaxBytes)
            {
                throw new DomainException("image.too_large");
            }

            buffer.Write(chunk, 0, read);
        }

        if (buffer.Length == 0)
        {
            throw new DomainException("image.empty");
        }

        return buffer.ToArray();
    }
}
