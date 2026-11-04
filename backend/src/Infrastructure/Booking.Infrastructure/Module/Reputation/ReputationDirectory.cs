using Booking.Application.Contracts.Reputation;
using Booking.Domain.Entity.Module.Reputation;
using Booking.Domain.Enum.Module.Reputation;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Reputation;

public sealed class ReputationDirectory(BookingDbContext context) : IReputationDirectory
{
    public async Task<IReadOnlyDictionary<Guid, RatingInfo>> GetBusinessRatingsAsync(IReadOnlyCollection<Guid> businessIds, CancellationToken ct = default)
    {
        if (businessIds.Count == 0)
        {
            return new Dictionary<Guid, RatingInfo>();
        }

        // Só o que importa para exibir: count e sum. A média é decidida pela entidade, que conhece o mínimo de três.
        List<RatingSummary> summaries = await context.AcrossTenants<RatingSummary>().AsNoTracking()
            .Where(x => x.Target == RatingTarget.Business && businessIds.Contains(x.TargetId))
            .ToListAsync(ct);

        return summaries.ToDictionary(s => s.TargetId, s => new RatingInfo(s.Average, s.Count));
    }
}
