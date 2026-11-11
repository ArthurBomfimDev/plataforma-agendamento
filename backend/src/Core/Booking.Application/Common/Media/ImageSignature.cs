namespace Booking.Application.Common.Media;

public enum ImageFormat
{
    Unknown,
    Jpeg,
    Png,
    Webp,
}

/// <summary>
/// Tipo do arquivo pelo conteúdo (os primeiros bytes), nunca pela extensão nem pelo <c>Content-Type</c>, que quem
/// envia escolhe. Só JPEG, PNG e WebP passam. SVG não passa: é texto e pode levar script.
/// </summary>
public static class ImageSignature
{
    private static readonly byte[] _jpeg = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] _png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private static readonly byte[] _riff = "RIFF"u8.ToArray();
    private static readonly byte[] _webp = "WEBP"u8.ToArray();

    public static ImageFormat Detect(ReadOnlySpan<byte> header)
    {
        if (header.StartsWith(_jpeg))
        {
            return ImageFormat.Jpeg;
        }

        if (header.StartsWith(_png))
        {
            return ImageFormat.Png;
        }

        // RIFF <tamanho de 4 bytes> WEBP
        if (header.Length >= 12 && header.StartsWith(_riff) && header[8..12].SequenceEqual(_webp))
        {
            return ImageFormat.Webp;
        }

        return ImageFormat.Unknown;
    }
}
