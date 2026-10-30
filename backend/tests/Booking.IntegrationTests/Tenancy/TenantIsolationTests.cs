using System.Net;
using System.Net.Http.Json;
using Booking.Arguments.Module.Catalog;
using Booking.Arguments.Module.People;
using Booking.Arguments.Module.Scheduling;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;
using Xunit.Abstractions;

namespace Booking.IntegrationTests.Tenancy;

/// <summary>
/// Isolamento entre estabelecimentos (ADR-003): o tenant vem do token, nunca do corpo nem da query, e id de
/// outro tenant responde como inexistente (404), não como proibido (403) — 403 confirmaria que o id existe.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class TenantIsolationTests(IntegrationFixture fixture, ITestOutputHelper output)
{
    private readonly TestWorld _world = new(fixture);

    private sealed record Tenant(TestBusiness Business, TestUser Customer, AppointmentResponse Appointment);

    /// <summary>Estabelecimento aprovado, com dono, profissional, serviço e um pedido pendente de um consumidor.</summary>
    private async Task<Tenant> NewTenantAsync(int hour)
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser customer = await _world.NewCustomerAsync();
        AppointmentResponse appointment = await _world.BookAsync(
            customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(hour));

        return new Tenant(business, customer, appointment);
    }

    [Fact]
    public async Task B1_owner_of_A_cannot_transition_an_appointment_of_B()
    {
        Tenant a = await NewTenantAsync(9);
        Tenant b = await NewTenantAsync(10);
        string path = $"/api/businesses/current/appointments/{b.Appointment.Id}";

        (string Action, object? Body)[] actions =
        [
            ("confirm", null),
            ("reject", new ReasonRequest("teste")),
            ("cancel", new ReasonRequest("teste")),
            ("complete", null),
            ("no-show", null),
        ];

        foreach ((string action, object? body) in actions)
        {
            using HttpResponseMessage response = await _world.SendAsync(HttpMethod.Post, $"{path}/{action}", body, a.Business.OwnerToken);

            output.WriteLine($"B1 {action}: {(int)response.StatusCode} {await TestWorld.ErrorCodeAsync(response)}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
            Assert.Equal("appointment.not_found", await TestWorld.ErrorCodeAsync(response));
        }

        Assert.Equal("Pending", await StatusOfAsync(b.Appointment.Id));
    }

    [Fact]
    public async Task B2_owner_of_A_lists_only_appointments_of_A()
    {
        Tenant a = await NewTenantAsync(9);
        Tenant b = await NewTenantAsync(9);

        PagedResult<AppointmentResponse> agenda = await _world.SendOkAsync<PagedResult<AppointmentResponse>>(
            HttpMethod.Get, $"/api/businesses/current/appointments?date={TestCalendar.BookableDay:yyyy-MM-dd}", null, a.Business.OwnerToken);
        PagedResult<AppointmentResponse> pending = await _world.SendOkAsync<PagedResult<AppointmentResponse>>(
            HttpMethod.Get, "/api/businesses/current/appointments/pending", null, a.Business.OwnerToken);

        output.WriteLine($"B2: agenda de A = {agenda.TotalCount} item(ns), pendentes de A = {pending.TotalCount} item(ns)");

        foreach (PagedResult<AppointmentResponse> page in new[] { agenda, pending })
        {
            AppointmentResponse only = Assert.Single(page.Items);
            Assert.Equal(1, page.TotalCount);
            Assert.Equal(a.Appointment.Id, only.Id);
            Assert.Equal(a.Business.Id, only.BusinessId);
            Assert.DoesNotContain(page.Items, i => i.Id == b.Appointment.Id);
        }
    }

    [Fact]
    public async Task B3_owner_of_A_cannot_edit_service_professional_or_schedule_of_B()
    {
        Tenant a = await NewTenantAsync(9);
        Tenant b = await NewTenantAsync(10);
        string token = a.Business.OwnerToken;

        (string What, HttpMethod Method, string Path, object? Body)[] attempts =
        [
            ("serviço", HttpMethod.Put, $"/api/businesses/current/services/{b.Business.Services[0].Id}",
                new SaveServiceRequest("Invadido", null, 30, 0, 0, 15, 1, null)),
            ("profissional", HttpMethod.Put, $"/api/businesses/current/professionals/{b.Business.ProfessionalIds[0]}",
                new UpdateProfessionalRequest("Invadido", null, null, false, false)),
            // A jornada não tem edição, só exclusão: a operação de escrita que existe é o DELETE.
            ("jornada", HttpMethod.Delete, $"/api/businesses/current/work-schedules/{b.Business.WorkScheduleIds[0]}", null),
        ];

        foreach ((string what, HttpMethod method, string path, object? body) in attempts)
        {
            using HttpResponseMessage response = await _world.SendAsync(method, path, body, token);

            output.WriteLine($"B3 {what}: {(int)response.StatusCode} {await TestWorld.ErrorCodeAsync(response)}");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        Assert.Equal(0, await _world.CountAsync(
            "SELECT count(*) FROM catalog.service WHERE business_id = @b AND name = 'Invadido'", ("b", b.Business.Id)));
        Assert.Equal(0, await _world.CountAsync(
            "SELECT count(*) FROM people.professional WHERE business_id = @b AND display_name = 'Invadido'", ("b", b.Business.Id)));
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM availability.work_schedule WHERE id = @s", ("s", b.Business.WorkScheduleIds[0])));
    }

    [Fact]
    public async Task B4_owner_of_A_cannot_book_at_the_counter_with_service_and_professional_of_B()
    {
        Tenant a = await NewTenantAsync(9);
        Tenant b = await NewTenantAsync(10);

        using HttpResponseMessage response = await _world.SendAsync(
            HttpMethod.Post, "/api/businesses/current/appointments/counter",
            new CounterAppointmentRequest(b.Business.Services[0].Id, b.Business.ProfessionalIds[0], TestCalendar.At(14), "Balcão", null, null),
            a.Business.OwnerToken);

        string? code = await TestWorld.ErrorCodeAsync(response);
        output.WriteLine($"B4: {(int)response.StatusCode} {code}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("service.not_found", code);
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM scheduling.appointment WHERE business_id = @b", ("b", b.Business.Id)));
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM scheduling.appointment WHERE business_id = @a", ("a", a.Business.Id)));
    }

    [Fact]
    public async Task B5_customer_X_cannot_cancel_the_appointment_of_customer_Y()
    {
        Tenant x = await NewTenantAsync(9);
        Tenant y = await NewTenantAsync(10);

        using HttpResponseMessage response = await _world.SendAsync(
            HttpMethod.Post, $"/api/appointments/{y.Appointment.Id}/cancel", new ReasonRequest(null), x.Customer.Token);

        string? code = await TestWorld.ErrorCodeAsync(response);
        output.WriteLine($"B5: {(int)response.StatusCode} {code}");

        // CancelMyAppointmentCommand busca por (id, customer_id): agendamento de outro consumidor não existe para ele.
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("appointment.not_found", code);
        Assert.Equal("Pending", await StatusOfAsync(y.Appointment.Id));
    }

    [Fact]
    public async Task B6_token_without_business_is_refused_on_current_business_routes()
    {
        TestUser customer = await _world.NewCustomerAsync();

        string[] paths =
        [
            $"/api/businesses/current/appointments?date={TestCalendar.BookableDay:yyyy-MM-dd}",
            "/api/businesses/current/appointments/pending",
            "/api/businesses/current/services",
            "/api/businesses/current/professionals",
            "/api/businesses/current/work-schedules",
            "/api/businesses/current",
        ];

        var results = new List<string>();
        foreach (string path in paths)
        {
            using HttpResponseMessage response = await _world.SendAsync(HttpMethod.Get, path, null, customer.Token);
            results.Add($"{path} → {(int)response.StatusCode} {await TestWorld.ErrorCodeAsync(response)}");
        }

        output.WriteLine("B6:" + Environment.NewLine + string.Join(Environment.NewLine, results));
        Assert.All(results, r => Assert.EndsWith("→ 403 tenant.missing", r));
    }

    [Fact]
    public async Task B7_business_id_forged_in_query_or_body_is_ignored()
    {
        Tenant a = await NewTenantAsync(9);
        Tenant b = await NewTenantAsync(9);

        // Query: a agenda continua sendo a do token.
        PagedResult<AppointmentResponse> agenda = await _world.SendOkAsync<PagedResult<AppointmentResponse>>(
            HttpMethod.Get,
            $"/api/businesses/current/appointments?date={TestCalendar.BookableDay:yyyy-MM-dd}&businessId={b.Business.Id}&business_id={b.Business.Id}",
            null, a.Business.OwnerToken);

        Assert.All(agenda.Items, i => Assert.Equal(a.Business.Id, i.BusinessId));
        Assert.DoesNotContain(agenda.Items, i => i.Id == b.Appointment.Id);

        // Corpo: um businessId de B a mais no JSON não muda onde o balcão grava.
        var forged = new
        {
            businessId = b.Business.Id,
            business_id = b.Business.Id,
            serviceId = a.Business.Services[0].Id,
            professionalId = a.Business.ProfessionalIds[0],
            startsAt = TestCalendar.At(15),
            walkInName = "Balcão",
            walkInPhone = (string?)null,
            notes = (string?)null,
        };

        using HttpResponseMessage response = await _world.SendAsync(
            HttpMethod.Post, "/api/businesses/current/appointments/counter", forged, a.Business.OwnerToken);
        await TestWorld.EnsureStatusAsync(response, HttpStatusCode.Created);
        AppointmentResponse created = (await response.Content.ReadFromJsonAsync<AppointmentResponse>(TestWorld.Json))!;

        output.WriteLine($"B7: agenda com businessId forjado = {agenda.TotalCount} item(ns) de A; balcão gravado em {(created.BusinessId == a.Business.Id ? "A" : "B")}");
        Assert.Equal(a.Business.Id, created.BusinessId);
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM scheduling.appointment WHERE business_id = @b", ("b", b.Business.Id)));
    }

    private async Task<string> StatusOfAsync(Guid appointmentId)
    {
        long pending = await _world.CountAsync(
            "SELECT count(*) FROM scheduling.appointment WHERE id = @id AND status = 'Pending'", ("id", appointmentId));
        return pending == 1 ? "Pending" : "outro";
    }
}
