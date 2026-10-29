namespace Booking.Application.Common.Media;

/// <summary>Os três tamanhos gerados de cada imagem enviada.</summary>
public enum ImageSize
{
    Small,
    Medium,
    Large,
}

/// <summary>Um tamanho já reencodado: WebP, sem nenhum metadado.</summary>
public sealed record ImageVariant(ImageSize Size, byte[] Webp, int Width, int Height);

/// <summary>
/// Porta do processamento de imagem (ADR-023). Recebe um arquivo cujo tipo já foi conferido pela assinatura
/// (<see cref="ImageSignature"/>) e devolve os três tamanhos em WebP, com a orientação corrigida e sem metadados (o
/// EXIF pode trazer o GPS de onde a foto foi tirada). Recusa imagem grande demais antes de decodificar.
/// </summary>
public interface IImageProcessor
{
    Task<IReadOnlyList<ImageVariant>> ProcessAsync(byte[] content, CancellationToken ct = default);
}
