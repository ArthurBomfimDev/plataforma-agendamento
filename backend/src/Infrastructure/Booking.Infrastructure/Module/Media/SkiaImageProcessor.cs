using Booking.Application.Common.Media;
using Booking.Domain.Exceptions;
using SkiaSharp;

namespace Booking.Infrastructure.Module.Media;

/// <summary>
/// Processamento com SkiaSharp (MIT; ADR-023). Lê as dimensões pelo cabeçalho antes de decodificar (imagem-bomba
/// é recusada sem alocar os pixels), corrige a orientação do EXIF e reencoda em WebP. O WebP gerado só leva pixels:
/// nenhum metadado do original (EXIF, GPS, XMP, ICC) passa adiante.
/// </summary>
public sealed class SkiaImageProcessor : IImageProcessor
{
    /// <summary>Lado máximo aceito na leitura.</summary>
    public const int MaxDimension = 6000;

    /// <summary>Teto de pixels (um 6000 × 6000 passa raspando): contra a imagem estreita e comprida demais.</summary>
    public const long MaxPixels = 36_000_000;

    private const int _quality = 80;

    /// <summary>Lado maior de cada tamanho. Nunca aumenta: imagem menor fica do tamanho que veio.</summary>
    private static readonly (ImageSize Size, int MaxSide)[] _sizes =
    [
        (ImageSize.Small, 160),
        (ImageSize.Medium, 640),
        (ImageSize.Large, 1280),
    ];

    public Task<IReadOnlyList<ImageVariant>> ProcessAsync(byte[] content, CancellationToken ct = default)
    {
        using var data = SKData.CreateCopy(content);
        using SKCodec? codec = SKCodec.Create(data);

        if (codec is null || codec.EncodedFormat is not (SKEncodedImageFormat.Jpeg or SKEncodedImageFormat.Png or SKEncodedImageFormat.Webp))
        {
            throw new DomainException("image.unsupported_type");
        }

        SKImageInfo header = codec.Info;
        if (header.Width <= 0 || header.Height <= 0 || header.Width > MaxDimension || header.Height > MaxDimension
            || (long)header.Width * header.Height > MaxPixels)
        {
            throw new DomainException("image.dimensions_too_large");
        }

        var info = new SKImageInfo(header.Width, header.Height, SKColorType.Rgba8888, SKAlphaType.Premul);
        using var decoded = new SKBitmap(info);
        SKCodecResult result = codec.GetPixels(info, decoded.GetPixels());

        if (result is not (SKCodecResult.Success or SKCodecResult.IncompleteInput))
        {
            throw new DomainException("image.unreadable");
        }

        using SKBitmap oriented = Orient(decoded, codec.EncodedOrigin);
        var variants = new List<ImageVariant>(_sizes.Length);

        foreach ((ImageSize size, int maxSide) in _sizes)
        {
            ct.ThrowIfCancellationRequested();
            variants.Add(Encode(oriented, size, maxSide));
        }

        return Task.FromResult<IReadOnlyList<ImageVariant>>(variants);
    }

    private static ImageVariant Encode(SKBitmap source, ImageSize size, int maxSide)
    {
        double scale = Math.Min(1d, (double)maxSide / Math.Max(source.Width, source.Height));
        int width = Math.Max(1, (int)Math.Round(source.Width * scale));
        int height = Math.Max(1, (int)Math.Round(source.Height * scale));

        using SKBitmap resized = width == source.Width && height == source.Height
            ? source.Copy()
            : source.Resize(new SKImageInfo(width, height, source.ColorType, source.AlphaType), new SKSamplingOptions(SKCubicResampler.Mitchell));
        using SKImage image = SKImage.FromBitmap(resized);
        using SKData webp = image.Encode(SKEncodedImageFormat.Webp, _quality)
            ?? throw new DomainException("image.unreadable");

        return new ImageVariant(size, webp.ToArray(), width, height);
    }

    /// <summary>Aplica a orientação gravada pela câmera (EXIF), para a foto não sair deitada.</summary>
    private static SKBitmap Orient(SKBitmap source, SKEncodedOrigin origin)
    {
        if (origin is SKEncodedOrigin.TopLeft or SKEncodedOrigin.Default)
        {
            return source.Copy();
        }

        bool swaps = origin is SKEncodedOrigin.LeftTop or SKEncodedOrigin.RightTop or SKEncodedOrigin.RightBottom or SKEncodedOrigin.LeftBottom;
        var info = new SKImageInfo(swaps ? source.Height : source.Width, swaps ? source.Width : source.Height, source.ColorType, source.AlphaType);
        var target = new SKBitmap(info);

        using var canvas = new SKCanvas(target);
        canvas.SetMatrix(OriginMatrix(origin, source.Width, source.Height));
        using SKImage image = SKImage.FromBitmap(source);
        canvas.DrawImage(image, 0, 0, SKSamplingOptions.Default);

        return target;
    }

    private static SKMatrix OriginMatrix(SKEncodedOrigin origin, int width, int height) => origin switch
    {
        SKEncodedOrigin.TopRight => new SKMatrix(-1, 0, width, 0, 1, 0, 0, 0, 1),
        SKEncodedOrigin.BottomRight => new SKMatrix(-1, 0, width, 0, -1, height, 0, 0, 1),
        SKEncodedOrigin.BottomLeft => new SKMatrix(1, 0, 0, 0, -1, height, 0, 0, 1),
        SKEncodedOrigin.LeftTop => new SKMatrix(0, 1, 0, 1, 0, 0, 0, 0, 1),
        SKEncodedOrigin.RightTop => new SKMatrix(0, -1, height, 1, 0, 0, 0, 0, 1),
        SKEncodedOrigin.RightBottom => new SKMatrix(0, -1, height, -1, 0, width, 0, 0, 1),
        SKEncodedOrigin.LeftBottom => new SKMatrix(0, 1, 0, -1, 0, width, 0, 0, 1),
        _ => SKMatrix.Identity,
    };
}
