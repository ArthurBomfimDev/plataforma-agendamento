using System.Net;
using Booking.Arguments.Module.Scheduling;
using Booking.Domain.DomainService.Module.Availability;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Scheduling;

/// <summary>
/// O que o painel do estabelecimento recebe (pendência T, 27/10): o nome de quem marcou e o <c>requestedAt</c>, e os
/// pendentes filtrados por profissional. O profissional com login vê só a própria agenda.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class BusinessPanelTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private static string Day => TestCalendar.BookableDay.ToString("yyyy-MM-dd");

    [Fact]
    public async Task J5_agenda_range_brings_the_week_and_refuses_inverted_or_too_long_ranges()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser customer = await _world.NewCustomerAsync();
        // Uma semana depois, fora de feriado: a jornada de teste cobre todos os dias.
        DateOnly later = TestCalendar.BookableDay.AddDays(7);
        while (BrazilianHolidays.IsHoliday(later))
        {
            later = later.AddDays(1);
        }

        TimeZoneInfo zone = TimeZoneInfo.FindSystemTimeZoneById(TestWorld.TimeZone);
        DateTime laterLocal = later.ToDateTime(new TimeOnly(10, 0));
        DateTimeOffset laterAt = new DateTimeOffset(laterLocal, zone.GetUtcOffset(laterLocal)).ToUniversalTime();

        AppointmentResponse first = await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(9));
        AppointmentResponse second = await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], laterAt);

        string Url(DateOnly from, DateOnly to) => $"/api/businesses/current/appointments?date={from:yyyy-MM-dd}&to={to:yyyy-MM-dd}";

        PagedResult<AppointmentResponse> range = await _world.SendOkAsync<PagedResult<AppointmentResponse>>(
            HttpMethod.Get, Url(TestCalendar.BookableDay, later), null, business.OwnerToken);
        Assert.Equal(new[] { first.Id, second.Id }.Order(), range.Items.Select(a => a.Id).Order());

        // Sem `to`, continua sendo um dia só.
        PagedResult<AppointmentResponse> day = await _world.SendOkAsync<PagedResult<AppointmentResponse>>(
            HttpMethod.Get, $"/api/businesses/current/appointments?date={Day}", null, business.OwnerToken);
        Assert.Equal(first.Id, Assert.Single(day.Items).Id);

        foreach (string url in new[] { Url(later, TestCalendar.BookableDay), Url(TestCalendar.BookableDay, TestCalendar.BookableDay.AddDays(42)) })
        {
            using HttpResponseMessage response = await _world.SendAsync(HttpMethod.Get, url, null, business.OwnerToken);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal("agenda.range_invalid", await TestWorld.ErrorCodeAsync(response));
        }
    }

    [Fact]
    public async Task J1_owner_sees_the_customer_name_social_name_first_and_requested_at()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser plain = await _world.NewCustomerAsync("Joana Cadastro", socialName: null);
        TestUser social = await _world.NewCustomerAsync("Nome de Registro", socialName: "Alex Social");
        AppointmentResponse first = await _world.BookAsync(plain, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(9));
        AppointmentResponse second = await _world.BookAsync(social, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(11));

        PagedResult<AppointmentResponse> agenda = await _world.SendOkAsync<PagedResult<AppointmentResponse>>(
            HttpMethod.Get, $"/api/businesses/current/appointments?date={Day}", null, business.OwnerToken);
        PagedResult<AppointmentResponse> pending = await _world.SendOkAsync<PagedResult<AppointmentResponse>>(
            HttpMethod.Get, "/api/businesses/current/appointments/pending", null, business.OwnerToken);

        foreach (PagedResult<AppointmentResponse> page in new[] { agenda, pending })
        {
            Assert.Equal("Joana Cadastro", page.Items.Single(a => a.Id == first.Id).CustomerName);
            Assert.Equal("Alex Social", page.Items.Single(a => a.Id == second.Id).CustomerName);
            Assert.All(page.Items, a => Assert.NotEqual(default, a.RequestedAt));
        }

        // Transição também devolve o nome.
        AppointmentResponse confirmed = await _world.SendOkAsync<AppointmentResponse>(
            HttpMethod.Post, $"/api/businesses/current/appointments/{first.Id}/confirm", null, business.OwnerToken);
        Assert.Equal("Joana Cadastro", confirmed.CustomerName);

        // O lado do consumidor não traz o campo: é ele mesmo.
        PagedResult<AppointmentResponse> mine = await _world.SendOkAsync<PagedResult<AppointmentResponse>>(
            HttpMethod.Get, "/api/appointments/mine", null, plain.Token);
        Assert.Null(Assert.Single(mine.Items).CustomerName);
        Assert.NotEqual(default, mine.Items[0].RequestedAt);
    }

    [Fact]
    public async Task J2_counter_booking_shows_the_walk_in_name()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);

        AppointmentResponse counter = await _world.SendOkAsync<AppointmentResponse>(
            HttpMethod.Post, "/api/businesses/current/appointments/counter",
            new CounterAppointmentRequest(business.Services[0].Id, business.ProfessionalIds[0], TestCalendar.At(14), "Cliente do Balcão", null, null),
            business.OwnerToken);

        Assert.Equal("Cliente do Balcão", counter.CustomerName);
    }

    [Fact]
    public async Task J3_owner_filters_pending_by_professional()
    {
        TestBusiness business = await _world.NewBusinessAsync(2, [new ServiceSpec(60)]);
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(2);
        AppointmentResponse ofFirst = await _world.BookAsync(customers[0], business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));
        AppointmentResponse ofSecond = await _world.BookAsync(customers[1], business, business.Services[0], business.ProfessionalIds[1], TestCalendar.At(10));

        PagedResult<AppointmentResponse> all = await _world.SendOkAsync<PagedResult<AppointmentResponse>>(
            HttpMethod.Get, "/api/businesses/current/appointments/pending", null, business.OwnerToken);
        PagedResult<AppointmentResponse> filtered = await _world.SendOkAsync<PagedResult<AppointmentResponse>>(
            HttpMethod.Get, $"/api/businesses/current/appointments/pending?professionalId={business.ProfessionalIds[1]}", null, business.OwnerToken);

        Assert.Equal(2, all.TotalCount);
        Assert.Equal(ofSecond.Id, Assert.Single(filtered.Items).Id);
        Assert.DoesNotContain(filtered.Items, a => a.Id == ofFirst.Id);
    }

    [Fact]
    public async Task J4_professional_with_login_sees_names_only_in_the_own_agenda()
    {
        TestBusiness business = await _world.NewBusinessAsync(2, [new ServiceSpec(60)]);
        TestUser mine = await _world.NewCustomerAsync("Consumidora da Minha Agenda", null);
        TestUser theirs = await _world.NewCustomerAsync("Consumidor do Colega", null);
        AppointmentResponse own = await _world.BookAsync(mine, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));
        AppointmentResponse colleague = await _world.BookAsync(theirs, business, business.Services[0], business.ProfessionalIds[1], TestCalendar.At(10));
        TestUser staff = await _world.NewStaffAsync(business, professionalIndex: 0);

        PagedResult<AppointmentResponse> agenda = await _world.SendOkAsync<PagedResult<AppointmentResponse>>(
            HttpMethod.Get, $"/api/businesses/current/appointments?date={Day}&professionalId={business.ProfessionalIds[1]}", null, staff.Token);
        PagedResult<AppointmentResponse> pending = await _world.SendOkAsync<PagedResult<AppointmentResponse>>(
            HttpMethod.Get, $"/api/businesses/current/appointments/pending?professionalId={business.ProfessionalIds[1]}", null, staff.Token);

        // O filtro pedido (o colega) é ignorado: vale sempre o próprio.
        foreach (PagedResult<AppointmentResponse> page in new[] { agenda, pending })
        {
            AppointmentResponse only = Assert.Single(page.Items);
            Assert.Equal(own.Id, only.Id);
            Assert.Equal("Consumidora da Minha Agenda", only.CustomerName);
            Assert.DoesNotContain(page.Items, a => a.CustomerName == "Consumidor do Colega");
        }

        // Agendamento do colega: inexistente para ele.
        using HttpResponseMessage response = await _world.SendAsync(
            HttpMethod.Post, $"/api/businesses/current/appointments/{colleague.Id}/confirm", null, staff.Token);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
