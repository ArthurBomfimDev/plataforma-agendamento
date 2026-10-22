using Booking.Domain.Entity.Module.Availability;
using Booking.Domain.Enum.Module.Availability;
using Booking.Domain.ValueObject;

namespace Booking.Domain.DomainService.Module.Availability;

public sealed record AvailabilityRequest(
    Guid ProfessionalId,
    DateOnly Date,
    TimeZoneInfo TimeZone,
    IReadOnlyCollection<WorkSchedule> Schedules,
    IReadOnlyCollection<ScheduleException> Exceptions,
    IReadOnlyCollection<TimeRange> Occupied,
    int DurationMinutes,
    int BufferBeforeMinutes,
    int BufferAfterMinutes,
    int SlotStepMinutes,
    DateTimeOffset Now,
    int MinLeadTimeHours,
    int BookingHorizonDays,
    bool IgnoreLeadTime = false);

/// <summary>
/// O horário livre não é dado, é cálculo (ADR-006). Puro e determinístico: sem banco, sem relógio —
/// o instante atual entra como parâmetro. É a peça mais crítica do sistema, e a mais testável.
/// </summary>
/// <remarks>
/// Ordem: jornada do dia → feriado zera a jornada → turno extra soma → folga, férias e bloqueio subtraem →
/// agendamentos que ocupam subtraem → recorte em passos da granularidade → descarta o que não cabe
/// (buffer antes + duração + buffer depois) → descarta antecedência mínima e horizonte.
/// </remarks>
public static class AvailabilityCalculator
{
    private const int _minutesPerDay = 24 * 60;

    public static IReadOnlyList<DateTimeOffset> Calculate(AvailabilityRequest r)
    {
        List<TimeRange> free = OpenRanges(r);

        foreach (ScheduleException exception in r.Exceptions.Where(e => e.Kind != ScheduleExceptionKind.ExtraShift && e.AppliesTo(r.ProfessionalId)))
        {
            free = Subtract(free, exception.Period);
        }

        foreach (TimeRange occupied in r.Occupied)
        {
            free = Subtract(free, occupied);
        }

        DateTimeOffset earliest = r.IgnoreLeadTime ? r.Now : r.Now.AddHours(r.MinLeadTimeHours);
        DateTimeOffset latest = r.Now.AddDays(r.BookingHorizonDays);
        List<DateTimeOffset> slots = [];

        for (int minute = 0; minute < _minutesPerDay; minute += r.SlotStepMinutes)
        {
            DateTimeOffset? start = ToUtc(r.Date, TimeOnly.MinValue.AddMinutes(minute), r.TimeZone);

            if (start is not DateTimeOffset s || s < earliest || s > latest)
            {
                continue;
            }

            TimeRange blocked = TimeRange.Of(
                s.AddMinutes(-r.BufferBeforeMinutes),
                s.AddMinutes(r.DurationMinutes + r.BufferAfterMinutes));

            if (free.Any(range => range.Contains(blocked)))
            {
                slots.Add(s);
            }
        }

        return slots;
    }

    private static List<TimeRange> OpenRanges(AvailabilityRequest r)
    {
        List<TimeRange> open = [];

        // Feriado: o padrão é fechado. O estabelecimento abre lançando um turno extra no dia.
        if (!BrazilianHolidays.IsHoliday(r.Date))
        {
            foreach (WorkSchedule schedule in r.Schedules.Where(s => s.ProfessionalId == r.ProfessionalId && s.AppliesOn(r.Date)))
            {
                if (ToUtc(r.Date, schedule.StartTime, r.TimeZone) is DateTimeOffset start
                    && ToUtc(r.Date, schedule.EndTime, r.TimeZone) is DateTimeOffset end
                    && end > start)
                {
                    open.Add(TimeRange.Of(start, end));
                }
            }
        }

        foreach (ScheduleException extra in r.Exceptions.Where(e => e.Kind == ScheduleExceptionKind.ExtraShift && e.AppliesTo(r.ProfessionalId)))
        {
            open.Add(extra.Period);
        }

        return Merge(open);
    }

    private static List<TimeRange> Merge(List<TimeRange> ranges)
    {
        List<TimeRange> merged = [];

        foreach (TimeRange range in ranges.OrderBy(x => x.Start))
        {
            if (merged.Count > 0 && merged[^1].End >= range.Start)
            {
                TimeRange last = merged[^1];
                merged[^1] = TimeRange.Of(last.Start, range.End > last.End ? range.End : last.End);
            }
            else
            {
                merged.Add(range);
            }
        }

        return merged;
    }

    private static List<TimeRange> Subtract(List<TimeRange> ranges, TimeRange cut)
    {
        List<TimeRange> result = [];

        foreach (TimeRange range in ranges)
        {
            if (!range.Overlaps(cut))
            {
                result.Add(range);
                continue;
            }

            if (range.Start < cut.Start)
            {
                result.Add(TimeRange.Of(range.Start, cut.Start));
            }

            if (cut.End < range.End)
            {
                result.Add(TimeRange.Of(cut.End, range.End));
            }
        }

        return result;
    }

    // Hora local inexistente (salto de horário de verão) não vira horário: devolve nulo e é descartada.
    private static DateTimeOffset? ToUtc(DateOnly date, TimeOnly time, TimeZoneInfo zone)
    {
        DateTime local = DateTime.SpecifyKind(date.ToDateTime(time), DateTimeKind.Unspecified);

        if (zone.IsInvalidTime(local))
        {
            return null;
        }

        return new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(local, zone), TimeSpan.Zero);
    }
}
