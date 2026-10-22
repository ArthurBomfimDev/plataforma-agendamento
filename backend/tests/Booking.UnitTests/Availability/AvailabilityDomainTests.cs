using Booking.Domain.DomainService.Module.Availability;
using Booking.Domain.Entity.Module.Availability;
using Booking.Domain.Enum.Module.Availability;
using Booking.Domain.Exceptions;
using Booking.Domain.ValueObject;

namespace Booking.UnitTests.Availability;

public sealed class AvailabilityDomainTests
{
    private static readonly Guid _business = Guid.CreateVersion7();
    private static readonly Guid _professional = Guid.CreateVersion7();

    [Theory]
    [InlineData(2024, 3, 31)]
    [InlineData(2025, 4, 20)]
    [InlineData(2026, 4, 5)]
    [InlineData(2027, 3, 28)]
    public void Easter_is_computed_for_the_gregorian_calendar(int year, int month, int day)
    {
        Assert.Equal(new DateOnly(year, month, day), BrazilianHolidays.Easter(year));
    }

    [Fact]
    public void Good_friday_and_fixed_national_holidays_are_recognized()
    {
        Assert.Equal("Sexta-feira Santa", BrazilianHolidays.NameOf(new DateOnly(2026, 4, 3)));
        Assert.Equal("Tiradentes", BrazilianHolidays.NameOf(new DateOnly(2026, 4, 21)));
        Assert.True(BrazilianHolidays.IsHoliday(new DateOnly(2026, 11, 20)));
    }

    [Fact]
    public void Carnival_is_not_a_national_holiday()
    {
        Assert.False(BrazilianHolidays.IsHoliday(new DateOnly(2026, 2, 17)));
    }

    [Fact]
    public void Overlapping_schedules_on_the_same_day_conflict_but_adjacent_ones_do_not()
    {
        WorkSchedule morning = Schedule(new(9, 0), new(12, 0));

        Assert.True(morning.ConflictsWith(Schedule(new(11, 0), new(13, 0))));
        Assert.False(morning.ConflictsWith(Schedule(new(12, 0), new(18, 0))));
    }

    [Fact]
    public void Schedules_with_disjoint_validity_do_not_conflict()
    {
        WorkSchedule until = WorkSchedule.Create(_business, _professional, DayOfWeek.Monday, new(9, 0), new(12, 0), new(2026, 1, 1), new(2026, 6, 30));
        WorkSchedule from = WorkSchedule.Create(_business, _professional, DayOfWeek.Monday, new(9, 0), new(12, 0), new(2026, 7, 1), null);

        Assert.False(until.ConflictsWith(from));
    }

    [Fact]
    public void Schedule_must_end_after_it_starts()
    {
        Assert.Throws<DomainException>(() => Schedule(new(12, 0), new(9, 0)));
    }

    [Fact]
    public void Extra_shift_needs_a_professional()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;

        Assert.Throws<DomainException>(() =>
            ScheduleException.Create(_business, null, ScheduleExceptionKind.ExtraShift, TimeRange.Of(now, now.AddHours(1)), null));
    }

    private static WorkSchedule Schedule(TimeOnly start, TimeOnly end) =>
        WorkSchedule.Create(_business, _professional, DayOfWeek.Monday, start, end, new(2026, 1, 1), null);
}
