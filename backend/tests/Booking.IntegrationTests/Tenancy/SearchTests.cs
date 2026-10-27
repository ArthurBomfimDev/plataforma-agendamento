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
