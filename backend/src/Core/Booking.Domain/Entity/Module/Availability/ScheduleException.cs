using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.Availability;
using Booking.Domain.Exceptions;
using Booking.Domain.ValueObject;

namespace Booking.Domain.Entity.Module.Availability;

/// <summary>Folga, férias, bloqueio ou turno extra. Sem profissional, vale para o estabelecimento inteiro.</summary>
public sealed class ScheduleException : BaseEntity, IAuditable, ITenantScoped
{
    public Guid BusinessId { get; private set; }
    public Guid? ProfessionalId { get; private set; }
    public ScheduleExceptionKind Kind { get; private set; }
    public DateTimeOffset StartsAt { get; private set; }
    public DateTimeOffset EndsAt { get; private set; }
    public string? Reason { get; private set; }

    private ScheduleException()
    {
    }

    public static ScheduleException Create(
        Guid businessId, Guid? professionalId, ScheduleExceptionKind kind, TimeRange period, string? reason)
    {
        if (kind == ScheduleExceptionKind.ExtraShift && professionalId is null)
        {
            throw new DomainException("schedule_exception.extra_shift_requires_professional");
        }

        return new ScheduleException
        {
            BusinessId = businessId,
            ProfessionalId = professionalId,
            Kind = kind,
            StartsAt = period.Start,
            EndsAt = period.End,
            Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim(),
        };
    }

    public TimeRange Period => TimeRange.Of(StartsAt, EndsAt);

    public bool AppliesTo(Guid professionalId) => ProfessionalId is null || ProfessionalId == professionalId;
}
