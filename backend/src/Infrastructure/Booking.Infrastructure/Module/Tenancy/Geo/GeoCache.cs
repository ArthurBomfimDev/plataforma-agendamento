using System.Globalization;
using Booking.Application.Module.Tenancy.Geo;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Booking.Infrastructure.Module.Tenancy.Geo;

/// <summary>
/// Cache das consultas de localização, em memória e com tamanho limitado. Exigência da política do Nominatim e
/// economia de cota; resposta vazia também é guardada (por menos tempo), para a mesma consulta errada não voltar ao
/// provedor. Falha do provedor não é guardada.
/// </summary>
public sealed class GeoCache(IOptions<GeoOptions> options) : IDisposable
{
    private const int _maxEntries = 5_000;
    private static readonly TimeSpan _emptyLifetime = TimeSpan.FromHours(1);

    private readonly MemoryCache _cache = new(new MemoryCacheOptions { SizeLimit = _maxEntries });

    public async Task<T?> GetOrAddAsync<T>(string key, Func<Task<T?>> load, Func<T?, bool> isEmpty)
    {
        if (_cache.TryGetValue(key, out Box<T>? cached) && cached is not null)
        {
            return cached.Value;
        }

        T? value = await load();
        TimeSpan lifetime = isEmpty(value) ? _emptyLifetime : TimeSpan.FromHours(Math.Max(1, options.Value.CacheHours));
        _cache.Set(key, new Box<T>(value), new MemoryCacheEntryOptions { Size = 1, AbsoluteExpirationRelativeToNow = lifetime });

        return value;
    }

    public void Dispose() => _cache.Dispose();

    /// <summary>Consulta normalizada: sem espaço sobrando e sem diferença de maiúscula.</summary>
    public static string Normalize(string text) =>
        string.Join(' ', text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)).ToLower(CultureInfo.InvariantCulture);

    private sealed record Box<T>(T? Value);
}

public sealed class CachingGeocodingProvider(IGeocodingProvider inner, GeoCache cache) : IGeocodingProvider
{
    public async Task<IReadOnlyList<GeoPlace>> GeocodeAsync(string query, int limit, CancellationToken ct = default) =>
        await cache.GetOrAddAsync<IReadOnlyList<GeoPlace>>(
            $"search:{limit}:{GeoCache.Normalize(query)}",
            async () => await inner.GeocodeAsync(query, limit, ct),
            places => places is null || places.Count == 0) ?? [];

    public Task<string?> ReverseAsync(double latitude, double longitude, CancellationToken ct = default)
    {
        // A chave usa o ponto já arredondado: dois pontos no mesmo quarteirão dividem a resposta.
        string key = string.Create(CultureInfo.InvariantCulture, $"reverse:{GeoPrivacy.Round(latitude):0.000},{GeoPrivacy.Round(longitude):0.000}");
        return cache.GetOrAddAsync(key, () => inner.ReverseAsync(latitude, longitude, ct), label => label is null);
    }
}

public sealed class CachingPostalCodeLookup(IPostalCodeLookup inner, GeoCache cache) : IPostalCodeLookup
{
    public Task<PostalCodeAddress?> LookupAsync(string postalCode, CancellationToken ct = default) =>
        cache.GetOrAddAsync($"cep:{postalCode}", () => inner.LookupAsync(postalCode, ct), address => address is null);
}
