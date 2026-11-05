using System.Collections.Concurrent;
using Booking.Application.Common.Media;

namespace Booking.IntegrationTests.Infrastructure;

/// <summary>O armazenamento de arquivos dos testes de API: em memória, para conferir o que foi gravado e apagado.</summary>
public sealed class InMemoryFileStorage : IFileStorage
{
    private readonly ConcurrentDictionary<string, (byte[] Content, string ContentType)> _files = new();

    public IReadOnlyDictionary<string, (byte[] Content, string ContentType)> Files =>
        _files.ToDictionary(pair => pair.Key, pair => pair.Value);

    public async Task SaveAsync(string path, Stream content, string contentType, CancellationToken ct = default)
    {
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, ct);
        _files[path] = (buffer.ToArray(), contentType);
    }

    public Task DeleteAsync(string path, CancellationToken ct = default)
    {
        _files.TryRemove(path, out _);
        return Task.CompletedTask;
    }

    public string GetUrl(string path) => $"/media/{path}";

    /// <summary>Os arquivos de uma referência (<c>{key}-s/m/l.webp</c>).</summary>
    public IReadOnlyList<string> PathsOf(string key) => [.. _files.Keys.Where(k => k.StartsWith(key + "-", StringComparison.Ordinal)).Order()];
}
