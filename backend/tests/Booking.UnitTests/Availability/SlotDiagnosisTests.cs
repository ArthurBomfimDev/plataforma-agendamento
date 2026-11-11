using Booking.Domain.DomainService.Module.Availability;
using Booking.Domain.Entity.Module.Availability;
using Booking.Domain.Enum.Module.Availability;
using Booking.Domain.ValueObject;

namespace Booking.UnitTests.Availability;

/// <summary>
/// Por que um horário foi recusado. Reproduz os dois casos de 11/11 ("Arthur dos Cortes", quarta-feira, corte de 45 min,
/// passo de 15, sem buffer, jornada 09–13 e 14:30–19): ambos viraram "esse horário acabou de ser ocupado" sem estarem
/// ocupados. O primeiro era a antecedência mínima (09:45 + 2 h = 11:45 e a lista na tela já era do passado); o segundo,
/// as 13:00, caía no intervalo de almoço.
/// </summary>
public sealed class SlotDiagnosisTests
{
    private static readonly TimeZoneInfo _zone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
    private static readonly Guid _business = Guid.CreateVersion7();
    private static readonly Guid _professional = Guid.CreateVersion7();
    private static readonly DateOnly _wednesday = new(2026, 11, 11);

    [Fact]
    public void Slot_inside_the_lead_time_is_a_lead_time_rejection_not_a_busy_one()
    {
        // 09:45:30 + 2 h passou das 11:45:00: o horário estava na lista carregada às 09:44 e já não vale.
        Assert.Equal(SlotRejection.LeadTime, Diagnose(Local(11, 45), now: Local(9, 45).AddSeconds(30)));
    }

    [Fact]
    public void Slot_exactly_at_the_lead_time_is_accepted()
    {
        Assert.Equal(SlotRejection.None, Diagnose(Local(11, 45), now: Local(9, 45)));
    }

    [Fact]
    public void Counter_booking_in_the_lunch_break_is_outside_work_hours()
    {
        // Balcão ignora a antecedência; as 13:00 o profissional não trabalha (jornada 09–13, 14:30–19).
        Assert.Equal(SlotRejection.OutsideWorkHours, Diagnose(Local(13, 0), now: Local(9, 48), ignoreLeadTime: true));
    }

    [Fact]
    public void Slot_that_does_not_fit_before_the_end_of_the_shift_is_outside_work_hours()
    {
        Assert.Equal(SlotRejection.OutsideWorkHours, Diagnose(Local(12, 30), now: Local(8, 0)));
    }

    [Fact]
    public void Slot_taken_by_another_appointment_is_busy()
    {
        TimeRange taken = TimeRange.Of(Local(12, 0), Local(12, 45));

        Assert.Equal(SlotRejection.Busy, Diagnose(Local(12, 0), now: Local(8, 0), occupied: [taken]));
        Assert.Equal(SlotRejection.Busy, Diagnose(Local(11, 45), now: Local(8, 0), occupied: [taken]));
    }

    [Fact]
    public void Slot_right_after_an_appointment_is_free()
    {
        TimeRange taken = TimeRange.Of(Local(12, 0), Local(12, 45));

        Assert.Equal(SlotRejection.None, Diagnose(Local(10, 0), now: Local(8, 0), occupied: [taken]));
    }

    [Fact]
    public void Closed_national_holiday_is_reported_as_holiday()
    {
        DateOnly finados = new(2026, 11, 2);

        Assert.Equal(SlotRejection.HolidayClosed, Diagnose(Local(finados, 10, 0), now: Local(finados.AddDays(-3), 8, 0), date: finados));
    }

    [Fact]
    public void Vacation_or_block_is_reported_as_professional_unavailable()
    {
        ScheduleException block = ScheduleException.Create(
            _business, _professional, ScheduleExceptionKind.Block, TimeRange.Of(Local(15, 0), Local(17, 0)), "médico");

        Assert.Equal(SlotRejection.ProfessionalUnavailable, Diagnose(Local(15, 0), now: Local(8, 0), exceptions: [block]));
    }

