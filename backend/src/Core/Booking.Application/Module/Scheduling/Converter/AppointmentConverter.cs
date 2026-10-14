using Booking.Arguments.Module.Scheduling;
using Booking.Domain.Entity.Module.Scheduling;

namespace Booking.Application.Module.Scheduling.Converter;

/// <summary>
/// Conversão manual (ADR-010, decisão 6). Mapeador por reflexão poderia recalcular o preço congelado a
/// partir do serviço atual sem que nenhum teste percebesse.
/// </summary>
public static class AppointmentConverter
{
    public static AppointmentResponse ToResponse(Appointment a) =>
        new(
            a.Id,
            a.BusinessId,
            a.ProfessionalId,
            a.ServiceId,
            a.ServiceNameSnapshot,
            a.DurationMinutes,
            a.PriceCents,
            a.StartsAt,
            a.EndsAt,
            a.Status.ToString(),
            a.Source.ToString(),
            a.ExpiresAt,
            a.WalkInName,
            a.CustomerNotes,
            a.CancellationReason,
            a.CancelledBy?.ToString());
}
