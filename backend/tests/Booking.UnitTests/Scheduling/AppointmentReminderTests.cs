using Booking.Domain.Entity.Module.Scheduling;
using Booking.Domain.Enum.Module.Scheduling;

namespace Booking.UnitTests.Scheduling;

/// <summary>
/// Quando um agendamento deve receber lembrete (C1): 24 h antes e 1 h antes, só confirmado, só com conta, nunca depois do
/// horário, e cada lembrete uma vez só.
/// </summary>
public sealed class AppointmentReminderTests
{
    private static readonly DateTimeOffset _now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);

    private static Appointment Confirmed(TimeSpan startsIn, bool withCustomer = true)
    {
        var service = new ServiceSnapshot(Guid.CreateVersion7(), "Corte", 45, 0, 0, 4000);
        DateTimeOffset startsAt = _now + startsIn;

        if (!withCustomer)
        {
            return Appointment.AtCounter(
                Guid.CreateVersion7(), Guid.CreateVersion7(), service, startsAt, false, "Balcão", null, null,
                new SchedulingActor(Guid.CreateVersion7(), "Owner"), _now.AddDays(-3));
        }

        return Appointment.Request(
            Guid.CreateVersion7(), Guid.CreateVersion7(), Guid.CreateVersion7(), service, startsAt,
            new BookingPolicy(AutoConfirm: true, PendingExpirationHours: 12, MinLeadTimeHours: 2), false,
            new SchedulingActor(Guid.CreateVersion7(), "Customer"), _now.AddDays(-3), null, null, null);
    }

    [Theory]
    [InlineData(24 * 60, ReminderKind.DayBefore)]
    [InlineData(20 * 60, ReminderKind.DayBefore)]
    [InlineData(121, ReminderKind.DayBefore)]
    [InlineData(60, ReminderKind.HourBefore)]
    [InlineData(30, ReminderKind.HourBefore)]
    [InlineData(1, ReminderKind.HourBefore)]
    public void A_confirmed_appointment_inside_a_window_is_due(int minutesLeft, ReminderKind expected)
    {
        Assert.Equal(expected, Confirmed(TimeSpan.FromMinutes(minutesLeft)).ReminderDue(_now));
    }

    [Theory]
    [InlineData(24 * 60 + 1)]
    [InlineData(5 * 24 * 60)]
    [InlineData(120)]
    [InlineData(90)]
    [InlineData(61)]
    [InlineData(0)]
    [InlineData(-30)]
    public void Outside_the_windows_nothing_is_due(int minutesLeft)
    {
        // Entre 1 h e 2 h não há lembrete: o de 24 h já não cabe (ficaria colado no de 1 h) e o de 1 h ainda não chegou.
        Assert.Null(Confirmed(TimeSpan.FromMinutes(minutesLeft)).ReminderDue(_now));
    }

    [Fact]
    public void A_reminder_is_sent_once()
    {
        Appointment dayBefore = Confirmed(TimeSpan.FromHours(20));
        dayBefore.MarkReminderSent(ReminderKind.DayBefore, _now);
        Assert.Null(dayBefore.ReminderDue(_now));

        Appointment hourBefore = Confirmed(TimeSpan.FromMinutes(30));
        hourBefore.MarkReminderSent(ReminderKind.HourBefore, _now);
        Assert.Null(hourBefore.ReminderDue(_now));
    }

    [Fact]
    public void The_day_before_reminder_does_not_stop_the_hour_before_one()
    {
        Appointment appointment = Confirmed(TimeSpan.FromHours(20));
        appointment.MarkReminderSent(ReminderKind.DayBefore, _now);

        Assert.Equal(ReminderKind.HourBefore, appointment.ReminderDue(_now + TimeSpan.FromHours(19.5)));
    }

    [Fact]
    public void Pending_cancelled_rejected_and_expired_never_get_a_reminder()
    {
        var service = new ServiceSnapshot(Guid.CreateVersion7(), "Corte", 45, 0, 0, 4000);
        DateTimeOffset startsAt = _now.AddHours(20);
        var policy = new BookingPolicy(AutoConfirm: false, PendingExpirationHours: 12, MinLeadTimeHours: 2);
        var customer = new SchedulingActor(Guid.CreateVersion7(), "Customer");
        var owner = new SchedulingActor(Guid.CreateVersion7(), "Owner");

        Appointment Pending() => Appointment.Request(
            Guid.CreateVersion7(), Guid.CreateVersion7(), Guid.CreateVersion7(), service, startsAt, policy, false, customer, _now.AddHours(-1), null, null, null);

        Appointment pending = Pending();
        Assert.Null(pending.ReminderDue(_now));

        Appointment rejected = Pending();
        rejected.Reject(owner, _now, null);
        Assert.Null(rejected.ReminderDue(_now));

        Appointment expired = Pending();
        expired.Expire(_now.AddHours(13));
        Assert.Null(expired.ReminderDue(_now));

        Appointment cancelled = Confirmed(TimeSpan.FromHours(20));
        Assert.Equal(ReminderKind.DayBefore, cancelled.ReminderDue(_now));
        cancelled.CancelByBusiness(owner, _now, "motivo");
        Assert.Null(cancelled.ReminderDue(_now));
    }

    [Fact]
    public void A_walk_in_without_an_account_has_nobody_to_remind()
    {
        Assert.Null(Confirmed(TimeSpan.FromHours(20), withCustomer: false).ReminderDue(_now));
    }
}
