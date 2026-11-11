namespace Booking.Domain.DomainService.Module.Availability;

/// <summary>O motivo de um horário não estar disponível. <see cref="Busy"/> é o único que significa "alguém já tem este horário".</summary>
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
