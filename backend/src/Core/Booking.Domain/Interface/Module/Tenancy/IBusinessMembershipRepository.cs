using Booking.Domain.Entity.Module.Tenancy;

namespace Booking.Domain.Interface.Repository.Module.Tenancy;

public interface IBusinessMembershipRepository
{
    Task<BusinessMembership?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<BusinessMembership?> GetByBusinessAndUserAsync(Guid businessId, Guid userId, CancellationToken ct = default);
    void Add(BusinessMembership membership);
}
