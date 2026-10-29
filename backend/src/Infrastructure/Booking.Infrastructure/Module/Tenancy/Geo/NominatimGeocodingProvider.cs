using System.Globalization;
using System.Text.Json;
using Booking.Application.Module.Tenancy.Geo;
using Booking.Domain.Enum.Module.Tenancy;
using Microsoft.Extensions.Options;

namespace Booking.Infrastructure.Module.Tenancy.Geo;

/// <summary>
/// Nominatim (OpenStreetMap), API <c>jsonv2</c>. Só Brasil, rótulos em português. Cada chamada espera a vez na
/// <see cref="NominatimThrottle"/>; o cache fica no decorador (<see cref="CachingGeocodingProvider"/>).
/// </summary>
public sealed class NominatimGeocodingProvider(HttpClient http, NominatimThrottle throttle, IOptions<GeoOptions> options)
    : IGeocodingProvider
{
    public async Task<IReadOnlyList<GeoPlace>> GeocodeAsync(string query, int limit, CancellationToken ct = default)
    {
        string path = $"search?q={Uri.EscapeDataString(query)}&format=jsonv2&addressdetails=1&countrycodes=br" +
            $"&limit={limit.ToString(CultureInfo.InvariantCulture)}&accept-language=pt-BR{ContactParameter()}";

        using HttpResponseMessage response = await GeoHttp.SendAsync(
            http, () => new HttpRequestMessage(HttpMethod.Get, path), ct, throttle.WaitTurnAsync);

        if (!response.IsSuccessStatusCode)
        {
            return [];
        }

        using JsonDocument document = JsonDocument.Parse(await response.Content.ReadAsStreamAsync(ct));
        if (document.RootElement.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        var places = new List<GeoPlace>();
        foreach (JsonElement item in document.RootElement.EnumerateArray())
        {
            if (TryParsePlace(item, out GeoPlace? place))
            {
                places.Add(place);
            }
        }

        return places;
    }

    public async Task<string?> ReverseAsync(double latitude, double longitude, CancellationToken ct = default)
    {
        // Arredondado de novo aqui: o adaptador não confia em quem chama para proteger a coordenada.
        string lat = GeoPrivacy.Round(latitude).ToString("0.###", CultureInfo.InvariantCulture);
        string lng = GeoPrivacy.Round(longitude).ToString("0.###", CultureInfo.InvariantCulture);

        // zoom 14: bairro. O rótulo nunca desce à rua de quem consultou.
        string path = $"reverse?lat={lat}&lon={lng}&format=jsonv2&zoom=14&addressdetails=1&accept-language=pt-BR{ContactParameter()}";

        using HttpResponseMessage response = await GeoHttp.SendAsync(
            http, () => new HttpRequestMessage(HttpMethod.Get, path), ct, throttle.WaitTurnAsync);

        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        using JsonDocument document = JsonDocument.Parse(await response.Content.ReadAsStreamAsync(ct));
        JsonElement root = document.RootElement;

        if (root.ValueKind != JsonValueKind.Object || root.TryGetProperty("error", out _)
            || !root.TryGetProperty("address", out JsonElement address))
        {
            return null;
        }

        return ReverseLabel(new NominatimAddress(address));
    }

    private string ContactParameter() =>
        string.IsNullOrWhiteSpace(options.Value.Nominatim.Email)
            ? string.Empty
            : $"&email={Uri.EscapeDataString(options.Value.Nominatim.Email)}";

    public static bool TryParsePlace(JsonElement item, [System.Diagnostics.CodeAnalysis.NotNullWhen(true)] out GeoPlace? place)
    {
        place = null;

        if (!double.TryParse(Text(item, "lat"), NumberStyles.Float, CultureInfo.InvariantCulture, out double latitude)
            || !double.TryParse(Text(item, "lon"), NumberStyles.Float, CultureInfo.InvariantCulture, out double longitude))
        {
            return false;
        }

        var address = new NominatimAddress(item.TryGetProperty("address", out JsonElement a) ? a : default);
        LocationPrecision precision = PrecisionOf(Text(item, "addresstype"), address);
        string label = SearchLabel(precision, address) ?? Text(item, "display_name") ?? string.Empty;

        if (label.Length == 0)
        {
            return false;
        }

        place = new GeoPlace(label, latitude, longitude, precision);
        return true;
    }

    public static LocationPrecision PrecisionOf(string? addressType, NominatimAddress address) => addressType switch
    {
        _ when address.HouseNumber is not null => LocationPrecision.Rooftop,
        "house" or "building" or "amenity" or "shop" => LocationPrecision.Rooftop,
        "road" => LocationPrecision.Street,
        "neighbourhood" or "suburb" or "quarter" or "city_district" or "hamlet" or "residential" => LocationPrecision.Locality,
        "city" or "town" or "village" or "municipality" => LocationPrecision.City,
        _ => address.Locality is not null ? LocationPrecision.Locality : LocationPrecision.City,
    };

    /// <summary>"Rua X, 100 - Centro, Garça - SP", "Centro, Garça - SP" ou "Garça, SP", conforme a precisão.</summary>
    public static string? SearchLabel(LocationPrecision precision, NominatimAddress address)
    {
        if (address.City is null)
        {
            return null;
        }

        string cityState = address.State is null ? address.City : $"{address.City} - {address.State}";
        string? localityCity = address.Locality is null ? null : $"{address.Locality}, {cityState}";

        return precision switch
        {
            LocationPrecision.Rooftop or LocationPrecision.Street when address.Road is not null =>
                $"{address.Road}{(address.HouseNumber is null ? string.Empty : $", {address.HouseNumber}")}" +
                $" - {localityCity ?? cityState}",
            LocationPrecision.City => address.State is null ? address.City : $"{address.City}, {address.State}",
            _ => localityCity ?? (address.State is null ? address.City : $"{address.City}, {address.State}"),
        };
    }

    /// <summary>"Centro, Garça", ou "Garça, SP" quando o ponto não cai num bairro conhecido.</summary>
    public static string? ReverseLabel(NominatimAddress address)
    {
        if (address.City is null)
        {
            return address.Locality;
        }

        return address.Locality is not null
            ? $"{address.Locality}, {address.City}"
            : address.State is null ? address.City : $"{address.City}, {address.State}";
    }

    private static string? Text(JsonElement element, string property) =>
        element.ValueKind == JsonValueKind.Object
            && element.TryGetProperty(property, out JsonElement value)
            && value.ValueKind == JsonValueKind.String
            && !string.IsNullOrWhiteSpace(value.GetString())
            ? value.GetString()!.Trim()
            : null;

    /// <summary>O objeto <c>address</c> do Nominatim, com as várias chaves que querem dizer "bairro" e "cidade".</summary>
    public sealed class NominatimAddress(JsonElement address)
    {
        public string? Road { get; } = Text(address, "road") ?? Text(address, "pedestrian");
        public string? HouseNumber { get; } = Text(address, "house_number");

        public string? Locality { get; } =
            Text(address, "neighbourhood") ?? Text(address, "suburb") ?? Text(address, "quarter") ?? Text(address, "city_district");

        public string? City { get; } =
            Text(address, "city") ?? Text(address, "town") ?? Text(address, "village") ?? Text(address, "municipality");

        /// <summary>A sigla da UF, de <c>ISO3166-2-lvl4</c> ("BR-SP" → "SP").</summary>
        public string? State { get; } = Text(address, "ISO3166-2-lvl4") is { } iso && iso.StartsWith("BR-", StringComparison.Ordinal)
            ? iso[3..]
            : null;
    }
}
