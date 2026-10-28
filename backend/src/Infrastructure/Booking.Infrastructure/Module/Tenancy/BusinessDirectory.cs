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

    public async Task<BusinessContactInfo?> GetContactInfoAsync(Guid businessId, CancellationToken ct = default)
    {
        Business? business = await context.Set<Business>().AsNoTracking().FirstOrDefaultAsync(x => x.Id == businessId, ct);

        if (business is null)
        {
            return null;
        }

        string[] parts = [.. new[] { Join(business.Street, business.StreetNumber), business.District, Join(business.City, business.State, " - ") }
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .Select(p => p!)];

        bool confirmed = business.LocationConfirmedAt is not null && business.Location is not null;

        return new BusinessContactInfo(
            business.Id,
            business.Name,
            parts.Length == 0 ? null : string.Join(", ", parts),
            confirmed ? business.Location!.Latitude : null,
            confirmed ? business.Location!.Longitude : null,
            business.TimeZone,
            business.Category.RequiresSensitiveHandling());
    }

    public async Task<IReadOnlyList<Guid>> ListActiveOwnerUserIdsAsync(Guid businessId, CancellationToken ct = default) =>
        await context.OfBusiness<BusinessMembership>(businessId)
            .Where(x => x.Role == BusinessMembershipRole.Owner && x.Status == BusinessMembershipStatus.Active)
            .Select(x => x.UserId)
            .ToListAsync(ct);

    public Task<Guid?> FindActiveMembershipUserIdAsync(Guid businessId, Guid membershipId, CancellationToken ct = default) =>
        context.OfBusiness<BusinessMembership>(businessId)
            .Where(x => x.Id == membershipId && x.Status == BusinessMembershipStatus.Active)
            .Select(x => (Guid?)x.UserId)
            .FirstOrDefaultAsync(ct);

    private static string? Join(string? first, string? second, string separator = ", ") =>
        string.IsNullOrWhiteSpace(first) ? second : string.IsNullOrWhiteSpace(second) ? first : $"{first}{separator}{second}";

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
