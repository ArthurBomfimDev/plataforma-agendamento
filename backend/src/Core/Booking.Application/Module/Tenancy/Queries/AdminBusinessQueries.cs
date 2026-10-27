using Booking.Application.Common.Tenancy;
using Booking.Application.Module.Tenancy.Commands;
using Booking.Application.Module.Tenancy.Converter;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Tenancy;

namespace Booking.Application.Module.Tenancy.Queries;

/// <summary>Fila do Admin (ADR-020): por estado, <c>PendingReview</c> por padrão.</summary>
public sealed class ListBusinessesForAdminQuery(IBusinessRepository businesses, IActorContext actor)
{
    public async Task<PagedResult<BusinessResponse>> ExecuteAsync(string? status, PageRequest page, CancellationToken ct = default)
    {
        actor.RequirePlatformAdmin();

        BusinessStatus filter = BusinessStatus.PendingReview;
        if (!string.IsNullOrWhiteSpace(status) && !System.Enum.TryParse(status, ignoreCase: true, out filter))
        {
            throw new DomainException("business.status_invalid");
        }

        PagedResult<Business> result = await businesses.ListByStatusAsync(filter, page, ct);

        return new PagedResult<BusinessResponse>(
            [.. result.Items.Select(BusinessConverter.ToResponse)], result.Page, result.PageSize, result.TotalCount);
    }
}

public sealed class GetBusinessForAdminQuery(IBusinessRepository businesses, ActivationChecklist checklist, IActorContext actor)
{
    public async Task<AdminBusinessDetailResponse> ExecuteAsync(Guid businessId, CancellationToken ct = default)
    {
        actor.RequirePlatformAdmin();

        Business business = await businesses.GetByIdAsync(businessId, ct)
            ?? throw new DomainException("business.not_found");

        return BusinessConverter.ToAdminDetail(business, await checklist.EvaluateAsync(business, ct));
    }
}
