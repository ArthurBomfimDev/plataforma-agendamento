using System.Net;
using System.Text.RegularExpressions;
using Booking.Arguments.Module.Tenancy;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Tenancy;

/// <summary>
/// Convite de equipe (Fase 4, bloco 1): do e-mail ao aceite, e as recusas de segurança. ESCRITOS SEM DOCKER: ainda não
/// foram rodados (docs/verificacao-pendente.md).
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed partial class InvitationTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    [GeneratedRegex(@"convite\?token=([^\s""&<]+)")]
    private static partial Regex TokenInLink();

    private static string UniqueEmail() => $"convidado.{Guid.NewGuid():N}@example.com";

    private async Task<string> InviteAndReadTokenAsync(TestBusiness business, string email, string role)
    {
        await _world.SendOkAsync<InvitationResponse>(
            HttpMethod.Post, "/api/businesses/current/invitations", new InviteMemberRequest("Convidado", email, role), business.OwnerToken);
        await _world.DispatchAllAsync();

        string body = _world.Emails.To(email).Last().TextBody;
        return Uri.UnescapeDataString(TokenInLink().Match(body).Groups[1].Value);
    }

    [Fact]
    public async Task I1_the_owner_invites_by_email_and_the_person_accepts_creating_an_account()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        string email = UniqueEmail();

        string token = await InviteAndReadTokenAsync(business, email, "Attendant");

        InvitationPreviewResponse preview = await _world.SendOkAsync<InvitationPreviewResponse>(
            HttpMethod.Post, "/api/invitations/preview", new InvitationTokenRequest(token), null!);
        Assert.Equal(email, preview.Email);
        Assert.False(preview.AccountExists);

        AcceptedInvitationResponse accepted = await _world.SendOkAsync<AcceptedInvitationResponse>(
            HttpMethod.Post, "/api/invitations/accept-new-account",
            new AcceptInvitationNewAccountRequest(token, "Nova Atendente", "senha-correta-123", AcceptTerms: false), null!);

        Assert.Equal(business.Id, accepted.BusinessId);
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM tenancy.business_membership WHERE business_id = @b AND role = 'Attendant' AND status = 'Active'",
            ("b", business.Id)));
    }

    [Fact]
    public async Task I2_a_used_token_is_refused_and_an_unknown_token_is_not_found()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        string token = await InviteAndReadTokenAsync(business, UniqueEmail(), "Attendant");
        await _world.SendOkAsync<AcceptedInvitationResponse>(
            HttpMethod.Post, "/api/invitations/accept-new-account",
            new AcceptInvitationNewAccountRequest(token, "Nova", "senha-correta-123", false), null!);

        using HttpResponseMessage reused = await _world.SendAsync(
            HttpMethod.Post, "/api/invitations/preview", new InvitationTokenRequest(token), null);
        Assert.Equal(HttpStatusCode.Conflict, reused.StatusCode);
        Assert.Equal("invitation.already_used", await TestWorld.ErrorCodeAsync(reused));

        using HttpResponseMessage unknown = await _world.SendAsync(
            HttpMethod.Post, "/api/invitations/preview", new InvitationTokenRequest("token-que-nao-existe"), null);
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
    }

    [Fact]
    public async Task I3_only_the_owner_invites_resends_and_revokes()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser professional = await _world.NewStaffAsync(business, 0);
        TestUser customer = await _world.NewCustomerAsync();
        InvitationResponse created = await _world.SendOkAsync<InvitationResponse>(
            HttpMethod.Post, "/api/businesses/current/invitations", new InviteMemberRequest("Convidado", UniqueEmail(), "Attendant"), business.OwnerToken);

        foreach (string? token in new[] { professional.Token, customer.Token })
        {
            foreach ((HttpMethod method, string path, object? body) in new (HttpMethod, string, object?)[]
            {
                (HttpMethod.Post, "/api/businesses/current/invitations", new InviteMemberRequest("X", UniqueEmail(), "Attendant")),
                (HttpMethod.Post, $"/api/businesses/current/invitations/{created.Id}/resend", null),
                (HttpMethod.Delete, $"/api/businesses/current/invitations/{created.Id}", null),
                (HttpMethod.Get, "/api/businesses/current/invitations", null),
                (HttpMethod.Get, "/api/businesses/current/seats", null),
            })
            {
                using HttpResponseMessage response = await _world.SendAsync(method, path, body, token);
                Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
            }
        }

        using HttpResponseMessage anonymous = await _world.SendAsync(HttpMethod.Get, "/api/businesses/current/invitations", null, null);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
    }

    [Fact]
    public async Task I4_the_owner_of_another_business_cannot_revoke_or_resend_this_invitation()
    {
        TestBusiness mine = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestBusiness other = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        InvitationResponse created = await _world.SendOkAsync<InvitationResponse>(
            HttpMethod.Post, "/api/businesses/current/invitations", new InviteMemberRequest("Convidado", UniqueEmail(), "Attendant"), mine.OwnerToken);

        using HttpResponseMessage revoke = await _world.SendAsync(
            HttpMethod.Delete, $"/api/businesses/current/invitations/{created.Id}", null, other.OwnerToken);
        using HttpResponseMessage resend = await _world.SendAsync(
            HttpMethod.Post, $"/api/businesses/current/invitations/{created.Id}/resend", null, other.OwnerToken);

        Assert.Equal(HttpStatusCode.NotFound, revoke.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, resend.StatusCode);
    }

    [Fact]
    public async Task I5_a_revoked_invitation_cannot_be_accepted_and_the_seat_count_follows()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        string email = UniqueEmail();
        string token = await InviteAndReadTokenAsync(business, email, "Attendant");
        SeatsResponse before = await _world.SendOkAsync<SeatsResponse>(HttpMethod.Get, "/api/businesses/current/seats", null, business.OwnerToken);

        PagedPending pending = new(await _world.SendOkAsync<Booking.Domain.Entity.Base.PagedResult<InvitationResponse>>(
            HttpMethod.Get, "/api/businesses/current/invitations", null, business.OwnerToken));
        await _world.SendOkAsync(HttpMethod.Delete, $"/api/businesses/current/invitations/{pending.Single(email).Id}", null, business.OwnerToken);

        SeatsResponse after = await _world.SendOkAsync<SeatsResponse>(HttpMethod.Get, "/api/businesses/current/seats", null, business.OwnerToken);
        Assert.Equal(before.Used - 1, after.Used);

        using HttpResponseMessage refused = await _world.SendAsync(
            HttpMethod.Post, "/api/invitations/accept-new-account",
            new AcceptInvitationNewAccountRequest(token, "Nova", "senha-correta-123", false), null);
        Assert.Equal(HttpStatusCode.Gone, refused.StatusCode);
        Assert.Equal("invitation.revoked", await TestWorld.ErrorCodeAsync(refused));
    }

    private sealed record PagedPending(Booking.Domain.Entity.Base.PagedResult<InvitationResponse> Page)
    {
        public InvitationResponse Single(string email) => Page.Items.Single(x => x.Email == email);
    }
}
