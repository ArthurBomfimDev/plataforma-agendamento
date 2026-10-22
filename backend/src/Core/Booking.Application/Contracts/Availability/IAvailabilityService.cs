namespace Booking.Application.Contracts.Availability;

public sealed record SlotQuery(
    Guid BusinessId,
    Guid ProfessionalId,
    DateOnly Date,
    int DurationMinutes,
    int BufferBeforeMinutes,
    int BufferAfterMinutes,
    int SlotStepMinutes,
    bool IgnoreLeadTime = false);

/// <summary>Superfície pública do módulo Availability.</summary>
public interface IAvailabilityService
{
    /// <summary>Inícios de atendimento livres no dia, em UTC.</summary>
    Task<IReadOnlyList<DateTimeOffset>> GetSlotStartsAsync(SlotQuery query, CancellationToken ct = default);

    Task<bool> HasWorkScheduleAsync(Guid businessId, CancellationToken ct = default);
}
