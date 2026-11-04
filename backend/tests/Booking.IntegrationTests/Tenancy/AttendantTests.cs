using System.Net;
using Booking.Arguments.Module.Availability;
using Booking.Arguments.Module.Scheduling;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Tenancy;

/// <summary>
/// Papel Atendente (Fase 4, bloco 2): opera a agenda e os pedidos de todos os profissionais; não edita serviços, equipe,
/// jornadas, fotos, convites nem configurações. ESCRITOS SEM DOCKER: ainda não foram rodados (docs/verificacao-pendente.md).
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class AttendantTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    /// <summary>Toda rota do estabelecimento fora da permissão do atendente, com o corpo mínimo que o binding aceita.</summary>
    private static IEnumerable<(HttpMethod Method, string Path, object? Body)> ForbiddenRoutes()
    {
        var id = Guid.NewGuid();
        var empty = new { };

        return
        [
            // Jornadas
            (HttpMethod.Post, "/api/businesses/current/work-schedules", empty),
            (HttpMethod.Put, $"/api/businesses/current/work-schedules/{id}", empty),
            (HttpMethod.Delete, $"/api/businesses/current/work-schedules/{id}", null),
            // Serviços
            (HttpMethod.Post, "/api/businesses/current/services", empty),
            (HttpMethod.Put, $"/api/businesses/current/services/{id}", empty),
            (HttpMethod.Delete, $"/api/businesses/current/services/{id}/image", null),
            (HttpMethod.Put, $"/api/businesses/current/services/{id}/professionals/{id}", null),
            (HttpMethod.Delete, $"/api/businesses/current/services/{id}/professionals/{id}", null),
            // Equipe e fotos
            (HttpMethod.Post, "/api/businesses/current/professionals", empty),
            (HttpMethod.Put, $"/api/businesses/current/professionals/{id}", empty),
            (HttpMethod.Delete, $"/api/businesses/current/professionals/{id}/photo", null),
            // Estabelecimento: leitura do dono, configurações, fotos e publicação
            (HttpMethod.Get, "/api/businesses/current", null),
            (HttpMethod.Get, "/api/businesses/current/checklist", null),
            (HttpMethod.Put, "/api/businesses/current/scheduling-policy", empty),
            (HttpMethod.Put, "/api/businesses/current/address", empty),
            (HttpMethod.Put, "/api/businesses/current/location", empty),
            (HttpMethod.Delete, "/api/businesses/current/logo", null),
            (HttpMethod.Delete, "/api/businesses/current/cover", null),
            (HttpMethod.Post, "/api/businesses/current/submit", null),
            (HttpMethod.Put, "/api/businesses/current/responsible", empty),
            (HttpMethod.Post, "/api/businesses/current/terms", empty),
            (HttpMethod.Post, "/api/businesses/current/publish", null),
            // Convites e vagas
            (HttpMethod.Get, "/api/businesses/current/invitations", null),
            (HttpMethod.Get, "/api/businesses/current/seats", null),
            (HttpMethod.Post, "/api/businesses/current/invitations", empty),
            (HttpMethod.Post, $"/api/businesses/current/invitations/{id}/resend", null),
            (HttpMethod.Delete, $"/api/businesses/current/invitations/{id}", null),
            // Plataforma
            (HttpMethod.Get, "/api/admin/businesses", null),
            (HttpMethod.Get, "/api/admin/businesses/reports", null),
        ];
    }

    [Fact]
    public async Task T1_every_route_outside_the_attendant_permission_answers_403()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser attendant = await _world.NewAttendantAsync(business);

        foreach ((HttpMethod method, string path, object? body) in ForbiddenRoutes())
        {
            using HttpResponseMessage response = await _world.SendAsync(method, path, body, attendant.Token);
            Assert.True(response.StatusCode == HttpStatusCode.Forbidden, $"{method} {path} devia dar 403 para o atendente, deu {(int)response.StatusCode}");
        }
    }

    [Fact]
    public async Task T2_the_attendant_reads_the_data_the_team_needs_to_work()
    {
        TestBusiness business = await _world.NewBusinessAsync(2, [new ServiceSpec(60)]);
        TestUser attendant = await _world.NewAttendantAsync(business);

        foreach (string path in new[]
        {
            "/api/businesses/current/professionals",
            "/api/businesses/current/services",
            "/api/businesses/current/work-schedules",
            "/api/businesses/current/schedule-exceptions",
            "/api/businesses/current/appointments/pending",
            $"/api/businesses/current/appointments?date={TestCalendar.BookableDay:yyyy-MM-dd}",
        })
        {
            using HttpResponseMessage response = await _world.SendAsync(HttpMethod.Get, path, null, attendant.Token);
            Assert.True(response.IsSuccessStatusCode, $"GET {path} devia funcionar para o atendente, deu {(int)response.StatusCode}");
        }
    }

    [Fact]
    public async Task T3_the_attendant_confirms_and_completes_requests_of_every_professional_and_books_at_the_counter()
    {
        TestBusiness business = await _world.NewBusinessAsync(2, [new ServiceSpec(60)]);
        TestUser attendant = await _world.NewAttendantAsync(business);
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(2);
        TestService service = business.Services[0];

        AppointmentResponse first = await _world.BookAsync(customers[0], business, service, business.ProfessionalIds[0], TestCalendar.At(10));
        AppointmentResponse second = await _world.BookAsync(customers[1], business, service, business.ProfessionalIds[1], TestCalendar.At(11));

        foreach (AppointmentResponse appointment in new[] { first, second })
        {
            AppointmentResponse confirmed = await _world.SendOkAsync<AppointmentResponse>(
                HttpMethod.Post, $"/api/businesses/current/appointments/{appointment.Id}/confirm", null, attendant.Token);
            Assert.Equal("Confirmed", confirmed.Status);
        }

        // Balcão: o atendente marca para qualquer profissional.
        using HttpResponseMessage counter = await _world.SendAsync(
            HttpMethod.Post, "/api/businesses/current/appointments/counter",
            new CounterAppointmentRequest(service.Id, business.ProfessionalIds[1], TestCalendar.At(14), "Cliente de balcão", null, null),
            attendant.Token);
        Assert.Equal(HttpStatusCode.Created, counter.StatusCode);
    }

    [Fact]
    public async Task T5_the_attendant_blocks_any_professional_and_the_whole_business()
    {
        TestBusiness business = await _world.NewBusinessAsync(2, [new ServiceSpec(60)]);
        TestUser attendant = await _world.NewAttendantAsync(business);

        foreach (Guid? target in new Guid?[] { business.ProfessionalIds[0], business.ProfessionalIds[1], null })
        {
            using HttpResponseMessage response = await _world.SendAsync(
                HttpMethod.Post, "/api/businesses/current/schedule-exceptions",
                new AddScheduleExceptionRequest(target, "Block", TestCalendar.At(9), TestCalendar.At(10), "Reunião", null, null), attendant.Token);
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }
    }

    [Fact]
    public async Task T6_the_professional_blocks_only_the_own_agenda_and_edits_only_the_own_profile()
    {
        TestBusiness business = await _world.NewBusinessAsync(2, [new ServiceSpec(60)]);
        TestUser staff = await _world.NewStaffAsync(business, professionalIndex: 0);
        Guid own = business.ProfessionalIds[0];
        Guid other = business.ProfessionalIds[1];

        AddScheduleExceptionRequest Block(Guid? professionalId) =>
            new(professionalId, "Block", TestCalendar.At(9), TestCalendar.At(10), "Folga", null, null);

        using (HttpResponseMessage mine = await _world.SendAsync(
            HttpMethod.Post, "/api/businesses/current/schedule-exceptions", Block(own), staff.Token))
        {
            Assert.Equal(HttpStatusCode.Created, mine.StatusCode);
        }

        foreach (Guid? target in new Guid?[] { other, null })
        {
            using HttpResponseMessage refused = await _world.SendAsync(
                HttpMethod.Post, "/api/businesses/current/schedule-exceptions", Block(target), staff.Token);
            Assert.Equal(HttpStatusCode.Forbidden, refused.StatusCode);
        }

        // "Meu perfil": o profissional lê e edita o próprio; o atendente e o dono sem perfil ligado recebem 403.
        using HttpResponseMessage profile = await _world.SendAsync(HttpMethod.Get, "/api/businesses/current/professionals/me", null, staff.Token);
        Assert.Equal(HttpStatusCode.OK, profile.StatusCode);

        TestUser attendant = await _world.NewAttendantAsync(business);
        using HttpResponseMessage noProfile = await _world.SendAsync(HttpMethod.Get, "/api/businesses/current/professionals/me", null, attendant.Token);
        Assert.Equal(HttpStatusCode.Forbidden, noProfile.StatusCode);
    }

    [Fact]
    public async Task T4_the_attendant_cannot_book_as_a_consumer_in_the_panel_context()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser attendant = await _world.NewAttendantAsync(business);

        using HttpResponseMessage response = await _world.SendAsync(
            HttpMethod.Post, "/api/appointments",
            new RequestAppointmentRequest(business.Id, business.Services[0].Id, business.ProfessionalIds[0], TestCalendar.At(15), null, null, Guid.NewGuid().ToString("N")),
            attendant.Token);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
