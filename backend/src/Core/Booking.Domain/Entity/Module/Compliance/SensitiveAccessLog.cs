using Booking.Domain.Entity.Base;

namespace Booking.Domain.Entity.Module.Compliance;

/// <summary>Registro imutável de cada leitura de agendamento em categoria sensível.</summary>
public sealed class SensitiveAccessLog : BaseEntity, ITenantScoped
{
    public Guid BusinessId { get; private set; }
    public Guid ActorUserId { get; private set; }
    public Guid AppointmentId { get; private set; }
    public string Action { get; private set; } = null!;
    public DateTimeOffset OccurredAt { get; private set; }

    private SensitiveAccessLog()
    {
    }

    public static SensitiveAccessLog Record(Guid businessId, Guid actorUserId, Guid appointmentId, string action, DateTimeOffset now) =>
        new()
        {
            BusinessId = businessId,
            ActorUserId = actorUserId,
            AppointmentId = appointmentId,
            Action = action,
            OccurredAt = now,
        };
}
