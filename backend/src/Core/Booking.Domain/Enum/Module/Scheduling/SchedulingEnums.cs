namespace Booking.Domain.Enum.Module.Scheduling;

/// <summary>
/// ⚠️ Os nomes aparecem no <c>WHERE</c> da constraint de exclusão (migration AddCoreModules). Renomear um
/// estado sem migration correspondente desliga a trava contra dupla reserva em silêncio.
/// </summary>
public enum AppointmentStatus
{
    Pending,
    Confirmed,
    Rejected,
    Expired,
    Cancelled,
    Completed,
    NoShow,
}

public enum AppointmentSource
{
    Online,
    Counter,
}

public enum CancellationParty
{
    Customer,
    Business,
    System,
}
