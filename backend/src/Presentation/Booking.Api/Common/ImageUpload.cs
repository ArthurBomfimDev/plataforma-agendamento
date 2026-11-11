using Booking.Application.Common.Media;
using Booking.Domain.Exceptions;

namespace Booking.Api.Common;

/// <summary>Limites comuns das rotas de envio de imagem (ADR-023).</summary>
public static class ImageUpload
{
    /// <summary>Política de limite: 20 envios por hora por usuário.</summary>
    public const string RateLimitPolicy = "uploads";

    /// <summary>
    /// Teto do corpo da requisição: os 5 MB da imagem e folga para o envelope multipart. Acima disto, o servidor
    /// recusa (413) sem ler; entre 5 MB e o teto, quem recusa é o <see cref="ImageStore"/>.
    /// </summary>
    public const long MaxRequestBytes = ImageStore.MaxBytes + (256 * 1024);

    /// <summary>O arquivo do campo <c>file</c>. Sem ele, 400.</summary>
    public static Stream Open(IFormFile? file) =>
        file is { Length: > 0 } ? file.OpenReadStream() : throw new DomainException("image.empty");
}
