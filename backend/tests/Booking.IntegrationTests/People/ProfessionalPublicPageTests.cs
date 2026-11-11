using System.Net;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.People;

/// <summary>
/// Página pública do profissional, pedido de remoção e "Sair do estabelecimento" (ADR-031).
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class ProfessionalPublicPageTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    [Fact]
    public async Task Q1_the_page_is_public_and_shows_the_active_professional_with_the_business_and_services()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        Guid professionalId = business.ProfessionalIds[0];

        ProfessionalPageResponse page = await _world.SendOkAsync<ProfessionalPageResponse>(
            HttpMethod.Get, $"/api/professionals/{professionalId}", null, null!);

        Assert.Equal(professionalId, page.Id);
        Assert.Equal(business.Id, page.Business.Id);
        Assert.NotEmpty(page.Services);
    }

    [Fact]
    public async Task Q2_an_inactive_professional_or_a_business_not_in_the_showcase_answers_404()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestBusiness draft = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], approve: false);
        Guid professionalId = business.ProfessionalIds[0];

        await _world.SendOkAsync<ProfessionalResponse>(
            HttpMethod.Put, $"/api/businesses/current/professionals/{professionalId}",
            new UpdateProfessionalRequest("Profissional 1", null, null, IsActive: false), business.OwnerToken);

        foreach (Guid id in new[] { professionalId, draft.ProfessionalIds[0], Guid.NewGuid() })
        {
            using HttpResponseMessage response = await _world.SendAsync(HttpMethod.Get, $"/api/professionals/{id}", null, null);
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }

    [Fact]
    public async Task Q3_a_removal_request_needs_no_login_is_queued_for_the_admin_and_does_not_remove_anything()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        Guid professionalId = business.ProfessionalIds[0];
        TestUser admin = await _world.NewAdminAsync();

        using (HttpResponseMessage sent = await _world.SendAsync(
            HttpMethod.Post, $"/api/professionals/{professionalId}/removal-requests",
            new RequestProfessionalRemovalRequest("Não autorizei a foto.", "ana@example.com"), null))
        {
            Assert.Equal(HttpStatusCode.NoContent, sent.StatusCode);
        }

        using (HttpResponseMessage tooShort = await _world.SendAsync(
            HttpMethod.Post, $"/api/professionals/{professionalId}/removal-requests", new RequestProfessionalRemovalRequest("curt", null), null))
        {
            Assert.Equal(HttpStatusCode.BadRequest, tooShort.StatusCode);
            Assert.Equal("removal_request.reason_invalid", await TestWorld.ErrorCodeAsync(tooShort));
        }

        PagedResult<ProfessionalRemovalResponse> queue = await _world.SendOkAsync<PagedResult<ProfessionalRemovalResponse>>(
            HttpMethod.Get, "/api/admin/professional-removals", null, admin.Token);
        ProfessionalRemovalResponse mine = Assert.Single(queue.Items, x => x.ProfessionalId == professionalId);
        Assert.Equal("Open", mine.Status);

        // Nada some sozinho: o perfil segue na vitrine até o dono desativar.
        using HttpResponseMessage page = await _world.SendAsync(HttpMethod.Get, $"/api/professionals/{professionalId}", null, null);
        Assert.Equal(HttpStatusCode.OK, page.StatusCode);

        ProfessionalRemovalResponse resolved = await _world.SendOkAsync<ProfessionalRemovalResponse>(
            HttpMethod.Post, $"/api/admin/professional-removals/{mine.Id}/resolve", new ResolveProfessionalRemovalRequest("Falei com o dono."), admin.Token);
        Assert.Equal("Resolved", resolved.Status);
    }

    [Fact]
    public async Task Q4_the_removal_queue_is_only_for_the_platform_admin()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestUser customer = await _world.NewCustomerAsync();

        foreach (string? token in new[] { business.OwnerToken, customer.Token })
        {
            using HttpResponseMessage response = await _world.SendAsync(HttpMethod.Get, "/api/admin/professional-removals", null, token);
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        using HttpResponseMessage anonymous = await _world.SendAsync(HttpMethod.Get, "/api/admin/professional-removals", null, null);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
    }

    [Fact]
    public async Task Q5_leaving_the_business_takes_the_profile_off_the_showcase_at_once_and_keeps_the_history()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestUser staff = await _world.NewStaffAsync(business, professionalIndex: 0);
        Guid professionalId = business.ProfessionalIds[0];

        using (HttpResponseMessage left = await _world.SendAsync(HttpMethod.Post, "/api/businesses/current/leave", null, staff.Token))
        {
            Assert.Equal(HttpStatusCode.NoContent, left.StatusCode);
        }

        using (HttpResponseMessage page = await _world.SendAsync(HttpMethod.Get, $"/api/professionals/{professionalId}", null, null))
        {
            Assert.Equal(HttpStatusCode.NotFound, page.StatusCode);
        }

        // O vínculo ficou como removido (histórico), não foi apagado.
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM tenancy.business_membership WHERE user_id = @u AND status = 'Removed'", ("u", staff.UserId)));

        // O dono não sai.
        using HttpResponseMessage owner = await _world.SendAsync(HttpMethod.Post, "/api/businesses/current/leave", null, business.OwnerToken);
        Assert.Equal(HttpStatusCode.Conflict, owner.StatusCode);
    }
}
