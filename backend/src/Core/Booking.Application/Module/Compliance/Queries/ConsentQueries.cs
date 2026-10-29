using Booking.Application.Common.Tenancy;
using Booking.Application.Module.Compliance.Commands;
using Booking.Application.Module.Compliance.Integration;
using Booking.Arguments.Module.Compliance;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Compliance;
using Booking.Domain.Interface.Repository.Module.Compliance;

namespace Booking.Application.Module.Compliance.Queries;

public sealed class ListMyConsentsQuery(IConsentRecordRepository consents, IActorContext actor)
{
    public async Task<PagedResult<ConsentResponse>> ExecuteAsync(PageRequest page, CancellationToken ct = default)
    {
        PagedResult<ConsentRecord> result = await consents.ListForUserAsync(actor.RequireUserId(), page, ct);
        return new PagedResult<ConsentResponse>([.. result.Items.Select(GrantConsentCommand.ToResponse)], result.Page, result.PageSize, result.TotalCount);
    }
}

public sealed class GetConsentVersionsQuery
{
    public ConsentVersionsResponse Execute() => new(ConsentTexts.SensitiveSchedulingVersion);
}
