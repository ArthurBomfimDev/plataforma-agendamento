using Booking.Domain.DomainService.Module.Availability;
using Booking.Domain.Entity.Module.Availability;
using Booking.Domain.Enum.Module.Availability;
using Booking.Domain.ValueObject;

namespace Booking.UnitTests.Availability;

/// <summary>
/// Segunda-feira, 19/10/2026, em America/Sao_Paulo (UTC−3, sem horário de verão). Jornada 09–12 e 13–18:
/// a ausência de linha entre 12 e 13 é a pausa.
/// </summary>
public sealed class AvailabilityCalculatorTests
{
    private static readonly TimeZoneInfo _zone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
    private static readonly Guid _business = Guid.CreateVersion7();
    private static readonly Guid _professional = Guid.CreateVersion7();
    private static readonly DateOnly _monday = new(2026, 10, 19);
    private static readonly DateTimeOffset _dayBefore = new(2026, 10, 18, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Splits_the_working_day_in_steps_and_respects_the_lunch_gap()
    {
        IReadOnlyList<DateTimeOffset> slots = Calculate();

        Assert.Equal(16, slots.Count);
        Assert.Equal(Local(9, 0), slots[0]);
        Assert.Equal(Local(17, 30), slots[^1]);
        Assert.DoesNotContain(Local(12, 0), slots);
        Assert.DoesNotContain(Local(12, 30), slots);
    }

    [Fact]
    public void Occupied_range_removes_the_slot_but_adjacency_is_not_conflict()
    {
        IReadOnlyList<DateTimeOffset> slots = Calculate(occupied: [TimeRange.Of(Local(10, 0), Local(10, 30))]);

        Assert.DoesNotContain(Local(10, 0), slots);
        Assert.Contains(Local(9, 30), slots);
        Assert.Contains(Local(10, 30), slots);
        Assert.Equal(15, slots.Count);
    }

    [Fact]
    public void Buffers_count_as_occupation_and_must_fit_inside_the_shift()
    {
        IReadOnlyList<DateTimeOffset> slots = Calculate(step: 15, bufferAfter: 15);

        Assert.Contains(Local(11, 15), slots);      // 11:15–11:45 + 15 min = 12:00
        Assert.DoesNotContain(Local(11, 30), slots); // terminaria 12:15, dentro da pausa
    }

    [Fact]
    public void National_holiday_closes_the_day_unless_there_is_an_extra_shift()
    {
        DateOnly finados = new(2026, 11, 2);

        Assert.Empty(Calculate(date: finados));

        ScheduleException extra = ScheduleException.Create(
            _business, _professional, ScheduleExceptionKind.ExtraShift, TimeRange.Of(Local(finados, 9, 0), Local(finados, 12, 0)), "abre no feriado");

        IReadOnlyList<DateTimeOffset> slots = Calculate(date: finados, exceptions: [extra]);

        Assert.Equal(6, slots.Count);
        Assert.Equal(Local(finados, 9, 0), slots[0]);
    }

    [Fact]
    public void Business_wide_block_applies_to_every_professional()
    {
        ScheduleException block = ScheduleException.Create(
            _business, professionalId: null, ScheduleExceptionKind.Block, TimeRange.Of(Local(13, 0), Local(18, 0)), "reforma");

        IReadOnlyList<DateTimeOffset> slots = Calculate(exceptions: [block]);

        Assert.Equal(6, slots.Count);
        Assert.All(slots, s => Assert.True(s < Local(12, 0)));
    }

    [Fact]
    public void Minimum_lead_time_hides_slots_too_close_to_now()
    {
        DateTimeOffset nineThirty = Local(9, 30);

        IReadOnlyList<DateTimeOffset> slots = Calculate(now: nineThirty);

        Assert.Equal(Local(11, 30), slots[0]);
    }

    [Fact]
    public void Counter_booking_ignores_lead_time_but_never_offers_the_past()
    {
        IReadOnlyList<DateTimeOffset> slots = Calculate(now: Local(9, 30), ignoreLeadTime: true);

        Assert.Equal(Local(9, 30), slots[0]);
    }

    [Fact]
    public void Dates_beyond_the_booking_horizon_have_no_slots()
    {
        Assert.Empty(Calculate(date: _monday.AddDays(63), horizonDays: 60));
    }

    [Fact]
    public void Schedules_of_other_professionals_are_ignored()
    {
        WorkSchedule someoneElse = WorkSchedule.Create(_business, Guid.CreateVersion7(), DayOfWeek.Monday, new(7, 0), new(9, 0), new(2026, 1, 1), null);

        IReadOnlyList<DateTimeOffset> slots = Calculate(extraSchedules: [someoneElse]);

        Assert.DoesNotContain(Local(7, 0), slots);
    }

    private static IReadOnlyList<DateTimeOffset> Calculate(
        DateOnly? date = null,
        IReadOnlyCollection<ScheduleException>? exceptions = null,
        IReadOnlyCollection<TimeRange>? occupied = null,
        IReadOnlyCollection<WorkSchedule>? extraSchedules = null,
        int duration = 30,
        int step = 30,
        int bufferBefore = 0,
        int bufferAfter = 0,
        DateTimeOffset? now = null,
        int horizonDays = 60,
        bool ignoreLeadTime = false)
    {
        DateOnly day = date ?? _monday;

        List<WorkSchedule> schedules =
        [
            WorkSchedule.Create(_business, _professional, day.DayOfWeek, new(9, 0), new(12, 0), new(2026, 1, 1), null),
            WorkSchedule.Create(_business, _professional, day.DayOfWeek, new(13, 0), new(18, 0), new(2026, 1, 1), null),
            .. extraSchedules ?? [],
        ];

        return AvailabilityCalculator.Calculate(new AvailabilityRequest(
            _professional, day, _zone, schedules, exceptions ?? [], occupied ?? [],
            duration, bufferBefore, bufferAfter, step, now ?? _dayBefore, MinLeadTimeHours: 2, horizonDays, ignoreLeadTime));
    }

    private static DateTimeOffset Local(int hour, int minute) => Local(_monday, hour, minute);

    private static DateTimeOffset Local(DateOnly date, int hour, int minute) =>
        new DateTimeOffset(date.ToDateTime(new TimeOnly(hour, minute)), TimeSpan.FromHours(-3)).ToUniversalTime();
}
