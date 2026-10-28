using Booking.Application.Contracts.People;
using Booking.Domain.Entity.Module.People;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.People;

public sealed class PeopleDirectory(BookingDbContext context) : IPeopleDirectory
{
    public Task<ProfessionalInfo?> GetProfessionalAsync(Guid businessId, Guid professionalId, CancellationToken ct = default) =>
        context.OfBusiness<Professional>(businessId)
            .Where(x => x.Id == professionalId)
            .Select(x => new ProfessionalInfo(x.Id, x.BusinessId, x.DisplayName, x.IsActive, x.BusinessMembershipId))
            .FirstOrDefaultAsync(ct);

    public Task<int> CountActiveProfessionalsAsync(Guid businessId, CancellationToken ct = default) =>
        context.OfBusiness<Professional>(businessId).CountAsync(x => x.IsActive, ct);

    public Task<Guid?> FindProfessionalIdByMembershipAsync(Guid businessId, Guid membershipId, CancellationToken ct = default) =>
        context.OfBusiness<Professional>(businessId)
            .Where(x => x.BusinessMembershipId == membershipId)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(ct);

    public Task<Guid?> FindCustomerIdAsync(Guid userId, CancellationToken ct = default) =>
        context.Set<Customer>().Where(x => x.UserId == userId).Select(x => (Guid?)x.Id).FirstOrDefaultAsync(ct);

    public async Task<IReadOnlyList<CustomerIdentity>> GetCustomersAsync(IReadOnlyCollection<Guid> customerIds, CancellationToken ct = default) =>
        customerIds.Count == 0
            ? []
            : await context.Set<Customer>().AsNoTracking()
                .Where(x => customerIds.Contains(x.Id))
                .Select(x => new CustomerIdentity(x.Id, x.UserId, x.SocialName))
                .ToListAsync(ct);
}
