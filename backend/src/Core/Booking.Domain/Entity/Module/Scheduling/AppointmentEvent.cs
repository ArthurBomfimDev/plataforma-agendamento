using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.Scheduling;

namespace Booking.Domain.Entity.Module.Scheduling;

/// <summary>Trilha imutável de cada transição: quem mudou, de onde para onde e quando.</summary>
public sealed class AppointmentEvent : BaseEntity, ITenantScoped
{
    public Guid BusinessId { get; private set; }
    public Guid AppointmentId { get; private set; }
    public AppointmentStatus? FromStatus { get; private set; }
    public AppointmentStatus ToStatus { get; private set; }
    public Guid? ActorUserId { get; private set; }
    public string ActorRole { get; private set; } = null!;
    public DateTimeOffset OccurredAt { get; private set; }
    public string? Note { get; private set; }

    private AppointmentEvent()
    {
    }

    internal static AppointmentEvent Record(
        Guid businessId, Guid appointmentId, AppointmentStatus? from, AppointmentStatus to, SchedulingActor actor, DateTimeOffset now, string? note) =>
        new()
        {
            BusinessId = businessId,
            AppointmentId = appointmentId,
            FromStatus = from,
            ToStatus = to,
            ActorUserId = actor.UserId,
            ActorRole = actor.Role,
            OccurredAt = now,
            Note = note,
        };
}

/// <summary>Quem age sobre o agendamento. <c>Role</c>: Customer, Owner, Professional ou System.</summary>
public sealed record SchedulingActor(Guid? UserId, string Role)
{
    public static readonly SchedulingActor System = new(null, "System");
}
