using System.Net;
using Booking.Arguments.Module.Notifications;
using Booking.Arguments.Module.Scheduling;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Notifications;

/// <summary>
/// O sino do aplicativo, contra o banco real: o aviso nasce junto com o e-mail, cada lado lê só o seu, e ler é só do dono.
/// Agendamento e confirmação passam pela API, como na tela.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class BellTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private Task<PagedResult<NotificationResponse>> ListAsync(string token, string query = "") =>
        _world.SendOkAsync<PagedResult<NotificationResponse>>(HttpMethod.Get, $"/api/notifications{query}", null, token);

    private async Task<int> UnreadAsync(string token) =>
        (await _world.SendOkAsync<UnreadCountResponse>(HttpMethod.Get, "/api/notifications/unread-count", null, token)).Count;

    [Fact]
    public async Task N1_a_new_pending_request_rings_the_business_side_and_not_the_customer()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestUser customer = await _world.NewCustomerAsync();

        await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));

        PagedResult<NotificationResponse> owner = await ListAsync(business.OwnerToken);
        NotificationResponse n = Assert.Single(owner.Items);
        Assert.Equal("RequestReceived", n.Type);
        Assert.Null(n.ReadAt);
        Assert.NotNull(n.AppointmentId);
        Assert.Equal(1, await UnreadAsync(business.OwnerToken));

        // O consumidor ainda não tem nada: o pedido está pendente, quem precisa agir é o estabelecimento.
        Assert.Empty((await ListAsync(customer.Token)).Items);
        Assert.Equal(0, await UnreadAsync(customer.Token));
    }

    [Fact]
    public async Task N2_confirming_rings_the_customer_and_the_two_sides_stay_separate()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestUser customer = await _world.NewCustomerAsync();
        AppointmentResponse appointment = await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));

        await _world.SendOkAsync(HttpMethod.Post, $"/api/businesses/current/appointments/{appointment.Id}/confirm", null, business.OwnerToken);

        NotificationResponse mine = Assert.Single((await ListAsync(customer.Token)).Items);
        Assert.Equal("Confirmed", mine.Type);
        Assert.Equal(appointment.Id, mine.AppointmentId);

        // O painel só vê o pedido recebido, nunca o aviso de confirmação do consumidor.
        Assert.DoesNotContain((await ListAsync(business.OwnerToken)).Items, x => x.Type == "Confirmed");
    }

    [Fact]
    public async Task N3_marking_one_read_lowers_the_counter_and_reading_again_changes_nothing()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestUser customer = await _world.NewCustomerAsync();
        await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));
        NotificationResponse n = Assert.Single((await ListAsync(business.OwnerToken)).Items);

        NotificationResponse first = await _world.SendOkAsync<NotificationResponse>(HttpMethod.Post, $"/api/notifications/{n.Id}/read", null, business.OwnerToken);
        NotificationResponse second = await _world.SendOkAsync<NotificationResponse>(HttpMethod.Post, $"/api/notifications/{n.Id}/read", null, business.OwnerToken);

        Assert.NotNull(first.ReadAt);
        // O banco guarda microssegundos; a primeira resposta ainda traz o relógio inteiro.
        Assert.True(Math.Abs((second.ReadAt!.Value - first.ReadAt!.Value).TotalMilliseconds) < 1);
        Assert.Equal(0, await UnreadAsync(business.OwnerToken));
    }

    [Fact]
    public async Task N4_mark_all_read_only_touches_the_callers_side()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestUser customer = await _world.NewCustomerAsync();
        AppointmentResponse a1 = await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));
        await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(14));
        await _world.SendOkAsync(HttpMethod.Post, $"/api/businesses/current/appointments/{a1.Id}/confirm", null, business.OwnerToken);

        Assert.Equal(2, await UnreadAsync(business.OwnerToken));
        Assert.Equal(1, await UnreadAsync(customer.Token));

        UnreadCountResponse changed = await _world.SendOkAsync<UnreadCountResponse>(HttpMethod.Post, "/api/notifications/read-all", null, business.OwnerToken);

        Assert.Equal(2, changed.Count);
        Assert.Equal(0, await UnreadAsync(business.OwnerToken));
        Assert.Equal(1, await UnreadAsync(customer.Token));
    }

    [Fact]
    public async Task N5_someone_elses_notification_is_not_found_and_stays_unread()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestUser customer = await _world.NewCustomerAsync();
        TestUser stranger = await _world.NewCustomerAsync();
        await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));
        NotificationResponse n = Assert.Single((await ListAsync(business.OwnerToken)).Items);

        using HttpResponseMessage other = await _world.SendAsync(HttpMethod.Post, $"/api/notifications/{n.Id}/read", null, stranger.Token);
        using HttpResponseMessage wrongSide = await _world.SendAsync(HttpMethod.Post, $"/api/notifications/{n.Id}/read", null, customer.Token);

        Assert.Equal(HttpStatusCode.NotFound, other.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, wrongSide.StatusCode);
        Assert.Equal(1, await UnreadAsync(business.OwnerToken));
    }

    [Fact]
    public async Task N6_the_bell_requires_a_signed_in_user()
    {
        using HttpResponseMessage list = await _world.SendAsync(HttpMethod.Get, "/api/notifications", null, null);
        using HttpResponseMessage count = await _world.SendAsync(HttpMethod.Get, "/api/notifications/unread-count", null, null);

        Assert.Equal(HttpStatusCode.Unauthorized, list.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, count.StatusCode);
    }

    [Fact]
    public async Task N7_the_list_is_paged_newest_first()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestUser customer = await _world.NewCustomerAsync();
        await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(9));
        await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(11));
        await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(15));

        PagedResult<NotificationResponse> page = await ListAsync(business.OwnerToken, "?page=1&pageSize=2");

        Assert.Equal(3, page.TotalCount);
        Assert.Equal(2, page.Items.Count);
        Assert.True(page.Items[0].CreatedAt >= page.Items[1].CreatedAt);
    }
}
