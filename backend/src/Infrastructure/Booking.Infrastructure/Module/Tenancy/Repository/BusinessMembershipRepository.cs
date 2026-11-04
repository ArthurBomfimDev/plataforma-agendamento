using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Tenancy.Repository;

public sealed class BusinessMembershipRepository(BookingDbContext context) : IBusinessMembershipRepository
{
    public Task<BusinessMembership?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.Set<BusinessMembership>().FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<BusinessMembership?> GetByBusinessAndUserAsync(Guid businessId, Guid userId, CancellationToken ct = default) =>
        context.OfBusiness<BusinessMembership>(businessId).FirstOrDefaultAsync(x => x.UserId == userId, ct);

    // Entre estabelecimentos por natureza: o limite é da conta, não de um tenant. Filtra pelo usuário.
    public Task<int> CountOwnedByUserAsync(Guid userId, CancellationToken ct = default) =>
        context.AcrossTenants<BusinessMembership>()
            .CountAsync(x => x.UserId == userId && x.Role == BusinessMembershipRole.Owner && x.Status != BusinessMembershipStatus.Removed, ct);

    // Do estabelecimento do token (filtro global): vagas são por estabelecimento.
    public Task<int> CountSeatsAsync(CancellationToken ct = default) =>
        context.Set<BusinessMembership>()
            .CountAsync(x => x.Status == BusinessMembershipStatus.Active || x.Status == BusinessMembershipStatus.Invited, ct);

    public void Add(BusinessMembership membership) => context.Set<BusinessMembership>().Add(membership);
}
