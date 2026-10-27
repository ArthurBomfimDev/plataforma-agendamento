using System.Net;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;
using Xunit.Abstractions;

namespace Booking.IntegrationTests.Tenancy;

/// <summary>
/// Admin da plataforma (ADR-020): a fila de análise e as decisões sobre um estabelecimento. A metade de recusa
/// (403 para quem não é Admin) é o par que prova que a policy vale.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class AdminBusinessTests(IntegrationFixture fixture, ITestOutputHelper output)
{
    private readonly TestWorld _world = new(fixture);

    [Fact]
    public async Task E1_admin_lists_pending_and_approves_with_the_record_of_who_decided()
    {
        TestUser admin = await _world.NewAdminAsync();
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], approve: false);

        PagedResult<BusinessResponse> pending = await _world.SendOkAsync<PagedResult<BusinessResponse>>(
            HttpMethod.Get, "/api/admin/businesses?pageSize=100", null, admin.Token);
        Assert.Contains(pending.Items, b => b.Id == business.Id && b.Status == "PendingReview");

        AdminBusinessDetailResponse approved = await _world.SendOkAsync<AdminBusinessDetailResponse>(
            HttpMethod.Post, $"/api/admin/businesses/{business.Id}/approve", new AdminDecisionRequest("Documentos conferidos"), admin.Token);

        Assert.Equal("Active", approved.Business.Status);
        Assert.Equal("Verified", approved.Business.VerificationLevel);
        Assert.Equal(admin.UserId, approved.VerifiedByUserId);
        Assert.Equal("Documentos conferidos", approved.VerificationNote);
        Assert.NotNull(approved.VerifiedAt);

        // Aprovado, aparece na vitrine pública.
        using HttpResponseMessage publicPage = await _world.SendAsync(HttpMethod.Get, $"/api/businesses/{business.Id}", null, null);
        Assert.Equal(HttpStatusCode.OK, publicPage.StatusCode);
    }

    [Fact]
    public async Task E2_reject_without_note_is_refused_and_nothing_changes()
    {
        TestUser admin = await _world.NewAdminAsync();
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], approve: false);

        foreach (string? note in new[] { null, "   " })
        {
            using HttpResponseMessage response = await _world.SendAsync(
                HttpMethod.Post, $"/api/admin/businesses/{business.Id}/reject", new AdminDecisionRequest(note), admin.Token);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal("business.verification_rejection_requires_note", await TestWorld.ErrorCodeAsync(response));
        }

        AdminBusinessDetailResponse detail = await _world.SendOkAsync<AdminBusinessDetailResponse>(
            HttpMethod.Get, $"/api/admin/businesses/{business.Id}", null, admin.Token);
        Assert.Equal("PendingReview", detail.Business.Status);
        Assert.Null(detail.VerifiedByUserId);
    }

    [Fact]
    public async Task E3_reject_with_note_returns_to_draft_and_keeps_the_reason()
    {
        TestUser admin = await _world.NewAdminAsync();
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], approve: false);

        AdminBusinessDetailResponse rejected = await _world.SendOkAsync<AdminBusinessDetailResponse>(
            HttpMethod.Post, $"/api/admin/businesses/{business.Id}/reject", new AdminDecisionRequest("Foto da fachada ilegível"), admin.Token);

        Assert.Equal("Draft", rejected.Business.Status);
        Assert.Equal("Rejected", rejected.Business.VerificationLevel);
        Assert.Equal("Foto da fachada ilegível", rejected.VerificationNote);
        Assert.Equal(admin.UserId, rejected.VerifiedByUserId);

        // Em rascunho, o dono pode corrigir e reenviar.
        await _world.SendOkAsync(HttpMethod.Post, "/api/businesses/current/submit", null, business.OwnerToken);
    }

    [Fact]
    public async Task E4_suspended_business_leaves_search_and_showcase_and_reinstate_brings_it_back()
    {
        TestUser admin = await _world.NewAdminAsync();
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        string search = $"/api/businesses/search?latitude=-22.2125&longitude=-49.6564&radiusKm=1&term={Uri.EscapeDataString(business.Name)}";

        Assert.Equal(1, (await _world.SendOkAsync<PagedResult<BusinessSearchItemResponse>>(HttpMethod.Get, search, null, admin.Token)).TotalCount);

        await _world.SendOkAsync(HttpMethod.Post, $"/api/admin/businesses/{business.Id}/suspend", null, admin.Token);

        Assert.Equal(0, (await _world.SendOkAsync<PagedResult<BusinessSearchItemResponse>>(HttpMethod.Get, search, null, admin.Token)).TotalCount);
        using (HttpResponseMessage showcase = await _world.SendAsync(HttpMethod.Get, $"/api/businesses/{business.Id}", null, null))
        {
            Assert.Equal(HttpStatusCode.NotFound, showcase.StatusCode);
        }

        // Suspenso não recebe pedido.
        TestUser customer = await _world.NewCustomerAsync();
        using (HttpResponseMessage booking = await _world.Client.SendAsync(
            _world.RequestAppointment(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10))))
        {
            Assert.Equal(HttpStatusCode.NotFound, booking.StatusCode);
        }

        AdminBusinessDetailResponse reinstated = await _world.SendOkAsync<AdminBusinessDetailResponse>(
            HttpMethod.Post, $"/api/admin/businesses/{business.Id}/reinstate", null, admin.Token);

        Assert.Equal("Active", reinstated.Business.Status);
        Assert.Equal(1, (await _world.SendOkAsync<PagedResult<BusinessSearchItemResponse>>(HttpMethod.Get, search, null, admin.Token)).TotalCount);
    }

    [Fact]
    public async Task E5_detail_shows_the_checklist_including_what_the_code_does_not_check()
    {
        TestUser admin = await _world.NewAdminAsync();
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], approve: false);

        AdminBusinessDetailResponse detail = await _world.SendOkAsync<AdminBusinessDetailResponse>(
            HttpMethod.Get, $"/api/admin/businesses/{business.Id}", null, admin.Token);

        output.WriteLine("E5: " + string.Join("; ", detail.Checklist.Select(i => $"{i.Key} feito={i.Done} exigido={i.RequiredForSubmit}")));

        Assert.All(detail.Checklist.Where(i => i.RequiredForSubmit), i => Assert.True(i.Done, i.Key));
        Assert.Contains(detail.Checklist, i => i.Key == "address" && i.Done && !i.RequiredForSubmit);
        Assert.Contains(detail.Checklist, i => i.Key == "photo" && !i.Done && !i.RequiredForSubmit);
    }

    [Fact]
    public async Task E6_consumer_owner_and_anonymous_are_refused_on_every_admin_route()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], approve: false);
        TestUser customer = await _world.NewCustomerAsync();
        string path = $"/api/admin/businesses/{business.Id}";

        (HttpMethod Method, string Path, object? Body)[] routes =
        [
            (HttpMethod.Get, "/api/admin/businesses", null),
            (HttpMethod.Get, path, null),
            (HttpMethod.Post, $"{path}/approve", new AdminDecisionRequest("tentativa")),
            (HttpMethod.Post, $"{path}/reject", new AdminDecisionRequest("tentativa")),
            (HttpMethod.Post, $"{path}/suspend", null),
            (HttpMethod.Post, $"{path}/reinstate", null),
        ];

        var results = new List<string>();
        foreach ((string who, string? token, HttpStatusCode expected) in new[]
        {
            ("consumidor", customer.Token, HttpStatusCode.Forbidden),
            ("dono", business.OwnerToken, HttpStatusCode.Forbidden),
            ("anônimo", (string?)null, HttpStatusCode.Unauthorized),
        })
        {
            foreach ((HttpMethod method, string route, object? body) in routes)
            {
                using HttpResponseMessage response = await _world.SendAsync(method, route, body, token);
                results.Add($"{who} {method} {route.Replace(business.Id.ToString(), "{id}")} → {(int)response.StatusCode}");
                Assert.Equal(expected, response.StatusCode);
            }
        }

        output.WriteLine("E6:" + Environment.NewLine + string.Join(Environment.NewLine, results));

        // Nada mudou: o dono não aprovou o próprio estabelecimento.
        TestUser admin = await _world.NewAdminAsync();
        AdminBusinessDetailResponse detail = await _world.SendOkAsync<AdminBusinessDetailResponse>(HttpMethod.Get, path, null, admin.Token);
        Assert.Equal("PendingReview", detail.Business.Status);
    }
}
