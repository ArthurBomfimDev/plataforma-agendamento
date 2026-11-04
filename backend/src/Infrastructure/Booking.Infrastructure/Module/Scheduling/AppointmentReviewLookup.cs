using Booking.Application.Contracts.Scheduling;
using Booking.Domain.Entity.Module.Scheduling;
using Booking.Domain.Enum.Module.Scheduling;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Scheduling;

public sealed class AppointmentReviewLookup(BookingDbContext context) : IAppointmentReviewLookup
{
    // Entre estabelecimentos por natureza: o consumidor avalia sem contexto de tenant. A chave é o agendamento, e o
    // comando confere que ele é do consumidor.
    public Task<AppointmentForReview?> FindAsync(Guid appointmentId, CancellationToken ct = default) =>
        context.AcrossTenants<Appointment>().AsNoTracking()
            .Where(x => x.Id == appointmentId)
            .Select(x => new AppointmentForReview(
                x.Id,
                x.BusinessId,
                x.ProfessionalId,
                x.CustomerId,
                x.Status == AppointmentStatus.Completed,
                x.CompletedAt,
                x.ServiceNameSnapshot,
                x.IsSensitive))
            .FirstOrDefaultAsync(ct);
}
