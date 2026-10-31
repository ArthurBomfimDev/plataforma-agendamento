using System.Globalization;
using System.Net;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Tenancy;

/// <summary>
/// Busca para a tela de resultados: serviço em destaque com preço "a partir de", categoria, preço máximo e ordenação.
/// Cada teste usa um ponto próprio, longe dos outros testes, com raio de 1 km.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class SearchTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private Task<PagedResult<BusinessSearchItemResponse>> SearchAsync(TestLocation center, string extra = "") =>
        _world.SendOkAsync<PagedResult<BusinessSearchItemResponse>>(
            HttpMethod.Get,
            string.Create(CultureInfo.InvariantCulture, $"/api/businesses/search?latitude={center.Latitude}&longitude={center.Longitude}&radiusKm=1{extra}"),
            null, null!);

    [Fact]
    public async Task H1_card_shows_the_service_that_matches_the_term_or_the_cheapest()
    {
        TestLocation here = TestLocation.Isolated();
        TestBusiness business = await _world.NewBusinessAsync(
            1, [new ServiceSpec(45, PriceCents: 4000, Name: "Corte masculino"), new ServiceSpec(20, PriceCents: 2500, Name: "Barba")], location: here);

        BusinessSearchItemResponse cheapest = Assert.Single((await SearchAsync(here)).Items);
        Assert.Equal(business.Id, cheapest.Id);
        Assert.Equal("Barba", cheapest.ServiceName);
        Assert.Equal(2500, cheapest.FromPriceCents);
        Assert.Equal(20, cheapest.DurationMinutes);

        BusinessSearchItemResponse matched = Assert.Single((await SearchAsync(here, "&term=corte")).Items);
        Assert.Equal("Corte masculino", matched.ServiceName);
        Assert.Equal(4000, matched.FromPriceCents);
        Assert.Equal(45, matched.DurationMinutes);
    }

    [Fact]
    public async Task H2_category_filter_keeps_only_that_vertical()
    {
        TestLocation here = TestLocation.Isolated();
        TestBusiness beauty = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], location: here);
        TestBusiness health = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], category: "Saude", location: here.North(100));

        Assert.Equal(2, (await SearchAsync(here)).TotalCount);
        Assert.Equal(health.Id, Assert.Single((await SearchAsync(here, "&category=Saude")).Items).Id);
        Assert.Equal(beauty.Id, Assert.Single((await SearchAsync(here, "&category=beleza")).Items).Id);
    }

    [Fact]
    public async Task H3_sort_by_price_and_max_price_work_over_the_highlighted_service()
    {
        TestLocation here = TestLocation.Isolated();
        TestBusiness near = await _world.NewBusinessAsync(1, [new ServiceSpec(30, PriceCents: 3000)], location: here);
        TestBusiness middle = await _world.NewBusinessAsync(1, [new ServiceSpec(30, PriceCents: 1500)], location: here.North(200));
        TestBusiness far = await _world.NewBusinessAsync(1, [new ServiceSpec(30, PriceCents: 6000)], location: here.North(400));

        Assert.Equal([near.Id, middle.Id, far.Id], (await SearchAsync(here)).Items.Select(i => i.Id));
        Assert.Equal([middle.Id, near.Id, far.Id], (await SearchAsync(here, "&sortBy=price")).Items.Select(i => i.Id));

        PagedResult<BusinessSearchItemResponse> upTo3000 = await SearchAsync(here, "&maxPriceCents=3000");
        Assert.Equal(2, upTo3000.TotalCount);
        Assert.Equal([near.Id, middle.Id], upTo3000.Items.Select(i => i.Id));
    }

    [Fact]
    public async Task H5_city_filter_ignores_accent_case_and_spacing_and_drops_other_cities()
    {
        // Nome de cidade único por teste: com cidade, o raio é de 50 km e pegaria estabelecimentos de outros testes.
        string suffix = Guid.NewGuid().ToString("N")[..8];
        string city = $"São Tomé {suffix}";
        TestLocation here = TestLocation.Isolated();
        TestBusiness inCity = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], location: here, city: city);
        // A 5 km, fora do raio de 1 km: com cidade, o raio pedido não vale.
        TestBusiness farInCity = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], location: here.North(5_000), city: city);
        await _world.NewBusinessAsync(1, [new ServiceSpec(30)], location: here.North(100), city: $"Outra {suffix}");

        foreach (string query in new[] { $"são tomé {suffix}", $"SAO TOME {suffix}", $"  Sao   Tome {suffix} " })
        {
            PagedResult<BusinessSearchItemResponse> result = await SearchAsync(here, $"&city={Uri.EscapeDataString(query)}");
            Assert.Equal([inCity.Id, farInCity.Id], result.Items.Select(i => i.Id));
        }

        Assert.Empty((await SearchAsync(here, $"&city={Uri.EscapeDataString($"São Tomás {suffix}")}")).Items);
    }

    [Fact]
    public async Task H6_city_keeps_the_50_km_ceiling_and_combines_with_the_other_filters()
    {
        string suffix = Guid.NewGuid().ToString("N")[..8];
        string city = $"Itaí {suffix}";
        TestLocation here = TestLocation.Isolated();
        TestBusiness beauty = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], location: here, city: city);
        TestBusiness health = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], category: "Saude", location: here.North(20_000), city: city);
        // Homônima a 60 km: fora do teto de 50 km.
        await _world.NewBusinessAsync(1, [new ServiceSpec(30)], location: here.North(60_000), city: city);

        string byCity = $"&city={Uri.EscapeDataString(city)}";
        Assert.Equal([beauty.Id, health.Id], (await SearchAsync(here, byCity)).Items.Select(i => i.Id));
        Assert.Equal(health.Id, Assert.Single((await SearchAsync(here, byCity + "&category=Saude")).Items).Id);

        // Sem cidade, vale o raio de antes (1 km nesta busca).
        Assert.Equal(beauty.Id, Assert.Single((await SearchAsync(here)).Items).Id);
    }

    [Fact]
    public async Task H7_cabelo_with_any_case_or_accent_and_corte_find_the_same_business()
    {
        TestLocation here = TestLocation.Isolated();
        TestBusiness haircut = await _world.NewBusinessAsync(1, [new ServiceSpec(30, Name: "Corte masculino")], location: here);
        await _world.NewBusinessAsync(1, [new ServiceSpec(45, Name: "Manicure")], location: here.North(100));

        foreach (string term in new[] { "cabelo", "Cabelo", "cabêlo", "CABELOS", "corte", "CÔRTE" })
        {
            BusinessSearchItemResponse found = Assert.Single((await SearchAsync(here, $"&term={Uri.EscapeDataString(term)}")).Items);
            Assert.Equal(haircut.Id, found.Id);
            Assert.Equal("Corte masculino", found.ServiceName);
        }
    }

    [Fact]
    public async Task H8_term_matches_synonyms_the_category_name_and_accented_service_names()
    {
        TestLocation here = TestLocation.Isolated();
        TestBusiness nails = await _world.NewBusinessAsync(1, [new ServiceSpec(45, Name: "Pé e mão")], location: here);
        TestBusiness hair = await _world.NewBusinessAsync(1, [new ServiceSpec(60, Name: "Hidratação")], location: here.North(100));
        TestBusiness health = await _world.NewBusinessAsync(
            1, [new ServiceSpec(50, Name: "Sessão de psicoterapia")], category: "Saude", location: here.North(200));

        Assert.Equal(nails.Id, Assert.Single((await SearchAsync(here, "&term=unhas")).Items).Id);
        Assert.Equal(hair.Id, Assert.Single((await SearchAsync(here, "&term=hidratacao")).Items).Id);
        Assert.Equal(health.Id, Assert.Single((await SearchAsync(here, "&term=psicologa")).Items).Id);
        // O nome da categoria também casa, sem acento.
        Assert.Equal(health.Id, Assert.Single((await SearchAsync(here, "&term=saude")).Items).Id);
        Assert.Empty((await SearchAsync(here, "&term=tatuagem")).Items);
    }

    [Fact]
    public async Task H4_invalid_sort_or_category_is_refused()
    {
        TestLocation here = TestLocation.Isolated();

        foreach ((string extra, string code) in new[] { ("&sortBy=rating", "search.sort_invalid"), ("&category=Pet", "business.category_invalid") })
        {
            using HttpResponseMessage response = await _world.SendAsync(
                HttpMethod.Get,
                string.Create(CultureInfo.InvariantCulture, $"/api/businesses/search?latitude={here.Latitude}&longitude={here.Longitude}{extra}"),
                null, null);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal(code, await TestWorld.ErrorCodeAsync(response));
        }
    }
}
