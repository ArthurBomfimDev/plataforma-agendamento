using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Scheduling;
using Booking.Domain.Enum.Module.Scheduling;
using Booking.Domain.Interface.Repository.Module.Scheduling;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Scheduling.Repository;

public sealed class AppointmentRepository(BookingDbContext context) : IAppointmentRepository
{
    public Task<Appointment?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.Set<Appointment>().FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<Appointment?> GetForCustomerAsync(Guid id, Guid customerId, CancellationToken ct = default) =>
        context.AcrossTenants<Appointment>().FirstOrDefaultAsync(x => x.Id == id && x.CustomerId == customerId, ct);

    public Task<Appointment?> FindByIdempotencyKeyAsync(Guid customerId, string idempotencyKey, CancellationToken ct = default) =>
        context.AcrossTenants<Appointment>().AsNoTracking()
            .FirstOrDefaultAsync(x => x.CustomerId == customerId && x.IdempotencyKey == idempotencyKey, ct);

    public Task<PagedResult<Appointment>> ListInRangeAsync(
        DateTimeOffset fromUtc, DateTimeOffset toUtc, Guid? professionalId, PageRequest page, CancellationToken ct = default) =>
        context.Set<Appointment>().AsNoTracking()
            .Where(x => x.StartsAt < toUtc && x.EndsAt > fromUtc)
            .Where(x => professionalId == null || x.ProfessionalId == professionalId)
            .OrderBy(x => x.StartsAt)
            .ToPagedAsync(page, ct);

    public Task<PagedResult<Appointment>> ListActiveInRangeAsync(
        Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, PageRequest page, CancellationToken ct = default) =>
        ActiveInRange(professionalId, fromUtc, toUtc).AsNoTracking().ToPagedAsync(page, ct);

    public async Task<IReadOnlyList<Appointment>> ListActiveInRangeForUpdateAsync(
        Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, int limit, CancellationToken ct = default) =>
        await ActiveInRange(professionalId, fromUtc, toUtc).Take(limit).ToListAsync(ct);

    // Filtro de tenant ligado: só o estabelecimento do token.
    private IQueryable<Appointment> ActiveInRange(Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc) =>
        context.Set<Appointment>()
            .Where(x => x.Status == AppointmentStatus.Pending || x.Status == AppointmentStatus.Confirmed)
            .Where(x => x.StartsAt < toUtc && x.EndsAt > fromUtc)
            .Where(x => professionalId == null || x.ProfessionalId == professionalId)
            .OrderBy(x => x.StartsAt);

    public Task<PagedResult<Appointment>> ListPendingAsync(Guid? professionalId, PageRequest page, CancellationToken ct = default) =>
        context.Set<Appointment>().AsNoTracking()
            .Where(x => x.Status == AppointmentStatus.Pending)
            .Where(x => professionalId == null || x.ProfessionalId == professionalId)
            .OrderBy(x => x.ExpiresAt)
            .ToPagedAsync(page, ct);

    public Task<PagedResult<Appointment>> ListForCustomerAsync(Guid customerId, PageRequest page, CancellationToken ct = default) =>
        context.AcrossTenants<Appointment>().AsNoTracking()
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.StartsAt)
            .ToPagedAsync(page, ct);

    public async Task<IReadOnlyList<Appointment>> ListExpiredPendingAsync(DateTimeOffset now, int limit, CancellationToken ct = default) =>
        await context.AcrossTenants<Appointment>()
            .Where(x => x.Status == AppointmentStatus.Pending && x.ExpiresAt <= now)
            .OrderBy(x => x.ExpiresAt)
            .Take(limit)
            .ToListAsync(ct);

    public void Add(Appointment appointment) => context.Set<Appointment>().Add(appointment);

    public void Discard(Appointment appointment)
    {
        // Cópia: desanexar um evento o tira da coleção do agregado no meio da iteração.
        foreach (AppointmentEvent change in appointment.History.ToList())
        {
            context.Entry(change).State = EntityState.Detached;
        }

        context.Entry(appointment).State = EntityState.Detached;
    }
}
