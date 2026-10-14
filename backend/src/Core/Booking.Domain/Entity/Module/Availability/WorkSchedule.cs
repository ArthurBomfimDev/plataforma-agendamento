using Booking.Domain.Entity.Base;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.Availability;

/// <summary>
/// Jornada semanal recorrente, no horário local do estabelecimento. Duas linhas no mesmo dia representam
/// a pausa: 09:00–12:00 e 13:00–18:00. Não existe campo de pausa — a ausência de linha é a pausa.
/// </summary>
public sealed class WorkSchedule : BaseEntity, IAuditable, ITenantScoped
{
    public Guid BusinessId { get; private set; }
    public Guid ProfessionalId { get; private set; }
    public DayOfWeek DayOfWeek { get; private set; }
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    public DateOnly EffectiveFrom { get; private set; }
    public DateOnly? EffectiveTo { get; private set; }

    private WorkSchedule()
    {
    }

    public static WorkSchedule Create(
        Guid businessId, Guid professionalId, DayOfWeek dayOfWeek, TimeOnly start, TimeOnly end, DateOnly effectiveFrom, DateOnly? effectiveTo)
    {
        if (end <= start)
        {
            throw new DomainException("work_schedule.end_before_start");
        }

        if (effectiveTo is DateOnly to && to < effectiveFrom)
        {
            throw new DomainException("work_schedule.effective_range_invalid");
        }

        return new WorkSchedule
        {
            BusinessId = businessId,
            ProfessionalId = professionalId,
            DayOfWeek = dayOfWeek,
            StartTime = start,
            EndTime = end,
            EffectiveFrom = effectiveFrom,
            EffectiveTo = effectiveTo,
        };
    }

    public bool AppliesOn(DateOnly date) =>
        date.DayOfWeek == DayOfWeek && date >= EffectiveFrom && (EffectiveTo is null || date <= EffectiveTo);

    /// <summary>Invariante: duas linhas do mesmo profissional, no mesmo dia, com vigências que se cruzam, não se sobrepõem.</summary>
    public bool ConflictsWith(WorkSchedule other) =>
        other.Id != Id
        && other.ProfessionalId == ProfessionalId
        && other.DayOfWeek == DayOfWeek
        && StartTime < other.EndTime && other.StartTime < EndTime
        && EffectiveFrom <= (other.EffectiveTo ?? DateOnly.MaxValue)
        && other.EffectiveFrom <= (EffectiveTo ?? DateOnly.MaxValue);
}
