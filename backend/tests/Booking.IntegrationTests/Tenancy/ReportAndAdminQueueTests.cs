using System.Net;
using Booking.Application.Contracts.Notifications;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Tenancy;

/// <summary>
/// Denúncia na página pública, fila do Admin, filtro por categoria e os e-mails de status ao dono (Fase 3).
/// A denúncia é limitada a 5 por hora por IP, e todo pedido de teste vem do mesmo IP: cada teste denuncia pela própria API.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class ReportAndAdminQueueTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private static Task<HttpResponseMessage> ReportAsync(HttpClient client, Guid businessId, string reason, string? token) =>
        client.SendAsync(TestWorld.Build(HttpMethod.Post, $"/api/businesses/{businessId}/reports", new ReportBusinessRequest(reason), token));

    [Fact]
    public async Task R1_anyone_can_report_an_active_business_and_only_the_admin_reads_the_queue()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser admin = await _world.NewAdminAsync();
        TestUser customer = await _world.NewCustomerAsync();
        await using BookingApiFactory api = fixture.NewApi();
        using HttpClient client = api.CreateClient();

        // Sem login.
        using (HttpResponseMessage anonymous = await ReportAsync(client, business.Id, "Fotos de outra empresa.", null))
        {
            Assert.Equal(HttpStatusCode.NoContent, anonymous.StatusCode);
        }

        // Logado.
        using (HttpResponseMessage signedIn = await ReportAsync(client, business.Id, "Endereço falso.", customer.Token))
        {
            Assert.Equal(HttpStatusCode.NoContent, signedIn.StatusCode);
        }

        PagedResult<BusinessReportResponse> queue = await _world.SendOkAsync<PagedResult<BusinessReportResponse>>(
            HttpMethod.Get, "/api/admin/businesses/reports?pageSize=100", null, admin.Token);

        BusinessReportResponse[] mine = [.. queue.Items.Where(r => r.BusinessId == business.Id)];
        Assert.Equal(2, mine.Length);
        Assert.Contains(mine, r => r.ReporterUserId is null && r.Reason == "Fotos de outra empresa.");
        Assert.Contains(mine, r => r.ReporterUserId == customer.UserId && r.Reason == "Endereço falso.");
        Assert.All(mine, r => Assert.Equal("Open", r.Status));

        // Quem não é Admin não lê a fila.
        foreach (string? token in new[] { customer.Token, business.OwnerToken, null })
        {
            using HttpResponseMessage refused = await _world.SendAsync(HttpMethod.Get, "/api/admin/businesses/reports", null, token);
            Assert.Contains(refused.StatusCode, new[] { HttpStatusCode.Forbidden, HttpStatusCode.Unauthorized });
        }
    }

    [Fact]
    public async Task R2_a_draft_or_unknown_business_cannot_be_reported_and_the_reason_is_validated()
    {
        TestBusiness draft = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], submit: false);
        TestBusiness active = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        await using BookingApiFactory api = fixture.NewApi();
        using HttpClient client = api.CreateClient();

        foreach (Guid id in new[] { draft.Id, Guid.NewGuid() })
        {
            using HttpResponseMessage missing = await ReportAsync(client, id, "Conteúdo enganoso.", null);
            Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        }

        using HttpResponseMessage tooShort = await ReportAsync(client, active.Id, "não", null);
        Assert.Equal(HttpStatusCode.BadRequest, tooShort.StatusCode);
        Assert.Equal("report.reason_invalid", await TestWorld.ErrorCodeAsync(tooShort));
    }

    [Fact]
    public async Task R3_the_admin_resolves_a_report_once_and_it_leaves_the_open_queue()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser admin = await _world.NewAdminAsync();
        await using BookingApiFactory api = fixture.NewApi();
        using HttpClient client = api.CreateClient();
        using (HttpResponseMessage reported = await ReportAsync(client, business.Id, "Perfil falso.", null))
        {
            Assert.Equal(HttpStatusCode.NoContent, reported.StatusCode);
        }

        PagedResult<BusinessReportResponse> open = await _world.SendOkAsync<PagedResult<BusinessReportResponse>>(
            HttpMethod.Get, "/api/admin/businesses/reports?pageSize=100", null, admin.Token);
        BusinessReportResponse report = Assert.Single(open.Items, r => r.BusinessId == business.Id);

        BusinessReportResponse resolved = await _world.SendOkAsync<BusinessReportResponse>(
            HttpMethod.Post, $"/api/admin/businesses/reports/{report.Id}/resolve", new AdminDecisionRequest("Sem procedência."), admin.Token);

        Assert.Equal("Resolved", resolved.Status);
        Assert.Equal(admin.UserId, resolved.ResolvedByUserId);
        Assert.Equal("Sem procedência.", resolved.Resolution);

        using HttpResponseMessage again = await _world.SendAsync(
            HttpMethod.Post, $"/api/admin/businesses/reports/{report.Id}/resolve", new AdminDecisionRequest("de novo"), admin.Token);
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);

        PagedResult<BusinessReportResponse> stillOpen = await _world.SendOkAsync<PagedResult<BusinessReportResponse>>(
            HttpMethod.Get, "/api/admin/businesses/reports?pageSize=100", null, admin.Token);
        Assert.DoesNotContain(stillOpen.Items, r => r.Id == report.Id);
    }

    [Fact]
    public async Task R4_the_admin_list_filters_by_status_and_category()
    {
        TestUser admin = await _world.NewAdminAsync();
        TestBusiness beauty = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], approve: false);
        TestBusiness clinic = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], category: "Saude", approve: false);

        PagedResult<BusinessResponse> health = await _world.SendOkAsync<PagedResult<BusinessResponse>>(
            HttpMethod.Get, "/api/admin/businesses?status=PendingReview&category=Saude&pageSize=100", null, admin.Token);

        Assert.Contains(health.Items, b => b.Id == clinic.Id);
        Assert.DoesNotContain(health.Items, b => b.Id == beauty.Id);

        using HttpResponseMessage invalid = await _world.SendAsync(HttpMethod.Get, "/api/admin/businesses?category=Fantasia", null, admin.Token);
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
    }

    [Fact]
    public async Task R5_status_emails_reach_the_owner_with_the_reason_and_health_keeps_the_subject_generic()
    {
        TestUser admin = await _world.NewAdminAsync();
        TestBusiness clinic = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], category: "Saude", approve: false);
        await _world.DispatchAllAsync();

        // Enviada para análise: "recebido".
        Assert.Contains(_world.Emails.To(clinic.OwnerEmail), m => m.Subject.StartsWith("Recebemos o seu cadastro", StringComparison.Ordinal));

        await _world.SendOkAsync(HttpMethod.Post, $"/api/admin/businesses/{clinic.Id}/reject", new AdminDecisionRequest("Registro não confere."), admin.Token);
        await _world.DispatchAllAsync();

        EmailMessage rejected = Assert.Single(_world.Emails.To(clinic.OwnerEmail), m => m.Subject.StartsWith("Seu cadastro precisa de ajustes", StringComparison.Ordinal));
        Assert.Contains("Motivo: Registro não confere.", rejected.TextBody);
        Assert.DoesNotContain(clinic.Name, rejected.Subject);
    }
}
