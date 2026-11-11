using Booking.Domain.Entity.Module.Scheduling;
using Booking.Domain.Enum.Module.Scheduling;
using Booking.Domain.Exceptions;

namespace Booking.UnitTests.Scheduling;

public sealed class AppointmentTests
{
    private static readonly DateTimeOffset _now = new(2026, 10, 19, 12, 0, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset _start = _now.AddDays(2);
    private static readonly ServiceSnapshot _haircut = new(Guid.CreateVersion7(), "Corte", 30, 5, 10, 5000);
    private static readonly SchedulingActor _customer = new(Guid.CreateVersion7(), "Customer");
    private static readonly SchedulingActor _owner = new(Guid.CreateVersion7(), "Owner");

    [Fact]
    public void Manual_approval_creates_a_pending_request_that_expires_by_deadline_or_lead_time()
    {
        Appointment appointment = Request(autoConfirm: false);

        Assert.Equal(AppointmentStatus.Pending, appointment.Status);
        Assert.Equal(_now.AddHours(12), appointment.ExpiresAt);
        Assert.Single(appointment.History);

        Appointment close = Request(autoConfirm: false, startsAt: _now.AddHours(5));
        Assert.Equal(_now.AddHours(3), close.ExpiresAt); // antecedência mínima vence antes do prazo de 12 h
    }

    [Fact]
    public void Auto_confirm_skips_the_pending_state()
    {
        Appointment appointment = Request(autoConfirm: true);

        Assert.Equal(AppointmentStatus.Confirmed, appointment.Status);
        Assert.Null(appointment.ExpiresAt);
    }

    [Fact]
    public void Snapshot_freezes_price_duration_and_name_and_blocked_range_includes_buffers()
    {
        Appointment appointment = Request(autoConfirm: true);

        Assert.Equal(5000, appointment.PriceCents);
        Assert.Equal("Corte", appointment.ServiceNameSnapshot);
        Assert.Equal(_start.AddMinutes(30), appointment.EndsAt);
        Assert.Equal(_start.AddMinutes(-5), appointment.BlockedRange.Start);
        Assert.Equal(_start.AddMinutes(40), appointment.BlockedRange.End);
    }

    [Fact]
    public void Expired_request_cannot_be_confirmed_and_expires_only_after_deadline()
    {
        Appointment appointment = Request(autoConfirm: false);

        Assert.Throws<DomainException>(() => appointment.Expire(_now.AddHours(1)));
        Assert.Throws<DomainException>(() => appointment.Confirm(_owner, _now.AddHours(13)));

        appointment.Expire(_now.AddHours(13));

        Assert.Equal(AppointmentStatus.Expired, appointment.Status);
        Assert.Equal(CancellationParty.System, appointment.CancelledBy);
    }

    [Fact]
    public void Customer_cancels_confirmed_only_outside_the_window_but_pending_anytime()
    {
        Appointment confirmed = Request(autoConfirm: true);
        Assert.Throws<DomainException>(() => confirmed.CancelByCustomer(_customer, _start.AddHours(-23), 24, null));

        confirmed.CancelByCustomer(_customer, _start.AddHours(-25), 24, "imprevisto");
        Assert.Equal(AppointmentStatus.Cancelled, confirmed.Status);
        Assert.Equal(CancellationParty.Customer, confirmed.CancelledBy);

        Appointment pending = Request(autoConfirm: false);
        pending.CancelByCustomer(_customer, _start.AddHours(-1), 24, null);
        Assert.Equal(AppointmentStatus.Cancelled, pending.Status);
    }

    [Fact]
    public void Completed_and_no_show_only_after_the_end_and_only_from_confirmed()
    {
        Appointment pending = Request(autoConfirm: false);
        Assert.Throws<DomainException>(() => pending.Complete(_owner, _start.AddHours(1)));

        Appointment confirmed = Request(autoConfirm: true);
        Assert.Throws<DomainException>(() => confirmed.Complete(_owner, _start.AddMinutes(10)));

        confirmed.MarkNoShow(_owner, _start.AddMinutes(31));
        Assert.Equal(AppointmentStatus.NoShow, confirmed.Status);
    }

    [Fact]
    public void Business_rejects_pending_and_cancels_confirmed_never_the_other_way()
    {
        Appointment pending = Request(autoConfirm: false);
        Assert.Throws<DomainException>(() => pending.CancelByBusiness(_owner, _now, null));

        pending.Reject(_owner, _now, "sem horário");
        Assert.Equal(AppointmentStatus.Rejected, pending.Status);

        Appointment confirmed = Request(autoConfirm: true);
        Assert.Throws<DomainException>(() => confirmed.Reject(_owner, _now, null));
    }

    [Fact]
    public void Every_transition_is_recorded_in_the_history()
    {
        Appointment appointment = Request(autoConfirm: false);
        appointment.Confirm(_owner, _now.AddHours(1));
        appointment.Complete(_owner, _start.AddHours(1));

        Assert.Equal(
            [AppointmentStatus.Pending, AppointmentStatus.Confirmed, AppointmentStatus.Completed],
            appointment.History.Select(e => e.ToStatus));
        Assert.Equal("Owner", appointment.History.Last().ActorRole);
    }

    [Theory]
    [InlineData(AppointmentStatus.Pending, true)]
    [InlineData(AppointmentStatus.Confirmed, true)]
    [InlineData(AppointmentStatus.Completed, true)]
    [InlineData(AppointmentStatus.NoShow, true)]
    [InlineData(AppointmentStatus.Cancelled, false)]
    [InlineData(AppointmentStatus.Rejected, false)]
    [InlineData(AppointmentStatus.Expired, false)]
    public void Only_four_states_occupy_the_slot(AppointmentStatus status, bool occupies)
    {
        Assert.Equal(occupies, Appointment.OccupiesSlot(status));
    }

    [Fact]
    public void Counter_booking_is_born_confirmed_and_needs_a_name()
    {
        Assert.Throws<DomainException>(() =>
            Appointment.AtCounter(Guid.CreateVersion7(), Guid.CreateVersion7(), _haircut, _start, false, " ", null, null, _owner, _now));

        Appointment walkIn = Appointment.AtCounter(Guid.CreateVersion7(), Guid.CreateVersion7(), _haircut, _start, false, "Ana", null, null, _owner, _now);

        Assert.Equal(AppointmentStatus.Confirmed, walkIn.Status);
        Assert.Equal(AppointmentSource.Counter, walkIn.Source);
        Assert.Null(walkIn.CustomerId);
    }

    private static Appointment Request(bool autoConfirm, DateTimeOffset? startsAt = null) =>
        Appointment.Request(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            _haircut,
            startsAt ?? _start,
            new BookingPolicy(autoConfirm, PendingExpirationHours: 12, MinLeadTimeHours: 2),
            isSensitive: false,
            _customer,
            _now,
            customerNotes: null,
            attendeeName: null,
            idempotencyKey: null);
}
