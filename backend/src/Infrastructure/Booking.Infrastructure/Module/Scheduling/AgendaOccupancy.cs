using Booking.Application.Contracts.Scheduling;
using Booking.Domain.Entity.Module.Scheduling;
using Booking.Domain.Enum.Module.Scheduling;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Scheduling;

public sealed class AgendaOccupancy(BookingDbContext context) : IAgendaOccupancy
{
    private static readonly AppointmentStatus[] _occupying =
        [AppointmentStatus.Pending, AppointmentStatus.Confirmed, AppointmentStatus.Completed, AppointmentStatus.NoShow];

    public async Task<IReadOnlyList<BlockedRange>> GetBlockedRangesAsync(
        Guid businessId, Guid professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, CancellationToken ct = default)
    {
        var rows = await context.OfBusiness<Appointment>(businessId)
            .Where(x => x.ProfessionalId == professionalId && _occupying.Contains(x.Status))
            .Where(x => x.BlockedStartsAt < toUtc && x.BlockedEndsAt > fromUtc)
            .Select(x => new { x.BlockedStartsAt, x.BlockedEndsAt })
            .ToListAsync(ct);

        return [.. rows.Select(r => new BlockedRange(r.BlockedStartsAt, r.BlockedEndsAt))];
    }
}
