using Booking.Application.Contracts.Catalog;
using Booking.Application.Module.Tenancy.Commands;
using Booking.Application.Module.Tenancy.Converter;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Domain.ValueObject;

namespace Booking.Application.Module.Tenancy.Queries;

public sealed class GetCurrentBusinessQuery(CurrentBusinessLoader loader)
{
    public async Task<BusinessDetailResponse> ExecuteAsync(CancellationToken ct = default) =>
        BusinessConverter.ToDetail(await loader.LoadForOwnerAsync(ct));
}

/// <summary>Vitrine: só estabelecimento ativo aparece para o público.</summary>
public sealed class GetPublicBusinessQuery(IBusinessRepository businesses)
{
    public async Task<PublicBusinessResponse> ExecuteAsync(Guid businessId, CancellationToken ct = default)
    {
        Business? business = await businesses.GetByIdAsync(businessId, ct);

        return business is { IsBookable: true }
            ? BusinessConverter.ToPublic(business)
            : throw new DomainException("business.not_found");
    }
}

/// <summary>
/// Busca em etapas, na ordem fixada no projeto: filtro geográfico → texto → paginação.
/// O cálculo de horários fica para a página exibida, em consulta separada por estabelecimento.
/// </summary>
public sealed class SearchBusinessesQuery(IBusinessRepository businesses, IServiceCatalog catalog)
{
    private const int _maxCandidates = 500;
    private const int _maxPageSize = 50;
    private const double _maxRadiusKm = 50;

    public async Task<PagedResult<BusinessSearchItemResponse>> ExecuteAsync(SearchBusinessesRequest request, CancellationToken ct = default)
    {
        GeoPoint center = GeoPoint.Of(request.Latitude, request.Longitude);
        double radiusKm = Math.Clamp(request.RadiusKm, 0.1, _maxRadiusKm);
        int page = Math.Max(1, request.Page);
        int pageSize = Math.Clamp(request.PageSize, 1, _maxPageSize);

        IReadOnlyList<Business> nearby = await businesses.FindBookableNearbyAsync(center, radiusKm * 1000, _maxCandidates, ct);
        IEnumerable<Business> matching = nearby;

        if (!string.IsNullOrWhiteSpace(request.Term))
        {
            string term = request.Term.Trim();
            IReadOnlySet<Guid> offering = await catalog.FilterBusinessesOfferingAsync([.. nearby.Select(b => b.Id)], term, ct);

            matching = nearby.Where(b => offering.Contains(b.Id) || b.Name.Contains(term, StringComparison.OrdinalIgnoreCase));
        }

        List<Business> all = [.. matching];

        List<BusinessSearchItemResponse> items = all
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BusinessSearchItemResponse(
                b.Id,
                b.Name,
                b.Category.ToString(),
                b.VerificationLevel == Domain.Enum.Module.Tenancy.VerificationLevel.Verified,
                b.District,
                b.City,
                Math.Round(DistanceKm(center, b.Location!), 2)))
            .ToList();

        return new PagedResult<BusinessSearchItemResponse>(items, page, pageSize, all.Count);
    }

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
