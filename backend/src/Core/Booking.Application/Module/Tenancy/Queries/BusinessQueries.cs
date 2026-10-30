using Booking.Application.Common.Media;
using Booking.Application.Common.Search;
using Booking.Application.Contracts.Catalog;
using Booking.Application.Module.Tenancy.Commands;
using Booking.Application.Module.Tenancy.Converter;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Domain.ValueObject;

namespace Booking.Application.Module.Tenancy.Queries;

public sealed class GetCurrentBusinessQuery(CurrentBusinessLoader loader, IImageUrls images)
{
    public async Task<BusinessDetailResponse> ExecuteAsync(CancellationToken ct = default) =>
        BusinessConverter.ToDetail(await loader.LoadForOwnerAsync(ct), images);
}

/// <summary>Vitrine: só estabelecimento ativo aparece para o público.</summary>
public sealed class GetPublicBusinessQuery(IBusinessRepository businesses, IImageUrls images)
{
    public async Task<PublicBusinessResponse> ExecuteAsync(Guid businessId, CancellationToken ct = default)
    {
        Business? business = await businesses.GetByIdAsync(businessId, ct);

        return business is { IsBookable: true }
            ? BusinessConverter.ToPublic(business, images)
            : throw new DomainException("business.not_found");
    }
}

/// <summary>
/// Busca em etapas, na ordem fixada no projeto: filtro geográfico → texto → paginação. Categoria e preço são
/// filtros sobre o conjunto que o filtro geográfico já cortou, antes da paginação; a ordenação também.
/// O cálculo de horários fica para a página exibida, em consulta separada por estabelecimento.
/// </summary>
public sealed class SearchBusinessesQuery(IBusinessRepository businesses, IServiceCatalog catalog, IImageUrls images)
{
    private const int _maxCandidates = 500;
    private const int _maxPageSize = 50;
    private const double _maxRadiusKm = 50;

    public async Task<PagedResult<BusinessSearchItemResponse>> ExecuteAsync(SearchBusinessesRequest request, CancellationToken ct = default)
    {
        GeoPoint center = GeoPoint.Of(request.Latitude, request.Longitude);
        string? city = string.IsNullOrWhiteSpace(request.City) ? null : SearchText.Normalize(request.City);
        // Com cidade, o raio é o teto: a cidade decide, e o teto evita trazer a homônima de outro estado.
        double radiusKm = city is null ? Math.Clamp(request.RadiusKm, 0.1, _maxRadiusKm) : _maxRadiusKm;
        int page = Math.Max(1, request.Page);
        int pageSize = Math.Clamp(request.PageSize, 1, _maxPageSize);
        bool byPrice = ParseSort(request.SortBy);

        // 1. Geográfico (ST_DWithin sobre índice GiST), já em ordem de distância.
        IEnumerable<Business> matching = await businesses.FindBookableNearbyAsync(center, radiusKm * 1000, _maxCandidates, ct);

        if (city is not null)
        {
            matching = matching.Where(b => b.City is not null && SearchText.Normalize(b.City) == city);
        }

        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            if (!System.Enum.TryParse(request.Category, ignoreCase: true, out BusinessCategory category))
            {
                throw new DomainException("business.category_invalid");
            }

            matching = matching.Where(b => b.Category == category);
        }

        List<Business> candidates = [.. matching];
        string? term = string.IsNullOrWhiteSpace(request.Term) ? null : request.Term.Trim();

        // 2. Texto (ADR-024): nome do estabelecimento, nome da categoria ou de um serviço ativo, sem acento, sem caixa
        // e com os sinônimos de SearchText ("cabelo" acha "Corte masculino").
        if (term is not null)
        {
            IReadOnlyList<string> wanted = SearchText.Expand(term);
            IReadOnlySet<Guid> offering = await catalog.FilterBusinessesOfferingAsync([.. candidates.Select(b => b.Id)], term, ct);

            candidates = [.. candidates.Where(b =>
                offering.Contains(b.Id) || SearchText.Matches(b.Name, wanted) || SearchText.Matches(CategoryName(b.Category), wanted))];
        }

        IReadOnlyDictionary<Guid, ServiceHighlight> highlights = await catalog.GetHighlightsAsync([.. candidates.Select(b => b.Id)], term, ct);

        if (request.MaxPriceCents is long maxPrice)
        {
            candidates = [.. candidates.Where(b => highlights.TryGetValue(b.Id, out ServiceHighlight? h) && h.FromPriceCents <= maxPrice)];
        }

        if (byPrice)
        {
            // OrderBy é estável: no empate de preço, fica a ordem de distância.
            candidates = [.. candidates.OrderBy(b => highlights.TryGetValue(b.Id, out ServiceHighlight? h) ? h.FromPriceCents : long.MaxValue)];
        }

        // 3. Paginação.
        List<BusinessSearchItemResponse> items = candidates
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b =>
            {
                ServiceHighlight? h = highlights.GetValueOrDefault(b.Id);
                return new BusinessSearchItemResponse(
                    b.Id,
                    b.Name,
                    b.Category.ToString(),
                    b.VerificationLevel == VerificationLevel.Verified,
                    b.District,
                    b.City,
                    Math.Round(DistanceKm(center, b.Location!), 2),
                    h?.ServiceId,
                    h?.Name,
                    h?.DurationMinutes,
                    h?.FromPriceCents,
                    images.For(b.LogoImageKey),
                    images.For(b.CoverImageKey));
            })
            .ToList();

        return new PagedResult<BusinessSearchItemResponse>(items, page, pageSize, candidates.Count);
    }

    /// <summary>O nome da categoria como a pessoa escreve: "Saúde" casa com <c>Saude</c>.</summary>
    private static string CategoryName(BusinessCategory category) => category switch
    {
        BusinessCategory.Saude => "Saúde",
        _ => category.ToString(),
    };

    private static bool ParseSort(string? sortBy) => sortBy?.Trim().ToLowerInvariant() switch
    {
        null or "" or "distance" => false,
        "price" => true,
        _ => throw new DomainException("search.sort_invalid"),
    };

    // Só para exibir "1,2 km": o filtro de raio já foi feito no banco.
    private static double DistanceKm(GeoPoint a, GeoPoint b)
    {
        const double earthRadiusKm = 6371.0;
        double dLat = DegreesToRadians(b.Latitude - a.Latitude);
        double dLon = DegreesToRadians(b.Longitude - a.Longitude);
        double h = (Math.Sin(dLat / 2) * Math.Sin(dLat / 2))
            + (Math.Cos(DegreesToRadians(a.Latitude)) * Math.Cos(DegreesToRadians(b.Latitude)) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2));
        return 2 * earthRadiusKm * Math.Asin(Math.Sqrt(h));
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180;
}
