using System.Net;
using System.Net.Http.Json;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Tenancy;

/// <summary>
/// Onda 6B: CEP, busca por endereço e rótulo do ponto, contra a API real com os adaptadores reais. A rede é o
/// <see cref="FakeGeoHttp"/>: nenhuma chamada sai da máquina.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class GeoTests(IntegrationFixture fixture)
{
    private const string _brasilApiCentro = """
        {"cep":"17400000","state":"SP","city":"Garça","neighborhood":null,"street":null,"service":"open-cep"}
        """;

    private const string _brasilApiRua = """
        {"cep":"17400070","state":"SP","city":"Garça","neighborhood":"Centro","street":"Rua Carlos Ferrari","service":"correios"}
        """;

    private const string _nominatimCentro = """
        {"lat":"-22.2163","lon":"-49.6555","addresstype":"suburb","display_name":"Centro, Garça, São Paulo, Brasil",
         "address":{"suburb":"Centro","city":"Garça","state":"São Paulo","ISO3166-2-lvl4":"BR-SP","country_code":"br"}}
        """;

    private static readonly string _nominatimSearch = $$$"""
        [{{{_nominatimCentro}}},
         {"lat":"-22.2125","lon":"-49.6564","addresstype":"city","display_name":"Garça, São Paulo, Brasil",
          "address":{"city":"Garça","state":"São Paulo","ISO3166-2-lvl4":"BR-SP"}},
         {"lat":"-22.2100","lon":"-49.6500","addresstype":"road","display_name":"Rua Carlos Ferrari, Centro, Garça",
          "address":{"road":"Rua Carlos Ferrari","suburb":"Centro","city":"Garça","ISO3166-2-lvl4":"BR-SP"}}]
        """;

    private BookingApiFactory Factory => fixture.Factory;

    [Fact]
    public async Task L1_postal_code_returns_the_address_with_or_without_hyphen_and_identifies_the_application()
    {
        Factory.Geo.Respond("api/cep/v1/17400070", HttpStatusCode.OK, _brasilApiRua);

        PostalCodeResponse address = await GetOkAsync<PostalCodeResponse>("/api/geo/postal-code/17400-070");

        Assert.Equal(new PostalCodeResponse("17400070", "Rua Carlos Ferrari", "Centro", "Garça", "SP"), address);

        GeoCall call = Assert.Single(Factory.Geo.Calls, c => c.Uri.AbsolutePath.EndsWith("/api/cep/v1/17400070", StringComparison.Ordinal));
        Assert.Equal("brasilapi.com.br", call.Uri.Host);
        Assert.Contains("Vagoo", call.UserAgent);
    }

    [Fact]
    public async Task L2_invalid_postal_code_is_400_without_calling_out_and_unknown_is_404()
    {
        int before = Factory.Geo.Calls.Count;

        foreach (string invalid in new[] { "1740000", "abc12345", "17400-0000" })
        {
            using HttpResponseMessage response = await Factory.CreateClient().GetAsync($"/api/geo/postal-code/{invalid}");
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal("geo.postal_code_invalid", await TestWorld.ErrorCodeAsync(response));
        }

        Assert.Equal(before, Factory.Geo.Calls.Count);

        Factory.Geo.Respond("api/cep/v1/99999999", HttpStatusCode.NotFound, """{"message":"CEP não encontrado"}""");
        using HttpResponseMessage missing = await Factory.CreateClient().GetAsync("/api/geo/postal-code/99999999");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        Assert.Equal("postal_code.not_found", await TestWorld.ErrorCodeAsync(missing));
    }

    [Fact]
    public async Task L3_search_returns_up_to_five_places_in_brazil_and_repeats_from_cache()
    {
        string term = $"centro garca {Guid.NewGuid():N}"[..30];
        Factory.Geo.Respond("search?q=", HttpStatusCode.OK, _nominatimSearch);

        PagedResult<GeoPlaceResponse> first = await GetOkAsync<PagedResult<GeoPlaceResponse>>($"/api/geo/search?q={Uri.EscapeDataString(term)}");

        Assert.Equal(5, first.PageSize);
        Assert.Collection(
            first.Items,
            p => Assert.Equal(("Centro, Garça - SP", "Locality"), (p.Label, p.Precision)),
            p => Assert.Equal(("Garça, SP", "City"), (p.Label, p.Precision)),
            p => Assert.Equal(("Rua Carlos Ferrari - Centro, Garça - SP", "Street"), (p.Label, p.Precision)));

        GeoCall call = Assert.Single(Factory.Geo.Calls, c => Searched(c, term));
        Assert.Contains("countrycodes=br", call.Uri.Query);
        Assert.Contains("limit=5", call.Uri.Query);

        // A mesma consulta, com outra caixa e espaços a mais: vem do cache, sem nova chamada.
        PagedResult<GeoPlaceResponse> second = await GetOkAsync<PagedResult<GeoPlaceResponse>>(
            $"/api/geo/search?q={Uri.EscapeDataString("  " + term.ToUpperInvariant() + "  ")}");
        Assert.Equal(first.Items, second.Items);
        Assert.Single(Factory.Geo.Calls, c => Searched(c, term));
    }

    /// <summary>A chamada de busca levou este texto, qualquer que seja a caixa e o escape usados na URL.</summary>
    private static bool Searched(GeoCall call, string term) =>
        call.Uri.AbsolutePath.EndsWith("/search", StringComparison.Ordinal)
        && Uri.UnescapeDataString(call.Uri.Query.Replace('+', ' ')).Contains(term, StringComparison.OrdinalIgnoreCase);

    [Fact]
    public async Task L4_reverse_sends_the_point_rounded_to_three_decimals_and_never_logs_it()
    {
        var logs = new LogCapture(categoryPrefix: string.Empty);
        await using var factory = new BookingApiFactory(fixture.ConnectionString, logs: logs);
        factory.Geo.Respond("reverse?", HttpStatusCode.OK, _nominatimCentro);
        using HttpClient client = factory.CreateClient();

        using HttpResponseMessage response = await client.GetAsync("/api/geo/reverse?lat=-22.2163456&lng=-49.6554321");
        await TestWorld.EnsureStatusAsync(response, HttpStatusCode.OK);
        Assert.Equal("Centro, Garça", (await response.Content.ReadFromJsonAsync<ReverseGeocodeResponse>(TestWorld.Json))!.Label);

        GeoCall call = Assert.Single(factory.Geo.Calls);
        Assert.Contains("lat=-22.216&lon=-49.655", call.Uri.Query);
        Assert.DoesNotContain("2163456", call.Uri.Query);

        // Nem a coordenada exata nem a arredondada aparecem em categoria nenhuma, com Debug aberto.
        Assert.NotEmpty(logs.Entries);
        Assert.DoesNotContain(logs.Entries, e => e.Message.Contains("22.216", StringComparison.Ordinal)
            || e.Message.Contains("49.655", StringComparison.Ordinal));
        Assert.DoesNotContain(logs.Entries, e => e.Category.StartsWith("System.Net.Http.HttpClient", StringComparison.Ordinal));
    }

    [Fact]
    public async Task L5_one_transient_failure_is_retried_and_two_are_a_503()
    {
        await using var factory = new BookingApiFactory(fixture.ConnectionString);
        using HttpClient client = factory.CreateClient();

        factory.Geo.RespondOnce("api/cep/v1/17400000", HttpStatusCode.ServiceUnavailable, "{}");
        factory.Geo.Respond("api/cep/v1/17400000", HttpStatusCode.OK, _brasilApiCentro);

        using (HttpResponseMessage retried = await client.GetAsync("/api/geo/postal-code/17400000"))
        {
            await TestWorld.EnsureStatusAsync(retried, HttpStatusCode.OK);
        }

        Assert.Equal(2, factory.Geo.Calls.Count);

        factory.Geo.Respond("api/cep/v1/17400999", HttpStatusCode.InternalServerError, "{}");
        using HttpResponseMessage down = await client.GetAsync("/api/geo/postal-code/17400999");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, down.StatusCode);
        Assert.Equal("geo.provider_unavailable", await TestWorld.ErrorCodeAsync(down));
        Assert.Equal(2, factory.Geo.Calls.Count(c => c.Uri.AbsolutePath.EndsWith("17400999", StringComparison.Ordinal)));
    }

    [Fact]
    public async Task L6_invalid_text_and_coordinates_are_400()
    {
        foreach ((string path, string code) in new[]
        {
            ("/api/geo/search?q=ab", "geo.query_invalid"),
            ("/api/geo/search", "geo.query_invalid"),
            ("/api/geo/reverse?lat=91&lng=0", "geo.coordinates_invalid"),
            ("/api/geo/reverse?lat=-22.2", "geo.coordinates_invalid"),
        })
        {
            using HttpResponseMessage response = await Factory.CreateClient().GetAsync(path);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal(code, await TestWorld.ErrorCodeAsync(response));
        }
    }

    [Fact]
    public async Task L7_public_geo_routes_are_rate_limited_per_ip()
    {
        await using var factory = new BookingApiFactory(fixture.ConnectionString);
        using HttpClient client = factory.CreateClient();

        var statuses = new List<HttpStatusCode>();
        for (int i = 0; i < 31; i++)
        {
            using HttpResponseMessage response = await client.GetAsync("/api/geo/postal-code/123");
            statuses.Add(response.StatusCode);
        }

        Assert.All(statuses.Take(30), s => Assert.Equal(HttpStatusCode.BadRequest, s));
        Assert.Equal(HttpStatusCode.TooManyRequests, statuses[30]);
    }

    private async Task<T> GetOkAsync<T>(string path)
    {
        using HttpResponseMessage response = await Factory.CreateClient().GetAsync(path);
        await TestWorld.EnsureStatusAsync(response, HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<T>(TestWorld.Json))!;
    }
}
