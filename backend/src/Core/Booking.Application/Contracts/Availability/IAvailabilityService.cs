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

/// <summary>Por que um horário não está livre. <see cref="Busy"/> é o único que significa "outro agendamento já o ocupa".</summary>
public enum SlotRejection
{
    None,
    NotOnGrid,
    HolidayClosed,
    OutsideWorkHours,
    ProfessionalUnavailable,
    BeyondHorizon,
    LeadTime,
    Busy,
}

/// <summary>Os horários livres do dia e, para o início pedido, o motivo de ele não estar entre eles.</summary>
public sealed record SlotCheck(IReadOnlyList<DateTimeOffset> Slots, SlotRejection Rejection);

/// <summary>Superfície pública do módulo Availability.</summary>
public interface IAvailabilityService
{
    /// <summary>Inícios de atendimento livres no dia, em UTC.</summary>
    Task<IReadOnlyList<DateTimeOffset>> GetSlotStartsAsync(SlotQuery query, CancellationToken ct = default);

    /// <summary>Os mesmos horários livres, mais o motivo de <paramref name="startsAt"/> não estar entre eles (<see cref="SlotRejection.None"/> se está).</summary>
    Task<SlotCheck> CheckAsync(SlotQuery query, DateTimeOffset startsAt, CancellationToken ct = default);

    Task<bool> HasWorkScheduleAsync(Guid businessId, CancellationToken ct = default);
}
