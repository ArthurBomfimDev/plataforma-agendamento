using Booking.Application.Common.Tenancy;
using Booking.Application.Module.Catalog.Converter;
using Booking.Arguments.Module.Catalog;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Catalog;
using Booking.Domain.Interface.Repository.Module.Catalog;

namespace Booking.Application.Module.Catalog.Queries;

public sealed class ListServicesQuery(IServiceRepository services, IServiceProfessionalRepository links, IActorContext actor)
{
    public async Task<PagedResult<ServiceResponse>> ExecuteAsync(PageRequest page, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireBusinessId();

        PagedResult<Service> result = await services.ListAsync(page, ct);
        IReadOnlyList<ServiceProfessional> assigned = await links.ListForServicesAsync(businessId, [.. result.Items.Select(s => s.Id)], ct);

        return new PagedResult<ServiceResponse>(
            [.. result.Items.Select(s => CatalogConverter.ToResponse(s, assigned))], result.Page, result.PageSize, result.TotalCount);
    }
}

public sealed class ListPublicServicesQuery(IServiceRepository services, IServiceProfessionalRepository links)
{
    public async Task<PagedResult<PublicServiceResponse>> ExecuteAsync(Guid businessId, PageRequest page, CancellationToken ct = default)
    {
        PagedResult<Service> result = await services.ListActiveOfBusinessAsync(businessId, page, ct);
        IReadOnlyList<ServiceProfessional> assigned = await links.ListForServicesAsync(businessId, [.. result.Items.Select(s => s.Id)], ct);

        return new PagedResult<PublicServiceResponse>(
            [.. result.Items.Select(s => CatalogConverter.ToPublic(s, assigned))], result.Page, result.PageSize, result.TotalCount);
    }
}
