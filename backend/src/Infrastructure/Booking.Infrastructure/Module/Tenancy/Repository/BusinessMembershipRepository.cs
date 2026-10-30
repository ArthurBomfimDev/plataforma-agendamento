using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Tenancy.Repository;

public sealed class BusinessMembershipRepository(BookingDbContext context) : IBusinessMembershipRepository
{
    public Task<BusinessMembership?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.Set<BusinessMembership>().FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<BusinessMembership?> GetByBusinessAndUserAsync(Guid businessId, Guid userId, CancellationToken ct = default) =>
        context.Set<BusinessMembership>().FirstOrDefaultAsync(x => x.BusinessId == businessId && x.UserId == userId, ct);

    public void Add(BusinessMembership membership) => context.Set<BusinessMembership>().Add(membership);
}
