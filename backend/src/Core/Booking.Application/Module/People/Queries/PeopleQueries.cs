using Booking.Application.Common.Tenancy;
using Booking.Application.Module.People.Converter;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.People;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.People;

namespace Booking.Application.Module.People.Queries;

public sealed class ListProfessionalsQuery(IProfessionalRepository professionals, IActorContext actor)
{
    public async Task<PagedResult<ProfessionalResponse>> ExecuteAsync(PageRequest page, CancellationToken ct = default)
    {
        actor.RequireBusinessId();

        PagedResult<Professional> result = await professionals.ListAsync(page, ct);
        return new PagedResult<ProfessionalResponse>([.. result.Items.Select(PeopleConverter.ToResponse)], result.Page, result.PageSize, result.TotalCount);
    }
}

public sealed class ListPublicProfessionalsQuery(IProfessionalRepository professionals)
{
    public async Task<PagedResult<PublicProfessionalResponse>> ExecuteAsync(Guid businessId, PageRequest page, CancellationToken ct = default)
    {
        PagedResult<Professional> result = await professionals.ListActiveOfBusinessAsync(businessId, page, ct);
        return new PagedResult<PublicProfessionalResponse>([.. result.Items.Select(PeopleConverter.ToPublic)], result.Page, result.PageSize, result.TotalCount);
    }
}

public sealed class GetMyCustomerProfileQuery(ICustomerRepository customers, IActorContext actor)
{
    public async Task<CustomerResponse> ExecuteAsync(CancellationToken ct = default)
    {
        Customer customer = await customers.GetByUserIdAsync(actor.RequireUserId(), ct)
            ?? throw new DomainException("customer.not_found");

        return PeopleConverter.ToResponse(customer);
    }
}
