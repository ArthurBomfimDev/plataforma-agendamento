using System.Net;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using Booking.Application.Module.Notifications.Commands;
using Booking.Arguments.Module.Identity;
using Booking.Arguments.Module.People;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Booking.IntegrationTests.Tenancy;

/// <summary>
/// Rodada de 10/11: a especialidade do convite, o trajeto de quem já tem conta sem e-mail confirmado, e as recusas do
/// convite (expirado, e-mail de outra pessoa). A confirmação de e-mail continua obrigatória no login.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed partial class InvitationJourneyTests(IntegrationFixture fixture)
{
    private const string _password = "senha-de-teste-123";

    private readonly TestWorld _world = new(fixture);

    [GeneratedRegex(@"convite\?token=([^\s""&<]+)")]
    private static partial Regex InviteToken();

    [GeneratedRegex(@"token=([^\s&]+)")]
    private static partial Regex AnyToken();

    private static string UniqueEmail() => $"convidado.{Guid.NewGuid():N}@example.com";

    private async Task<InvitationResponse> InviteAsync(TestBusiness business, string email, string role, string? specialty) =>
        await _world.SendOkAsync<InvitationResponse>(
            HttpMethod.Post, "/api/businesses/current/invitations",
            new InviteMemberRequest("Convidada Silva", email, role, Specialty: specialty), business.OwnerToken);

    private async Task<string> InviteTokenOfAsync(string email)
    {
        await _world.DispatchAllAsync();
        string body = _world.Emails.To(email).Last().TextBody;
        return Uri.UnescapeDataString(InviteToken().Match(body).Groups[1].Value);
    }

    private async Task<IReadOnlyList<ProfessionalResponse>> ProfessionalsAsync(TestBusiness business) =>
        (await _world.SendOkAsync<PagedResult<ProfessionalResponse>>(
            HttpMethod.Get, "/api/businesses/current/professionals?pageSize=50", null, business.OwnerToken)).Items;

    private async Task AcceptNewAsync(string token) =>
        await _world.SendOkAsync<AcceptedInvitationResponse>(
            HttpMethod.Post, "/api/invitations/accept-new-account",
            new AcceptInvitationNewAccountRequest(token, "Convidada Silva", _password, AcceptTerms: true), null!);

    [Fact]
    public async Task J1_accepting_creates_the_profile_with_the_specialty_of_the_invitation()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        string email = UniqueEmail();

        InvitationResponse pending = await InviteAsync(business, email, "Professional", "  Barbeira ");
        Assert.Equal("Barbeira", pending.Specialty);

        await AcceptNewAsync(await InviteTokenOfAsync(email));

        ProfessionalResponse profile = Assert.Single(await ProfessionalsAsync(business), x => x.DisplayName == "Convidada Silva");
        Assert.Equal("Barbeira", profile.Specialty);
        Assert.NotNull(profile.MembershipId);
    }

    [Fact]
    public async Task J2_without_specialty_the_profile_gets_the_label_Profissional()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        string email = UniqueEmail();

        await InviteAsync(business, email, "Professional", specialty: null);
        await AcceptNewAsync(await InviteTokenOfAsync(email));

        Assert.Equal("Profissional", Assert.Single(await ProfessionalsAsync(business), x => x.DisplayName == "Convidada Silva").Specialty);
    }

    [Fact]
    public async Task J3_an_attendant_invitation_ignores_the_specialty_and_creates_no_professional_record()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        string email = UniqueEmail();

        InvitationResponse pending = await InviteAsync(business, email, "Attendant", "Barbeira");
        Assert.Null(pending.Specialty);

        await AcceptNewAsync(await InviteTokenOfAsync(email));

        Assert.Single(await ProfessionalsAsync(business));
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM tenancy.business_membership WHERE business_id = @b AND role = 'Attendant' AND status = 'Active'",
            ("b", business.Id)));
        Assert.Equal(0, await _world.CountAsync(
            "SELECT count(*) FROM tenancy.business_invitation WHERE business_id = @b AND specialty IS NOT NULL",
            ("b", business.Id)));
    }

    [Fact]
    public async Task J4_a_specialty_above_80_characters_is_refused_and_takes_no_seat()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        SeatsResponse before = await _world.SendOkAsync<SeatsResponse>(HttpMethod.Get, "/api/businesses/current/seats", null, business.OwnerToken);

        using HttpResponseMessage refused = await _world.SendAsync(
            HttpMethod.Post, "/api/businesses/current/invitations",
            new InviteMemberRequest("Convidada Silva", UniqueEmail(), "Professional", Specialty: new string('a', 81)), business.OwnerToken);

        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        Assert.Equal("invitation.specialty_invalid", await TestWorld.ErrorCodeAsync(refused));
        SeatsResponse after = await _world.SendOkAsync<SeatsResponse>(HttpMethod.Get, "/api/businesses/current/seats", null, business.OwnerToken);
        Assert.Equal(before.Used, after.Used);
    }

    [Fact]
    public async Task J5_whoever_has_an_unconfirmed_account_confirms_signs_in_and_accepts_the_invitation()
    {
        await using AuthApi api = new(fixture);
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        string email = UniqueEmail();

        // A conta existe, sem confirmação. O e-mail de confirmação sai pelo canal desta instância, antes do convite.
        await api.RegisterAsync(email);
        await api.DispatchAsync();

        await InviteAsync(business, email, "Professional", "Manicure");
        string inviteToken = await InviteTokenOfAsync(email);

        InvitationPreviewResponse preview = await _world.SendOkAsync<InvitationPreviewResponse>(
            HttpMethod.Post, "/api/invitations/preview", new InvitationTokenRequest(inviteToken), null!);
        Assert.True(preview.AccountExists);

        // Sem confirmar, o login continua recusado: abrir o convite não confirma o e-mail.
        using (HttpResponseMessage blocked = await api.PostAsync("/api/auth/login", new LoginRequest(email, _password)))
        {
            Assert.Equal(HttpStatusCode.Forbidden, blocked.StatusCode);
            Assert.Equal("identity.email_not_confirmed", await TestWorld.ErrorCodeAsync(blocked));
        }

        using (HttpResponseMessage confirmed = await api.PostAsync("/api/auth/confirm-email", new ConfirmEmailRequest(api.ConfirmationTokenOf(email))))
        {
            Assert.Equal(HttpStatusCode.NoContent, confirmed.StatusCode);
        }

        using HttpResponseMessage login = await api.PostAsync("/api/auth/login", new LoginRequest(email, _password));
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        AuthResponse session = (await login.Content.ReadFromJsonAsync<AuthResponse>(TestWorld.Json))!;

        AcceptedInvitationResponse accepted = await _world.SendOkAsync<AcceptedInvitationResponse>(
            HttpMethod.Post, "/api/invitations/accept", new AcceptInvitationRequest(inviteToken, AcceptTerms: true), session.AccessToken);

        Assert.Equal(business.Id, accepted.BusinessId);
        ProfessionalResponse profile = Assert.Single(await ProfessionalsAsync(business), x => x.DisplayName == "Convidada Silva");
        Assert.Equal("Manicure", profile.Specialty);
    }

    [Fact]
    public async Task J6_an_expired_invitation_is_refused_to_preview_and_to_accept()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        string email = UniqueEmail();
        await InviteAsync(business, email, "Professional", "Barbeira");
        string token = await InviteTokenOfAsync(email);

        await ExecuteAsync("UPDATE tenancy.business_invitation SET expires_at = now() - interval '1 hour' WHERE email = @e", ("e", email));

        using HttpResponseMessage preview = await _world.SendAsync(HttpMethod.Post, "/api/invitations/preview", new InvitationTokenRequest(token), null);
        Assert.False(preview.IsSuccessStatusCode);
        Assert.Equal("invitation.expired", await TestWorld.ErrorCodeAsync(preview));

        using HttpResponseMessage accept = await _world.SendAsync(
            HttpMethod.Post, "/api/invitations/accept-new-account",
            new AcceptInvitationNewAccountRequest(token, "Convidada Silva", _password, true), null);
        Assert.False(accept.IsSuccessStatusCode);
        Assert.Equal("invitation.expired", await TestWorld.ErrorCodeAsync(accept));
        Assert.Single(await ProfessionalsAsync(business));
    }

    [Fact]
    public async Task J7_a_different_email_cannot_accept_and_the_invitation_stays_pending()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        string email = UniqueEmail();
        await InviteAsync(business, email, "Professional", "Barbeira");
        string token = await InviteTokenOfAsync(email);
        TestUser stranger = await _world.NewUserAsync("Outra Pessoa");

        using HttpResponseMessage refused = await _world.SendAsync(
            HttpMethod.Post, "/api/invitations/accept", new AcceptInvitationRequest(token, AcceptTerms: true), stranger.Token);

        Assert.Equal(HttpStatusCode.Forbidden, refused.StatusCode);
        Assert.Equal("invitation.email_mismatch", await TestWorld.ErrorCodeAsync(refused));
        Assert.Single(await ProfessionalsAsync(business));
        PagedResult<InvitationResponse> pending = await _world.SendOkAsync<PagedResult<InvitationResponse>>(
            HttpMethod.Get, "/api/businesses/current/invitations", null, business.OwnerToken);
        Assert.Contains(pending.Items, x => x.Email == email && x.State == "Pending");
    }

    [Fact]
    public async Task J8_the_migration_applied_to_an_empty_database_made_the_column_nullable_with_80_characters()
    {
        // A suíte inteira roda sobre um banco vazio migrado do zero (IntegrationFixture): esta é a prova da migration.
        Assert.Equal(1, await _world.CountAsync(
            """
            SELECT count(*) FROM information_schema.columns
            WHERE table_schema = 'tenancy' AND table_name = 'business_invitation' AND column_name = 'specialty'
              AND is_nullable = 'YES' AND character_maximum_length = 80
            """));
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM \"__EFMigrationsHistory\" WHERE migration_id LIKE '%_AddInvitationSpecialty'"));
    }

    private async Task ExecuteAsync(string sql, params (string Name, object Value)[] parameters)
    {
        await using var connection = new NpgsqlConnection(fixture.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        foreach ((string name, object value) in parameters)
        {
            command.Parameters.AddWithValue(name, value);
        }

        await command.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// Uma instância da API só para cadastro, login e confirmação: o limitador "auth" (10 por minuto) vive na instância. A
    /// chave de assinatura é a da API compartilhada, então o token que sai daqui vale na outra.
    /// </summary>
    private sealed class AuthApi(IntegrationFixture fixture) : IAsyncDisposable
    {
        private readonly BookingApiFactory _factory = fixture.NewApi();
        private HttpClient? _client;

        private HttpClient Client => _client ??= _factory.CreateClient();

        public Task<HttpResponseMessage> PostAsync(string path, object body) =>
            Client.SendAsync(TestWorld.Build(HttpMethod.Post, path, body, null));

        public async Task RegisterAsync(string email)
        {
            using HttpResponseMessage response = await PostAsync("/api/auth/register", new RegisterUserRequest(email, _password, "Convidada Silva"));
            await TestWorld.EnsureStatusAsync(response, HttpStatusCode.Created);
        }

        public async Task DispatchAsync()
        {
            await using AsyncServiceScope scope = _factory.Services.CreateAsyncScope();
            await scope.ServiceProvider.GetRequiredService<DispatchOutboxCommand>().ExecuteAsync();
        }

        public string ConfirmationTokenOf(string email) =>
            Uri.UnescapeDataString(AnyToken().Match(
                _factory.Emails.To(email).Last(m => m.Subject.StartsWith("Confirme", StringComparison.Ordinal)).TextBody).Groups[1].Value);

        public async ValueTask DisposeAsync()
        {
            _client?.Dispose();
            await _factory.DisposeAsync();
        }
    }
}
