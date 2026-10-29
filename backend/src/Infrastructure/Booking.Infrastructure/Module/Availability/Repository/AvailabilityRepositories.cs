using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Availability;
using Booking.Domain.Interface.Repository.Module.Availability;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Availability.Repository;

public sealed class WorkScheduleRepository(BookingDbContext context) : IWorkScheduleRepository
{
    public Task<WorkSchedule?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.Set<WorkSchedule>().FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<PagedResult<WorkSchedule>> ListForProfessionalAsync(Guid professionalId, PageRequest page, CancellationToken ct = default) =>
        context.Set<WorkSchedule>()
            .Where(x => x.ProfessionalId == professionalId)
            .OrderBy(x => x.DayOfWeek).ThenBy(x => x.StartTime)
            .ToPagedAsync(page, ct);

    public async Task<IReadOnlyList<WorkSchedule>> ListOfProfessionalAsync(Guid businessId, Guid professionalId, CancellationToken ct = default) =>
        await context.OfBusiness<WorkSchedule>(businessId).AsNoTracking().Where(x => x.ProfessionalId == professionalId).ToListAsync(ct);

    public Task<bool> AnyOfBusinessAsync(Guid businessId, CancellationToken ct = default) =>
        context.OfBusiness<WorkSchedule>(businessId).AnyAsync(ct);

    public void Add(WorkSchedule schedule) => context.Set<WorkSchedule>().Add(schedule);

    public void Remove(WorkSchedule schedule) => context.Set<WorkSchedule>().Remove(schedule);
}

public sealed class ScheduleExceptionRepository(BookingDbContext context) : IScheduleExceptionRepository
{
    public Task<ScheduleException?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.Set<ScheduleException>().FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<PagedResult<ScheduleException>> ListUpcomingAsync(DateTimeOffset fromUtc, PageRequest page, CancellationToken ct = default) =>
        context.Set<ScheduleException>().Where(x => x.EndsAt > fromUtc).OrderBy(x => x.StartsAt).ToPagedAsync(page, ct);

    public async Task<IReadOnlyList<ScheduleException>> ListOverlappingAsync(
        Guid businessId, Guid professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, CancellationToken ct = default) =>
        await context.OfBusiness<ScheduleException>(businessId).AsNoTracking()
            .Where(x => (x.ProfessionalId == null || x.ProfessionalId == professionalId) && x.StartsAt < toUtc && x.EndsAt > fromUtc)
            .ToListAsync(ct);

    public void Add(ScheduleException exception) => context.Set<ScheduleException>().Add(exception);

    public void Remove(ScheduleException exception) => context.Set<ScheduleException>().Remove(exception);
}
