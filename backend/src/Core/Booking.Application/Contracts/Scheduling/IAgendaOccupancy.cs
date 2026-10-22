namespace Booking.Application.Contracts.Scheduling;

/// <summary>Intervalo bloqueado por um agendamento: horário do atendimento mais os buffers, em UTC.</summary>
public sealed record BlockedRange(DateTimeOffset Start, DateTimeOffset End);

/// <summary>Superfície pública do módulo Scheduling.</summary>
public interface IAgendaOccupancy
{
    /// <summary>Intervalos ocupados pelos estados que ocupam horário (Pending, Confirmed, Completed, NoShow).</summary>
    Task<IReadOnlyList<BlockedRange>> GetBlockedRangesAsync(
        Guid businessId, Guid professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, CancellationToken ct = default);
}
