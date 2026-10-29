using System.Buffers.Binary;
using SkiaSharp;

namespace Booking.IntegrationTests.Infrastructure;

/// <summary>Imagens montadas no teste, sem arquivo no repositório.</summary>
public static class TestImages
{
    public static byte[] Png(int width, int height) => Encode(width, height, SKEncodedImageFormat.Png);

    public static byte[] Jpeg(int width, int height) => Encode(width, height, SKEncodedImageFormat.Jpeg);

    /// <summary>
    /// JPEG com um bloco EXIF (APP1) que leva orientação e coordenada de GPS — como sai da câmera de um celular. O
    /// texto <see cref="GpsMarker"/> vai no bloco, para o teste procurar se sobrou alguma coisa.
    /// </summary>
    public static byte[] JpegWithExif(int width, int height, ushort orientation)
    {
        byte[] jpeg = Jpeg(width, height);
        byte[] tiff = ExifTiff(orientation);
        byte[] header = [.. "Exif\0\0"u8];

        int segmentLength = 2 + header.Length + tiff.Length;
        byte[] app1 = new byte[2 + segmentLength];
        app1[0] = 0xFF;
        app1[1] = 0xE1;
        BinaryPrimitives.WriteUInt16BigEndian(app1.AsSpan(2), (ushort)segmentLength);
        header.CopyTo(app1, 4);
        tiff.CopyTo(app1, 4 + header.Length);

        // Logo depois do SOI (FF D8).
        return [.. jpeg[..2], .. app1, .. jpeg[2..]];
    }

    public const string GpsMarker = "GPS-22S-49W";

    private static byte[] Encode(int width, int height, SKEncodedImageFormat format)
    {
        using var bitmap = new SKBitmap(width, height);
        using (var canvas = new SKCanvas(bitmap))
        {
            canvas.Clear(SKColors.SteelBlue);
            using var paint = new SKPaint { Color = SKColors.Orange };
            canvas.DrawRect(0, 0, width / 2f, height / 2f, paint);
        }

        using SKImage image = SKImage.FromBitmap(bitmap);
        using SKData data = image.Encode(format, 90);
        return data.ToArray();
    }

    /// <summary>TIFF little-endian: IFD0 com Orientation e o ponteiro do GPS; GPS IFD com a latitude "S" e um texto.</summary>
    private static byte[] ExifTiff(ushort orientation)
    {
        byte[] marker = [.. System.Text.Encoding.ASCII.GetBytes(GpsMarker), 0];
        var tiff = new byte[8 + 30 + 30 + marker.Length];
        Span<byte> t = tiff;

        "II"u8.CopyTo(t);
        BinaryPrimitives.WriteUInt16LittleEndian(t[2..], 42);
        BinaryPrimitives.WriteUInt32LittleEndian(t[4..], 8);

        // IFD0, em 8: 2 entradas.
        BinaryPrimitives.WriteUInt16LittleEndian(t[8..], 2);
        WriteEntry(t[10..], tag: 0x0112, type: 3, count: 1, value: orientation);   // Orientation
        WriteEntry(t[22..], tag: 0x8825, type: 4, count: 1, value: 38);            // GPS IFD
        BinaryPrimitives.WriteUInt32LittleEndian(t[34..], 0);

        // GPS IFD, em 38: GPSLatitudeRef = "S" e GPSAreaInformation com o marcador.
        BinaryPrimitives.WriteUInt16LittleEndian(t[38..], 2);
        WriteEntry(t[40..], tag: 0x0001, type: 2, count: 2, value: 'S');
        WriteEntry(t[52..], tag: 0x001C, type: 7, count: (uint)marker.Length, value: 68);
        BinaryPrimitives.WriteUInt32LittleEndian(t[64..], 0);
        marker.CopyTo(t[68..]);

        return tiff;
    }

    private static void WriteEntry(Span<byte> entry, ushort tag, ushort type, uint count, uint value)
    {
        BinaryPrimitives.WriteUInt16LittleEndian(entry, tag);
        BinaryPrimitives.WriteUInt16LittleEndian(entry[2..], type);
        BinaryPrimitives.WriteUInt32LittleEndian(entry[4..], count);
        BinaryPrimitives.WriteUInt32LittleEndian(entry[8..], value);
    }
}
