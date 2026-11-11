using Booking.Application.Common.Media;
using Booking.Domain.Exceptions;
using Booking.Domain.ValueObject;
using Booking.Infrastructure.Module.Media;
using Microsoft.Extensions.Options;

namespace Booking.UnitTests.Media;

/// <summary>Assinatura do arquivo, formato da referência e o adaptador de disco numa pasta temporária.</summary>
public sealed class MediaTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"booking-disk-{Guid.NewGuid():N}");

    public void Dispose()
    {
        if (Directory.Exists(_root))
        {
            Directory.Delete(_root, recursive: true);
        }
    }

    private DiskFileStorage Disk() => new(Options.Create(new StorageOptions { Root = _root }));

    [Theory]
    [InlineData(new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 }, ImageFormat.Jpeg)]
    [InlineData(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }, ImageFormat.Png)]
    [InlineData(new byte[] { 0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50 }, ImageFormat.Webp)]
    [InlineData(new byte[] { 0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45 }, ImageFormat.Unknown)] // RIFF de áudio
    [InlineData(new byte[] { 0x4D, 0x5A, 0x90, 0x00 }, ImageFormat.Unknown)]                                   // executável
    [InlineData(new byte[] { 0x3C, 0x73, 0x76, 0x67 }, ImageFormat.Unknown)]                                   // "<svg"
    [InlineData(new byte[] { 0x47, 0x49, 0x46, 0x38 }, ImageFormat.Unknown)]                                   // GIF
    public void Signature_decides_the_type(byte[] header, ImageFormat expected) =>
        Assert.Equal(expected, ImageSignature.Detect(header));

    [Theory]
    [InlineData("../fora")]
    [InlineData("businesses/../../etc/passwd")]
    [InlineData("/absoluto")]
    [InlineData("C:\\Windows")]
    [InlineData("businesses\\abc")]
    [InlineData("Businesses/ABC")]
    [InlineData("")]
    public void Image_key_refuses_anything_but_the_generated_format(string key) =>
        Assert.Equal("image.key_invalid", Assert.Throws<DomainException>(() => ImageKey.Ensure(key)).Code);

    [Fact]
    public async Task Disk_saves_reads_back_and_deletes_inside_the_root()
    {
        DiskFileStorage disk = Disk();
        const string path = "businesses/0193abc/f00d-m.webp";

        await disk.SaveAsync(path, new MemoryStream([1, 2, 3]), "image/webp");

        string file = Path.Combine(_root, "businesses", "0193abc", "f00d-m.webp");
        Assert.Equal([1, 2, 3], await File.ReadAllBytesAsync(file));
        Assert.Equal("/media/businesses/0193abc/f00d-m.webp", disk.GetUrl(path));
        Assert.Empty(Directory.GetFiles(Path.GetDirectoryName(file)!, "*.tmp"));

        await disk.DeleteAsync(path);
        await disk.DeleteAsync(path); // apagar o que não existe não é erro
        Assert.False(File.Exists(file));
    }

    [Theory]
    [InlineData("../fora.webp")]
    [InlineData("businesses/../../fora.webp")]
    [InlineData("businesses/%2e%2e/fora.webp")]
    [InlineData("/etc/passwd.webp")]
    [InlineData("businesses\\..\\fora.webp")]
    [InlineData("businesses/logo.svg")]
    [InlineData("businesses/logo.webp.exe")]
    public async Task Disk_never_leaves_the_root_by_name(string path)
    {
        DiskFileStorage disk = Disk();

        await Assert.ThrowsAsync<InvalidOperationException>(() => disk.SaveAsync(path, new MemoryStream([1]), "image/webp"));
        await Assert.ThrowsAsync<InvalidOperationException>(() => disk.DeleteAsync(path));
        Assert.Throws<InvalidOperationException>(() => disk.GetUrl(path));
        Assert.False(File.Exists(Path.Combine(Path.GetTempPath(), "fora.webp")));
    }
}
