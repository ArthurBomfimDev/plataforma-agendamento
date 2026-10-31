using System.Net;
using Booking.Arguments.Module.Availability;
using Booking.Arguments.Module.Scheduling;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;
using Npgsql;

namespace Booking.IntegrationTests.Availability;

/// <summary>
/// Bloqueio de período com agendamentos dentro (PROJECT-CONTEXT §5): prévia, manter (padrão) ou cancelar todos,
/// e o cancelamento em massa como tudo ou nada.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class ScheduleExceptionTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private sealed record Setup(TestBusiness Business, AppointmentResponse Confirmed, AppointmentResponse Pending, AppointmentResponse Outside);

    /// <summary>Um confirmado às 10:00, um pendente às 13:00 e um pendente fora do período, às 20:00.</summary>
    private async Task<Setup> NewSetupAsync()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(3);
        TestService service = business.Services[0];
        Guid professional = business.ProfessionalIds[0];

        AppointmentResponse confirmed = await _world.BookAsync(customers[0], business, service, professional, TestCalendar.At(10));
        await _world.SendOkAsync(HttpMethod.Post, $"/api/businesses/current/appointments/{confirmed.Id}/confirm", null, business.OwnerToken);
        AppointmentResponse pending = await _world.BookAsync(customers[1], business, service, professional, TestCalendar.At(13));
        AppointmentResponse outside = await _world.BookAsync(customers[2], business, service, professional, TestCalendar.At(20));

        return new Setup(business, confirmed, pending, outside);
    }

    private static AddScheduleExceptionRequest Block(Setup s, string? choice, string? reason) =>
        new(s.Business.ProfessionalIds[0], "Block", TestCalendar.At(9), TestCalendar.At(15), "Consulta médica", choice, reason);

    [Fact]
    public async Task G1_preview_lists_only_what_falls_in_the_period_and_changes_nothing()
    {
        Setup s = await NewSetupAsync();
        string query = $"startsAt={Uri.EscapeDataString(TestCalendar.At(9).ToString("O"))}&endsAt={Uri.EscapeDataString(TestCalendar.At(15).ToString("O"))}";

        PagedResult<AffectedAppointmentResponse> preview = await _world.SendOkAsync<PagedResult<AffectedAppointmentResponse>>(
            HttpMethod.Get, $"/api/businesses/current/schedule-exceptions/affected-appointments?{query}&professionalId={s.Business.ProfessionalIds[0]}",
            null, s.Business.OwnerToken);

        Assert.Equal(2, preview.TotalCount);
        Assert.Equal([s.Confirmed.Id, s.Pending.Id], preview.Items.Select(i => i.Id));
        Assert.Equal(["Confirmed", "Pending"], preview.Items.Select(i => i.Status));
        Assert.Equal(0, await _world.CountAsync(
            "SELECT count(*) FROM availability.schedule_exception WHERE business_id = @b", ("b", s.Business.Id)));

        // Outro estabelecimento, mesmo período: não vê nada de A.
        TestBusiness other = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        PagedResult<AffectedAppointmentResponse> foreign = await _world.SendOkAsync<PagedResult<AffectedAppointmentResponse>>(
            HttpMethod.Get, $"/api/businesses/current/schedule-exceptions/affected-appointments?{query}&professionalId={s.Business.ProfessionalIds[0]}",
            null, other.OwnerToken);
        Assert.Equal(0, foreign.TotalCount);
    }

    [Fact]
    public async Task G2_keep_is_the_default_and_leaves_existing_appointments_alone()
    {
        Setup s = await NewSetupAsync();

        ScheduleExceptionResponse created = await _world.SendOkAsync<ScheduleExceptionResponse>(
            HttpMethod.Post, "/api/businesses/current/schedule-exceptions", Block(s, null, null), s.Business.OwnerToken);

        Assert.Equal(0, created.CancelledAppointments);
        Assert.Equal("Confirmed", await StatusOfAsync(s.Confirmed.Id));
        Assert.Equal("Pending", await StatusOfAsync(s.Pending.Id));

        // O bloqueio vale para pedidos novos: 11:00 cai dentro dele.
        TestUser late = await _world.NewCustomerAsync();
        using HttpResponseMessage refused = await _world.Client.SendAsync(
            _world.RequestAppointment(late, s.Business, s.Business.Services[0], s.Business.ProfessionalIds[0], TestCalendar.At(11)));
        Assert.Equal(HttpStatusCode.Conflict, refused.StatusCode);
    }

    [Fact]
    public async Task G3_cancel_all_cancels_and_rejects_inside_the_period_and_frees_the_slots()
    {
        Setup s = await NewSetupAsync();

        ScheduleExceptionResponse created = await _world.SendOkAsync<ScheduleExceptionResponse>(
            HttpMethod.Post, "/api/businesses/current/schedule-exceptions", Block(s, "CancelAll", "Profissional doente"), s.Business.OwnerToken);

        Assert.Equal(2, created.CancelledAppointments);
        Assert.Equal("Cancelled", await StatusOfAsync(s.Confirmed.Id));
        Assert.Equal("Rejected", await StatusOfAsync(s.Pending.Id));
        Assert.Equal("Pending", await StatusOfAsync(s.Outside.Id));
        Assert.Equal(2, await _world.CountAsync(
            "SELECT count(*) FROM scheduling.appointment WHERE id IN (@a, @b) AND cancellation_reason = 'Profissional doente'",
            ("a", s.Confirmed.Id), ("b", s.Pending.Id)));
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM scheduling.appointment WHERE id = @a AND cancelled_by = 'Business'", ("a", s.Confirmed.Id)));
        Assert.Equal(2, await _world.CountAsync(
            "SELECT count(*) FROM scheduling.appointment_event WHERE appointment_id IN (@a, @b) AND to_status IN ('Cancelled', 'Rejected')",
            ("a", s.Confirmed.Id), ("b", s.Pending.Id)));

        // O consumidor vê o cancelamento e o motivo em "Meus agendamentos".
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM availability.schedule_exception WHERE id = @id", ("id", created.Id)));

        // Horário liberado: sem o bloqueio, 10:00 volta a aceitar pedido.
        using (HttpResponseMessage removed = await _world.SendAsync(
            HttpMethod.Delete, $"/api/businesses/current/schedule-exceptions/{created.Id}", null, s.Business.OwnerToken))
        {
            Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);
        }

        TestUser next = await _world.NewCustomerAsync();
        await _world.BookAsync(next, s.Business, s.Business.Services[0], s.Business.ProfessionalIds[0], TestCalendar.At(10));
    }

    [Fact]
    public async Task G4_cancel_all_requires_a_reason_and_a_blocking_kind()
    {
        Setup s = await NewSetupAsync();

        using (HttpResponseMessage noReason = await _world.SendAsync(
            HttpMethod.Post, "/api/businesses/current/schedule-exceptions", Block(s, "CancelAll", "  "), s.Business.OwnerToken))
        {
            Assert.Equal(HttpStatusCode.BadRequest, noReason.StatusCode);
            Assert.Equal("schedule_exception.cancellation_reason_required", await TestWorld.ErrorCodeAsync(noReason));
        }

        using (HttpResponseMessage extraShift = await _world.SendAsync(
            HttpMethod.Post, "/api/businesses/current/schedule-exceptions",
            Block(s, "CancelAll", "Motivo") with { Kind = "ExtraShift" }, s.Business.OwnerToken))
        {
            Assert.Equal(HttpStatusCode.BadRequest, extraShift.StatusCode);
            Assert.Equal("schedule_exception.cancel_requires_block", await TestWorld.ErrorCodeAsync(extraShift));
        }

        Assert.Equal(0, await _world.CountAsync(
            "SELECT count(*) FROM availability.schedule_exception WHERE business_id = @b", ("b", s.Business.Id)));
        Assert.Equal("Confirmed", await StatusOfAsync(s.Confirmed.Id));
    }

    /// <summary>
    /// Tudo ou nada: um trigger de teste recusa a atualização de um dos dois agendamentos no meio da gravação. Nem o
    /// bloqueio nem o outro cancelamento podem ficar.
    /// </summary>
    [Fact]
    public async Task G5_cancel_all_is_all_or_nothing()
    {
        Setup s = await NewSetupAsync();
        string trigger = $"it_fail_{Guid.NewGuid():N}";

        await ExecuteAsync($"""
            CREATE FUNCTION scheduling.{trigger}() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
              IF NEW.id = '{s.Pending.Id}' THEN RAISE EXCEPTION 'falha provocada pelo teste'; END IF;
              RETURN NEW;
            END $$;
            CREATE TRIGGER {trigger} BEFORE UPDATE ON scheduling.appointment
              FOR EACH ROW EXECUTE FUNCTION scheduling.{trigger}();
            """);
        try
        {
            using HttpResponseMessage response = await _world.SendAsync(
                HttpMethod.Post, "/api/businesses/current/schedule-exceptions", Block(s, "CancelAll", "Profissional doente"), s.Business.OwnerToken);

            // Falha de banco provocada: 500 é o esperado aqui. A mesma requisição sem o trigger passa no G3.
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        }
        finally
        {
            await ExecuteAsync($"DROP TRIGGER {trigger} ON scheduling.appointment; DROP FUNCTION scheduling.{trigger}();");
        }

        Assert.Equal(0, await _world.CountAsync(
            "SELECT count(*) FROM availability.schedule_exception WHERE business_id = @b", ("b", s.Business.Id)));
        Assert.Equal("Confirmed", await StatusOfAsync(s.Confirmed.Id));
        Assert.Equal("Pending", await StatusOfAsync(s.Pending.Id));
    }

    private async Task<string> StatusOfAsync(Guid appointmentId)
    {
        foreach (string status in new[] { "Pending", "Confirmed", "Cancelled", "Rejected" })
        {
            if (await _world.CountAsync(
                "SELECT count(*) FROM scheduling.appointment WHERE id = @id AND status = @s", ("id", appointmentId), ("s", status)) == 1)
            {
                return status;
            }
        }

        return "outro";
    }

    private async Task ExecuteAsync(string sql)
    {
        await using var connection = new NpgsqlConnection(fixture.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }
}
