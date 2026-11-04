using Booking.Application.Common.Media;
using Booking.Application.Common.Search;
using Booking.Application.Contracts.Catalog;
using Booking.Application.Module.Tenancy.Queries;
using Booking.Arguments.Common;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Domain.ValueObject;

namespace Booking.UnitTests.Tenancy;

/// <summary>
/// A busca por termo de ponta a ponta na camada de aplicação (ADR-024), sem banco: repositório e catálogo falsos, o
/// restante é o código de produção.
/// </summary>
public sealed class SearchBusinessesQueryTests
{
    private static readonly DateTimeOffset _now = new(2026, 11, 4, 12, 0, 0, TimeSpan.Zero);
    private static readonly GeoPoint _center = GeoPoint.Of(-22.21, -49.65);

    private readonly Business _zeBarbearia = NewBusiness("Barbearia do Zé", BusinessCategory.Beleza);
    private readonly Business _silva = NewBusiness("Studio Silva", BusinessCategory.Beleza);
    private readonly Business _ana = NewBusiness("Esmalteria da Ana", BusinessCategory.Beleza);
    private readonly Business _clinic = NewBusiness("Clínica Vida", BusinessCategory.Saude);
    private readonly SearchBusinessesQuery _query;

    public SearchBusinessesQueryTests()
    {
        var services = new Dictionary<Guid, string[]>
        {
            [_zeBarbearia.Id] = ["Barba"],
            [_silva.Id] = ["Corte masculino"],
            [_ana.Id] = ["Manicure", "Pedicure"],
            [_clinic.Id] = ["Consulta de psicologia"],
        };

        _query = new SearchBusinessesQuery(
            new FakeBusinesses([_zeBarbearia, _silva, _ana, _clinic]), new FakeCatalog(services), new NoImages());
    }

    private async Task<PagedResult<BusinessSearchItemResponse>> SearchAsync(string term) =>
        await _query.ExecuteAsync(new SearchBusinessesRequest(_center.Latitude, _center.Longitude, Term: term));

    [Theory]
    [InlineData("barbeiro")]
    [InlineData("barbearia")]
    [InlineData("barba")]
    public async Task Barber_terms_bring_the_same_barbershops(string term)
    {
        PagedResult<BusinessSearchItemResponse> result = await SearchAsync(term);

        Assert.Equivalent(new[] { _zeBarbearia.Id, _silva.Id }, result.Items.Select(i => i.Id).ToArray());
    }

    [Theory]
    [InlineData("manicuri")]
    [InlineData("unha")]
    public async Task Nail_terms_find_the_nail_studio(string term)
    {
        PagedResult<BusinessSearchItemResponse> result = await SearchAsync(term);

        BusinessSearchItemResponse only = Assert.Single(result.Items);
        Assert.Equal(_ana.Id, only.Id);
    }

    [Fact]
    public async Task An_unrelated_term_brings_nothing()
    {
        PagedResult<BusinessSearchItemResponse> result = await SearchAsync("advogado");

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalCount);
    }

    [Fact]
    public async Task Health_result_shows_the_service_and_the_price_like_every_other_category()
    {
        PagedResult<BusinessSearchItemResponse> result = await SearchAsync("psicologa");

        BusinessSearchItemResponse clinic = Assert.Single(result.Items);
        Assert.Equal(_clinic.Id, clinic.Id);
        Assert.NotNull(clinic.ServiceId);
        Assert.Equal("Consulta de psicologia", clinic.ServiceName);
        Assert.Equal(30, clinic.DurationMinutes);
        Assert.Equal(5000, clinic.FromPriceCents);
    }

    [Fact]
    public async Task Beauty_result_keeps_the_service_that_matched()
    {
        PagedResult<BusinessSearchItemResponse> result = await SearchAsync("barba");

        BusinessSearchItemResponse shop = Assert.Single(result.Items, i => i.Id == _zeBarbearia.Id);
        Assert.Equal("Barba", shop.ServiceName);
    }

    private static Business NewBusiness(string name, BusinessCategory category)
    {
        var business = Business.Create(name, Document.Of("11.222.333/0001-81"), category);
        business.Geocode(GeoPoint.Of(-22.211, -49.651), LocationPrecision.Rooftop, "test", _now);
        business.ConfirmLocation(GeoPoint.Of(-22.211, -49.651), LocationPrecision.Rooftop, _now);
        return business;
    }

    private sealed class FakeBusinesses(IReadOnlyList<Business> all) : IBusinessRepository
    {
        public Task<IReadOnlyList<Business>> FindBookableNearbyAsync(GeoPoint center, double radiusMeters, int limit, CancellationToken ct = default) =>
            Task.FromResult(all);

        public Task<Business?> GetByIdAsync(Guid id, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<bool> ExistsByDocumentAsync(Document document, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<PagedResult<Business>> ListByStatusAsync(BusinessStatus status, BusinessCategory? category, PageRequest page, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public void Add(Business business) => throw new NotSupportedException();
    }

    // Imita o ServiceCatalog de produção: a mesma comparação (SearchText), em memória.
    private sealed class FakeCatalog(Dictionary<Guid, string[]> services) : IServiceCatalog
    {
        public Task<IReadOnlyList<ProfessionalServiceInfo>> ListForProfessionalAsync(Guid businessId, Guid professionalId, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<IReadOnlySet<Guid>> FilterBusinessesOfferingAsync(IReadOnlyCollection<Guid> businessIds, string term, CancellationToken ct = default)
        {
            IReadOnlyList<string> wanted = SearchText.Expand(term);
            IReadOnlySet<Guid> found = businessIds
                .Where(id => services.TryGetValue(id, out string[]? names) && names.Any(n => SearchText.Matches(n, wanted)))
                .ToHashSet();
            return Task.FromResult(found);
        }

        public Task<IReadOnlyDictionary<Guid, ServiceHighlight>> GetHighlightsAsync(IReadOnlyCollection<Guid> businessIds, string? term, CancellationToken ct = default)
        {
            IReadOnlyList<string> wanted = string.IsNullOrWhiteSpace(term) ? [] : SearchText.Expand(term);
            IReadOnlyDictionary<Guid, ServiceHighlight> highlights = businessIds
                .Where(services.ContainsKey)
                .ToDictionary(
                    id => id,
                    id => new ServiceHighlight(id, Guid.NewGuid(), services[id].FirstOrDefault(n => SearchText.Matches(n, wanted)) ?? services[id][0], 30, 5000));
            return Task.FromResult(highlights);
        }

        public Task<BookableService?> GetBookableAsync(Guid businessId, Guid serviceId, Guid professionalId, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<bool> HasBookableServiceAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();
    }

    private sealed class NoImages : IImageUrls
    {
        public ImageSetResponse? For(string? key) => null;
    }
}
