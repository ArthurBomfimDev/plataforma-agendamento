using System.Diagnostics;
using System.Text.Json;
using Booking.Application.Module.Tenancy.Geo;
using Booking.Application.Module.Tenancy.Queries;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Infrastructure.Module.Tenancy.Geo;
using Microsoft.Extensions.Options;

namespace Booking.UnitTests.Tenancy;

public sealed class GeoTests
{
    private static NominatimGeocodingProvider.NominatimAddress Address(string json) =>
        new(JsonDocument.Parse(json).RootElement);

    [Theory]
    [InlineData(-22.2163456, -22.216)]
    [InlineData(-49.6555, -49.656)]
    [InlineData(0.0004, 0.0)]
    public void Coordinates_are_rounded_to_three_decimals_before_leaving(double raw, double expected) =>
        Assert.Equal(expected, GeoPrivacy.Round(raw));

    [Fact]
    public void Nominatim_labels_follow_the_precision_of_the_place()
    {
        var street = Address("""{"road":"Rua Carlos Ferrari","house_number":"120","suburb":"Centro","city":"Garça","ISO3166-2-lvl4":"BR-SP"}""");
        var district = Address("""{"neighbourhood":"Jardim Paulista","town":"Garça","ISO3166-2-lvl4":"BR-SP"}""");
        var city = Address("""{"municipality":"Garça","ISO3166-2-lvl4":"BR-SP"}""");

        Assert.Equal(LocationPrecision.Rooftop, NominatimGeocodingProvider.PrecisionOf("building", street));
        Assert.Equal("Rua Carlos Ferrari, 120 - Centro, Garça - SP", NominatimGeocodingProvider.SearchLabel(LocationPrecision.Rooftop, street));

        Assert.Equal(LocationPrecision.Locality, NominatimGeocodingProvider.PrecisionOf("neighbourhood", district));
        Assert.Equal("Jardim Paulista, Garça - SP", NominatimGeocodingProvider.SearchLabel(LocationPrecision.Locality, district));

        Assert.Equal(LocationPrecision.City, NominatimGeocodingProvider.PrecisionOf("municipality", city));
        Assert.Equal("Garça, SP", NominatimGeocodingProvider.SearchLabel(LocationPrecision.City, city));
    }

    [Fact]
    public void Reverse_label_says_district_and_city_and_never_the_street()
    {
        var withStreet = Address("""{"road":"Rua X","house_number":"9","suburb":"Centro","city":"Garça","ISO3166-2-lvl4":"BR-SP"}""");
        var cityOnly = Address("""{"town":"Garça","ISO3166-2-lvl4":"BR-SP"}""");

        Assert.Equal("Centro, Garça", NominatimGeocodingProvider.ReverseLabel(withStreet));
        Assert.Equal("Garça, SP", NominatimGeocodingProvider.ReverseLabel(cityOnly));
    }

    [Fact]
    public void Search_result_without_coordinates_is_skipped()
    {
        JsonElement item = JsonDocument.Parse("""{"display_name":"Sem ponto","address":{"city":"Garça"}}""").RootElement;

        Assert.False(NominatimGeocodingProvider.TryParsePlace(item, out _));
    }

    [Fact]
    public async Task Nominatim_calls_wait_their_turn_at_the_minimum_interval()
    {
        var options = Options.Create(new GeoOptions { Nominatim = new NominatimOptions { MinIntervalMilliseconds = 150 } });
        var throttle = new NominatimThrottle(TimeProvider.System, options);

        var watch = Stopwatch.StartNew();
        await Task.WhenAll(throttle.WaitTurnAsync(default), throttle.WaitTurnAsync(default), throttle.WaitTurnAsync(default));

        // Três vezes na fila: a terceira sai pelo menos dois intervalos depois da primeira.
        Assert.True(watch.ElapsedMilliseconds >= 280, $"saiu em {watch.ElapsedMilliseconds} ms");
    }

    [Fact]
    public async Task Cache_answers_the_same_normalized_query_without_calling_again()
    {
        var inner = new CountingGeocoder();
        using var cache = new GeoCache(Options.Create(new GeoOptions()));
        var geocoder = new CachingGeocodingProvider(inner, cache);

        await geocoder.GeocodeAsync("Centro  Garça", 5);
        await geocoder.GeocodeAsync("  centro garça ", 5);
        await geocoder.ReverseAsync(-22.2161, -49.6551);
        await geocoder.ReverseAsync(-22.2159, -49.6549);

        Assert.Equal(1, inner.Searches);
        Assert.Equal(1, inner.Reverses);
    }

    [Theory]
    [InlineData("1740000")]
    [InlineData("17400 000")]
    [InlineData("1740O000")]
    [InlineData("")]
    public async Task Postal_code_needs_eight_digits(string postalCode)
    {
        var query = new LookupPostalCodeQuery(new NoPostalCodes());

        DomainException error = await Assert.ThrowsAsync<DomainException>(() => query.ExecuteAsync(postalCode));
        Assert.Equal("geo.postal_code_invalid", error.Code);
    }

    private sealed class CountingGeocoder : IGeocodingProvider
    {
        public int Searches { get; private set; }
        public int Reverses { get; private set; }

        public Task<IReadOnlyList<GeoPlace>> GeocodeAsync(string query, int limit, CancellationToken ct = default)
        {
            Searches++;
            return Task.FromResult<IReadOnlyList<GeoPlace>>([new GeoPlace("Centro, Garça - SP", -22.2, -49.6, LocationPrecision.Locality)]);
        }

        public Task<string?> ReverseAsync(double latitude, double longitude, CancellationToken ct = default)
        {
            Reverses++;
            return Task.FromResult<string?>("Centro, Garça");
        }
    }

    private sealed class NoPostalCodes : IPostalCodeLookup
    {
        public Task<PostalCodeAddress?> LookupAsync(string postalCode, CancellationToken ct = default) =>
            Task.FromResult<PostalCodeAddress?>(null);
    }
}
