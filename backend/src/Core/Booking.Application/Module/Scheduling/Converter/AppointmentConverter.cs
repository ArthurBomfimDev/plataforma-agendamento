using Booking.Arguments.Module.Scheduling;
using Booking.Domain.Entity.Module.Scheduling;

namespace Booking.Application.Module.Scheduling.Converter;

/// <summary>
/// Conversão manual (ADR-010, decisão 6). Mapeador por reflexão poderia recalcular o preço congelado a
/// partir do serviço atual sem que nenhum teste percebesse.
/// </summary>
public static class AppointmentConverter
{
    /// <param name="customerName">Só no lado do estabelecimento (<see cref="Commands.CustomerNameResolver"/>); nulo para o consumidor.</param>
    public static AppointmentResponse ToResponse(Appointment a, string? customerName = null) =>
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
            a.CancelledBy?.ToString(),
            a.RequestedAt,
            customerName);
}
