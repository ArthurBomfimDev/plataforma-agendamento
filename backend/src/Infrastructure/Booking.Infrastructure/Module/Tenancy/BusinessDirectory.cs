using Booking.Application.Contracts.Tenancy;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Tenancy;

public sealed class BusinessDirectory(BookingDbContext context) : IBusinessDirectory
{
    // Troca de contexto: o token ainda não tem tenant, então a busca é explícita por estabelecimento e usuário.
    public async Task<BusinessMembershipInfo?> FindActiveMembershipAsync(Guid businessId, Guid userId, CancellationToken ct = default) =>
        await context.OfBusiness<BusinessMembership>(businessId)
            .Where(x => x.UserId == userId && x.Status == BusinessMembershipStatus.Active)
            .Select(x => new BusinessMembershipInfo(x.Id, x.BusinessId, x.UserId, x.Role.ToString()))
            .FirstOrDefaultAsync(ct);

    public async Task<BusinessSchedulingInfo?> GetSchedulingInfoAsync(Guid businessId, CancellationToken ct = default)
    {
        Business? business = await context.Set<Business>().AsNoTracking().FirstOrDefaultAsync(x => x.Id == businessId, ct);

        return business is null
            ? null
            : new BusinessSchedulingInfo(
                business.Id,
                business.TimeZone,
                business.IsBookable,
                business.Category.RequiresSensitiveHandling(),
                business.AutoConfirm,
                business.PendingExpirationHours,
                business.MinLeadTimeHours,
                business.BookingHorizonDays,
                business.CancellationWindowHours);
    }
}
