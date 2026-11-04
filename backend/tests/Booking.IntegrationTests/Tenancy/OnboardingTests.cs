using System.Net;
using Booking.Arguments.Module.Identity;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Tenancy;

/// <summary>
/// Cadastro do estabelecimento (Fase 3): publicar na hora (Beleza) × análise (Saúde), checklist, termos, responsável de
/// Saúde, motivo de suspensão e o limite por conta. ESCRITOS SEM DOCKER: ainda não foram rodados (docs/verificacao-pendente.md).
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class OnboardingTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private static string SearchPath(TestLocation here, string term) =>
        $"/api/businesses/search?latitude={here.Latitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}" +
        $"&longitude={here.Longitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}&radiusKm=1&term={Uri.EscapeDataString(term)}";

    [Fact]
    public async Task P1_owner_publishes_a_beauty_business_straight_to_active_and_it_shows_in_search()
    {
        TestUser anyone = await _world.NewCustomerAsync();
        TestLocation here = TestLocation.Isolated();
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], location: here, submit: false);

        // Rascunho não aparece na busca.
        Assert.Equal(0, (await _world.SendOkAsync<PagedResult<BusinessSearchItemResponse>>(
            HttpMethod.Get, SearchPath(here, business.Name), null, anyone.Token)).TotalCount);

        BusinessDetailResponse published = await _world.SendOkAsync<BusinessDetailResponse>(
            HttpMethod.Post, "/api/businesses/current/publish", null, business.OwnerToken);

        Assert.Equal("Active", published.Status);
        Assert.Equal(1, (await _world.SendOkAsync<PagedResult<BusinessSearchItemResponse>>(
            HttpMethod.Get, SearchPath(here, business.Name), null, anyone.Token)).TotalCount);
    }

    [Fact]
    public async Task P2_health_cannot_be_published_directly_and_stays_invisible_until_the_admin_approves()
    {
        TestUser anyone = await _world.NewCustomerAsync();
        TestLocation here = TestLocation.Isolated();
        TestBusiness clinic = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], category: "Saude", location: here, submit: false);

        using (HttpResponseMessage refused = await _world.SendAsync(HttpMethod.Post, "/api/businesses/current/publish", null, clinic.OwnerToken))
        {
            Assert.Equal(HttpStatusCode.Conflict, refused.StatusCode);
            Assert.Equal("business.requires_review", await TestWorld.ErrorCodeAsync(refused));
        }

        // Enviada para análise: o dono já pode configurar, mas nada fica público nem agendável.
        BusinessDetailResponse submitted = await _world.SendOkAsync<BusinessDetailResponse>(
            HttpMethod.Post, "/api/businesses/current/submit", null, clinic.OwnerToken);
        Assert.Equal("PendingReview", submitted.Status);
        Assert.Equal(0, (await _world.SendOkAsync<PagedResult<BusinessSearchItemResponse>>(
            HttpMethod.Get, SearchPath(here, clinic.Name), null, anyone.Token)).TotalCount);
        using (HttpResponseMessage showcase = await _world.SendAsync(HttpMethod.Get, $"/api/businesses/{clinic.Id}", null, null))
        {
            Assert.Equal(HttpStatusCode.NotFound, showcase.StatusCode);
        }

        TestUser admin = await _world.NewAdminAsync();
        await _world.SendOkAsync(HttpMethod.Post, $"/api/admin/businesses/{clinic.Id}/approve", new AdminDecisionRequest("Registro conferido"), admin.Token);

        Assert.Equal(1, (await _world.SendOkAsync<PagedResult<BusinessSearchItemResponse>>(
            HttpMethod.Get, SearchPath(here, clinic.Name), null, anyone.Token)).TotalCount);
    }

    [Fact]
    public async Task P3_a_non_owner_cannot_publish_or_accept_terms_or_set_the_responsible()
    {
        TestUser customer = await _world.NewCustomerAsync();

        foreach ((HttpMethod method, string path, object? body) in new (HttpMethod, string, object?)[]
        {
            (HttpMethod.Post, "/api/businesses/current/publish", null),
            (HttpMethod.Post, "/api/businesses/current/terms", new AcceptTermsRequest("2026-11")),
            (HttpMethod.Put, "/api/businesses/current/responsible", new SetResponsibleRequest("Ana", "Crm", "1", "SP")),
        })
        {
            using HttpResponseMessage response = await _world.SendAsync(method, path, body, customer.Token);
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
    }

    [Fact]
    public async Task P4_the_server_refuses_to_publish_or_submit_without_terms_and_the_checklist_says_what_is_missing()
    {
        TestUser owner = await _world.NewUserAsync("Dono sem termos");
        BusinessResponse business = await _world.SendOkAsync<BusinessResponse>(
            HttpMethod.Post, "/api/businesses", new RegisterBusinessRequest($"Novo {Guid.NewGuid():N}"[..30], Cnpj.Random(), "Beleza"), owner.Token);
        ContextTokenResponse context = await _world.SendOkAsync<ContextTokenResponse>(
            HttpMethod.Post, "/api/users/me/context", new SwitchContextRequest(business.Id), owner.Token);

        using HttpResponseMessage refused = await _world.SendAsync(HttpMethod.Post, "/api/businesses/current/publish", null, context.AccessToken);

        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        Assert.Equal("business.activation_checklist_incomplete", await TestWorld.ErrorCodeAsync(refused));
    }

    [Fact]
    public async Task P5_health_checklist_asks_for_the_responsible_and_only_the_admin_reads_it()
    {
        TestBusiness clinic = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], category: "Saude", approve: false);
        TestUser admin = await _world.NewAdminAsync();

        AdminBusinessDetailResponse detail = await _world.SendOkAsync<AdminBusinessDetailResponse>(
            HttpMethod.Get, $"/api/admin/businesses/{clinic.Id}", null, admin.Token);

        Assert.Contains(detail.Checklist, item => item.Key == "responsible" && item.Done);
        Assert.Contains(detail.Checklist, item => item.Key == "terms" && item.Done);
        Assert.NotNull(detail.Responsible);
        Assert.Equal("Crm", detail.Responsible!.Council);
        Assert.Equal("SP", detail.Responsible.CouncilState);

        // O dono vê só que informou, nunca o registro; o público não vê nem isso.
        BusinessDetailResponse mine = await _world.SendOkAsync<BusinessDetailResponse>(
            HttpMethod.Get, "/api/businesses/current", null, clinic.OwnerToken);
        Assert.True(mine.ResponsibleInformed);
        Assert.True(mine.TermsAccepted);
    }

    [Fact]
    public async Task P6_suspension_requires_a_reason_and_the_owner_reads_it_while_suspended()
    {
        TestUser admin = await _world.NewAdminAsync();
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);

        using (HttpResponseMessage refused = await _world.SendAsync(
            HttpMethod.Post, $"/api/admin/businesses/{business.Id}/suspend", new AdminDecisionRequest("  "), admin.Token))
        {
            Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
            Assert.Equal("business.suspension_requires_reason", await TestWorld.ErrorCodeAsync(refused));
        }

        AdminBusinessDetailResponse suspended = await _world.SendOkAsync<AdminBusinessDetailResponse>(
            HttpMethod.Post, $"/api/admin/businesses/{business.Id}/suspend", new AdminDecisionRequest("Denúncia procedente"), admin.Token);

        Assert.Equal("Suspended", suspended.Business.Status);
        Assert.Equal("Denúncia procedente", suspended.SuspensionReason);
        Assert.Equal(admin.UserId, suspended.SuspendedByUserId);
        Assert.NotNull(suspended.SuspendedAt);

        BusinessDetailResponse mine = await _world.SendOkAsync<BusinessDetailResponse>(
            HttpMethod.Get, "/api/businesses/current", null, business.OwnerToken);
        Assert.Equal("Denúncia procedente", mine.StatusReason);
    }

    [Fact]
    public async Task P8_the_owner_reads_the_checklist_and_a_non_owner_does_not()
    {
        TestBusiness draft = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], submit: false);
        TestUser customer = await _world.NewCustomerAsync();

        ChecklistItemResponse[] items = await _world.SendOkAsync<ChecklistItemResponse[]>(
            HttpMethod.Get, "/api/businesses/current/checklist", null, draft.OwnerToken);

        Assert.Contains(items, i => i.Key == "terms" && i.Done);
        Assert.Contains(items, i => i.Key == "location_confirmed" && i.Done);
        Assert.DoesNotContain(items, i => i.Key == "responsible"); // Beleza não tem este item

        using HttpResponseMessage refused = await _world.SendAsync(HttpMethod.Get, "/api/businesses/current/checklist", null, customer.Token);
        Assert.Equal(HttpStatusCode.Forbidden, refused.StatusCode);
    }

    [Fact]
    public async Task P7_an_account_cannot_own_more_than_three_businesses()
    {
        TestUser owner = await _world.NewUserAsync("Dono de muitos");

        for (int i = 0; i < 3; i++)
        {
            await _world.SendOkAsync<BusinessResponse>(
                HttpMethod.Post, "/api/businesses", new RegisterBusinessRequest($"Loja {i} {Guid.NewGuid():N}"[..30], Cnpj.Random(), "Beleza"), owner.Token);
        }

        using HttpResponseMessage fourth = await _world.SendAsync(
            HttpMethod.Post, "/api/businesses", new RegisterBusinessRequest($"Loja 4 {Guid.NewGuid():N}"[..30], Cnpj.Random(), "Beleza"), owner.Token);

        Assert.Equal(HttpStatusCode.Conflict, fourth.StatusCode);
        Assert.Equal("business.account_limit_reached", await TestWorld.ErrorCodeAsync(fourth));
    }
}