    [Fact]
    public void Date_beyond_the_horizon_is_reported_as_beyond_horizon()
    {
        DateOnly far = _wednesday.AddDays(70);

        Assert.Equal(SlotRejection.BeyondHorizon, Diagnose(Local(far, 10, 0), now: Local(8, 0), date: far));
    }

    [Fact]
    public void Time_off_the_step_grid_is_reported_as_not_on_grid()
    {
        Assert.Equal(SlotRejection.NotOnGrid, Diagnose(Local(10, 7), now: Local(8, 0)));
    }

    [Fact]
    public void Every_slot_the_calculator_returns_diagnoses_as_none()
    {
        // Propriedade, sem concorrência: o que o calculador oferece nunca é recusado — com e sem buffer, colado em outro
        // agendamento, e para os dois modos de antecedência.
        foreach ((int before, int after) in new[] { (0, 0), (10, 10), (0, 15), (15, 0) })
        {
            foreach (bool ignore in new[] { false, true })
            {
                TimeRange taken = TimeRange.Of(Local(10, 0).AddMinutes(-before), Local(10, 45).AddMinutes(after));
                AvailabilityRequest request = Request(Local(8, 0), [], [taken], before, after, ignore, _wednesday);
                IReadOnlyList<DateTimeOffset> slots = AvailabilityCalculator.Calculate(request);

                Assert.NotEmpty(slots);
                Assert.All(slots, s => Assert.Equal(SlotRejection.None, AvailabilityCalculator.Diagnose(request, s)));
            }
        }
    }

    [Fact]
    public void Every_step_of_the_day_is_either_offered_or_has_a_reason()
    {
        AvailabilityRequest request = Request(Local(8, 0), [], [TimeRange.Of(Local(12, 0), Local(12, 45))], 0, 0, false, _wednesday);
        HashSet<DateTimeOffset> offered = [.. AvailabilityCalculator.Calculate(request)];

        for (int minute = 0; minute < 24 * 60; minute += 15)
        {
            DateTimeOffset start = Local(minute / 60, minute % 60);
            SlotRejection reason = AvailabilityCalculator.Diagnose(request, start);

            Assert.Equal(offered.Contains(start), reason == SlotRejection.None);
        }
    }

    private static SlotRejection Diagnose(
        DateTimeOffset start,
        DateTimeOffset now,
        bool ignoreLeadTime = false,
        DateOnly? date = null,
        IReadOnlyCollection<ScheduleException>? exceptions = null,
        IReadOnlyCollection<TimeRange>? occupied = null) =>
        AvailabilityCalculator.Diagnose(Request(now, exceptions ?? [], occupied ?? [], 0, 0, ignoreLeadTime, date ?? _wednesday), start);

    private static AvailabilityRequest Request(
        DateTimeOffset now,
        IReadOnlyCollection<ScheduleException> exceptions,
        IReadOnlyCollection<TimeRange> occupied,
        int bufferBefore,
        int bufferAfter,
        bool ignoreLeadTime,
        DateOnly day) =>
        new(
            _professional, day, _zone,
            [
                WorkSchedule.Create(_business, _professional, day.DayOfWeek, new(9, 0), new(13, 0), new(2026, 1, 1), null),
                WorkSchedule.Create(_business, _professional, day.DayOfWeek, new(14, 30), new(19, 0), new(2026, 1, 1), null),
            ],
            exceptions, occupied, DurationMinutes: 45, bufferBefore, bufferAfter, SlotStepMinutes: 15,
            now, MinLeadTimeHours: 2, BookingHorizonDays: 60, ignoreLeadTime);

    private static DateTimeOffset Local(int hour, int minute) => Local(_wednesday, hour, minute);

    private static DateTimeOffset Local(DateOnly date, int hour, int minute) =>
        new DateTimeOffset(date.ToDateTime(new TimeOnly(hour, minute)), TimeSpan.FromHours(-3)).ToUniversalTime();
}
