using Booking.Application.Contracts.Notifications;
using Booking.Arguments.Module.Scheduling;
using Booking.Domain.Entity.Module.Scheduling;

namespace Booking.Application.Module.Scheduling.Converter;

/// <summary>
/// Conversão manual (ADR-010, decisão 6). Mapeador por reflexão poderia recalcular o preço congelado a
/// partir do serviço atual sem que nenhum teste percebesse.
/// </summary>
public static class AppointmentConverter
{
    /// <summary>O agendamento para o Notifications, sem expor a entidade a outro módulo (ADR-010, decisão 1).</summary>
    public static AppointmentFacts ToFacts(Appointment a) =>
        new(
            a.Id,
            a.BusinessId,
            a.ProfessionalId,
            a.CustomerId,
            a.ServiceNameSnapshot,
            a.StartsAt,
            a.EndsAt,
            a.Status.ToString(),
            a.IsSensitive,
            a.WalkInName,
            a.CancellationReason);

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
