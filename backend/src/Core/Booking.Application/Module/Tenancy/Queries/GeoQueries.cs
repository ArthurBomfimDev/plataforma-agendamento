using Booking.Application.Module.Tenancy.Geo;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.Domain.Exceptions;

namespace Booking.Application.Module.Tenancy.Queries;

/// <summary><c>GET /api/geo/postal-code/{cep}</c>. Aceita com ou sem hífen; precisa de 8 dígitos.</summary>
public sealed class LookupPostalCodeQuery(IPostalCodeLookup lookup)
{
    public async Task<PostalCodeResponse> ExecuteAsync(string? postalCode, CancellationToken ct = default)
    {
        string digits = new([.. (postalCode ?? string.Empty).Where(char.IsAsciiDigit)]);
        bool onlyDigitsAndHyphen = (postalCode ?? string.Empty).Trim().All(c => char.IsAsciiDigit(c) || c == '-');

        if (digits.Length != 8 || !onlyDigitsAndHyphen)
        {
            throw new DomainException("geo.postal_code_invalid");
        }

        PostalCodeAddress address = await lookup.LookupAsync(digits, ct)
            ?? throw new DomainException("postal_code.not_found");

        return new PostalCodeResponse(address.PostalCode, address.Street, address.District, address.City, address.State);
    }
}

/// <summary>
/// <c>GET /api/geo/search?q=</c>: até 5 lugares no Brasil. Uma página só, de tamanho fixo (ADR-010, decisão 4).
/// </summary>
public sealed class SearchPlacesQuery(IGeocodingProvider geocoder)
{
    public const int MaxResults = 5;
    public const int MinQueryLength = 3;
    public const int MaxQueryLength = 200;

    public async Task<PagedResult<GeoPlaceResponse>> ExecuteAsync(string? query, CancellationToken ct = default)
    {
        string text = string.Join(' ', (query ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));

        if (text.Length is < MinQueryLength or > MaxQueryLength)
        {
            throw new DomainException("geo.query_invalid");
        }

        IReadOnlyList<GeoPlace> places = await geocoder.GeocodeAsync(text, MaxResults, ct);
        GeoPlaceResponse[] items =
        [
            .. places.Take(MaxResults).Select(p => new GeoPlaceResponse(p.Label, p.Latitude, p.Longitude, p.Precision.ToString(), p.City, p.State)),
        ];

        return new PagedResult<GeoPlaceResponse>(items, Page: 1, PageSize: MaxResults, TotalCount: items.Length);
    }
}

/// <summary><c>GET /api/geo/reverse?lat=&amp;lng=</c>: o rótulo do bairro e da cidade do ponto.</summary>
public sealed class ReverseGeocodeQuery(IGeocodingProvider geocoder)
{
    public async Task<ReverseGeocodeResponse> ExecuteAsync(double? latitude, double? longitude, CancellationToken ct = default)
    {
        if (latitude is not { } lat || longitude is not { } lng
            || double.IsNaN(lat) || double.IsNaN(lng) || lat is < -90 or > 90 || lng is < -180 or > 180)
        {
            throw new DomainException("geo.coordinates_invalid");
        }

        // Arredondado aqui, antes de qualquer adaptador: nenhum provedor recebe a coordenada exata.
        GeoArea area = await geocoder.ReverseAsync(GeoPrivacy.Round(lat), GeoPrivacy.Round(lng), ct)
            ?? throw new DomainException("place.not_found");

        return new ReverseGeocodeResponse(area.Label, area.City, area.State);
    }
}
