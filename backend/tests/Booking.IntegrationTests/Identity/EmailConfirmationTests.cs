using System.Net;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using Booking.Application.Module.Notifications.Commands;
using Booking.Arguments.Module.Identity;
using Booking.IntegrationTests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Booking.IntegrationTests.Identity;

/// <summary>
/// Onda 6A: a conta só entra depois de confirmar o e-mail. Contra a API real, com o canal de e-mail falso.
/// </summary>
/// <remarks>
/// Cada teste sobe a própria instância da API: o limitador "auth" (10 por minuto) vive na instância, e estes testes
/// passam por ele de verdade — cadastro, login, confirmação e reenvio são todos rotas de autenticação.
/// </remarks>
[Collection(IntegrationCollection.Name)]
public sealed partial class EmailConfirmationTests(IntegrationFixture fixture)
{
    private const string _password = "senha-de-teste-123";

    [Fact]
    public async Task N1_sign_up_returns_no_session_and_queues_the_confirmation_in_the_outbox()
    {
        await using Api api = new(fixture);
        string email = NewEmail();

        using HttpResponseMessage registered = await api.PostAsync("/api/auth/register", new RegisterUserRequest(email, _password, "Pessoa Nova"));
        Assert.Equal(HttpStatusCode.Created, registered.StatusCode);
        string body = await registered.Content.ReadAsStringAsync();
        Assert.DoesNotContain("accessToken", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("refreshToken", body, StringComparison.OrdinalIgnoreCase);

        // Na outbox, ainda não enviado.
        Assert.Equal(1L, await CountOutboxAsync(email));
        Assert.Empty(api.Factory.Emails.To(email));

        await api.DispatchAsync();
        Assert.StartsWith("Confirme seu e-mail", Assert.Single(api.Factory.Emails.To(email)).Subject);
    }

    [Fact]
    public async Task N2_login_is_blocked_until_confirmed_wrong_password_stays_401_and_confirmed_logs_in()
    {
        await using Api api = new(fixture);
        string email = await api.RegisterAsync();

        using (HttpResponseMessage blocked = await api.PostAsync("/api/auth/login", new LoginRequest(email, _password)))
        {
            Assert.Equal(HttpStatusCode.Forbidden, blocked.StatusCode);
            Assert.Equal("identity.email_not_confirmed", await TestWorld.ErrorCodeAsync(blocked));
        }

        using (HttpResponseMessage wrong = await api.PostAsync("/api/auth/login", new LoginRequest(email, "senha-errada-999")))
        {
            Assert.Equal(HttpStatusCode.Unauthorized, wrong.StatusCode);
            Assert.Equal("auth.invalid_credentials", await TestWorld.ErrorCodeAsync(wrong));
        }

        using (HttpResponseMessage confirmed = await api.PostAsync("/api/auth/confirm-email", new ConfirmEmailRequest(await api.ConfirmationTokenAsync(email))))
        {
            Assert.Equal(HttpStatusCode.NoContent, confirmed.StatusCode);
        }

        using HttpResponseMessage login = await api.PostAsync("/api/auth/login", new LoginRequest(email, _password));
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    [Fact]
    public async Task N3_refresh_of_an_unconfirmed_account_is_refused()
    {
        string email = NewEmail();
        AuthResponse session;

        // Sessão aberta com a regra desligada, num banco que depois passa a exigir confirmação.
        await using (Api lenient = new(fixture, new Dictionary<string, string> { ["Identity:RequireEmailConfirmation"] = "false" }))
        {
            await lenient.RegisterAsync(email);
            using HttpResponseMessage login = await lenient.PostAsync("/api/auth/login", new LoginRequest(email, _password));
            Assert.Equal(HttpStatusCode.OK, login.StatusCode);
            session = (await login.Content.ReadFromJsonAsync<AuthResponse>(TestWorld.Json))!;
        }

        await using Api strict = new(fixture);
        using HttpResponseMessage refresh = await strict.PostAsync("/api/auth/refresh", new RefreshSessionRequest(session.RefreshToken));
        Assert.Equal(HttpStatusCode.Forbidden, refresh.StatusCode);
        Assert.Equal("identity.email_not_confirmed", await TestWorld.ErrorCodeAsync(refresh));
    }

    [Fact]
    public async Task N4_reused_expired_and_wrong_type_tokens_are_refused_and_a_token_confirms_only_its_owner()
    {
        await using Api api = new(fixture);
        string ana = await api.RegisterAsync();
        string bia = await api.RegisterAsync();
        string anaToken = await api.ConfirmationTokenAsync(ana);
        string biaToken = await api.ConfirmationTokenAsync(bia);

        // O token da Bia confirma a Bia, e só ela.
        using (HttpResponseMessage first = await api.PostAsync("/api/auth/confirm-email", new ConfirmEmailRequest(biaToken)))
        {
            Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);
        }

        using (HttpResponseMessage anaLogin = await api.PostAsync("/api/auth/login", new LoginRequest(ana, _password)))
        {
            Assert.Equal(HttpStatusCode.Forbidden, anaLogin.StatusCode);
        }

        // Reutilizado.
        await AssertInvalidTokenAsync(api, biaToken);

        // Token de redefinição de senha não confirma e-mail.
        using (HttpResponseMessage forgot = await api.PostAsync("/api/auth/forgot-password", new ForgotPasswordRequest(ana)))
        {
            Assert.Equal(HttpStatusCode.Accepted, forgot.StatusCode);
        }

        await api.DispatchAsync();
        string resetToken = TokenIn(api.Factory.Emails.To(ana).Single(m => m.Subject.StartsWith("Redefinição", StringComparison.Ordinal)).TextBody);
        await AssertInvalidTokenAsync(api, resetToken);

        // Vencido: as 24 h passaram.
        await ExecuteAsync("""
            UPDATE identity.user_token SET expires_at = now() - interval '1 minute'
            WHERE type = 'EmailConfirmation' AND used_at IS NULL
              AND user_id = (SELECT id FROM identity."user" WHERE email = @email)
            """, ("email", ana));
        await AssertInvalidTokenAsync(api, anaToken);
    }

    [Fact]
    public async Task N5_resend_answers_the_same_for_any_email_waits_60_seconds_and_only_the_last_link_works()
    {
        await using Api api = new(fixture);
        string email = await api.RegisterAsync();
        string first = await api.ConfirmationTokenAsync(email);

        string unknownBody;
        using (HttpResponseMessage unknown = await api.PostAsync("/api/auth/resend-confirmation", new ResendConfirmationRequest(NewEmail())))
        {
            Assert.Equal(HttpStatusCode.Accepted, unknown.StatusCode);
            unknownBody = await unknown.Content.ReadAsStringAsync();
        }

        // Cedo demais: mesma resposta, nenhum e-mail novo.
        using (HttpResponseMessage early = await api.PostAsync("/api/auth/resend-confirmation", new ResendConfirmationRequest(email)))
        {
            Assert.Equal(HttpStatusCode.Accepted, early.StatusCode);
            Assert.Equal(unknownBody, await early.Content.ReadAsStringAsync());
        }

        await api.DispatchAsync();
        Assert.Single(api.Factory.Emails.To(email));

        // Passado o intervalo, sai um novo, e o primeiro deixa de valer.
        await ExecuteAsync("""
            UPDATE identity.user_token SET created_at = created_at - interval '2 minutes'
            WHERE user_id = (SELECT id FROM identity."user" WHERE email = @email)
            """, ("email", email));

        using (HttpResponseMessage resent = await api.PostAsync("/api/auth/resend-confirmation", new ResendConfirmationRequest(email)))
        {
            Assert.Equal(HttpStatusCode.Accepted, resent.StatusCode);
            Assert.Equal(unknownBody, await resent.Content.ReadAsStringAsync());
        }

        await api.DispatchAsync();
        Assert.Equal(2, api.Factory.Emails.To(email).Count);
        string second = TokenIn(api.Factory.Emails.To(email)[1].TextBody);

        await AssertInvalidTokenAsync(api, first);
        using HttpResponseMessage confirmed = await api.PostAsync("/api/auth/confirm-email", new ConfirmEmailRequest(second));
        Assert.Equal(HttpStatusCode.NoContent, confirmed.StatusCode);
    }

    private static async Task AssertInvalidTokenAsync(Api api, string token)
    {
        using HttpResponseMessage response = await api.PostAsync("/api/auth/confirm-email", new ConfirmEmailRequest(token));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("user_token.invalid", await TestWorld.ErrorCodeAsync(response));
    }

    private static string NewEmail() => $"it-confirm-{Guid.NewGuid():N}@exemplo.test";

    private Task<long> CountOutboxAsync(string email) =>
        new TestWorld(fixture).CountAsync(
            "SELECT count(*) FROM notifications.outbox WHERE type = 'email' AND payload->>'to' = @email", ("email", email));

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

    private static string TokenIn(string body) => Uri.UnescapeDataString(TokenPattern().Match(body).Groups[1].Value);

    [GeneratedRegex(@"token=([^\s&]+)")]
    private static partial Regex TokenPattern();

    /// <summary>Uma instância da API só para o teste, com o seu limitador e o seu canal de e-mail.</summary>
    private sealed class Api(IntegrationFixture fixture, IReadOnlyDictionary<string, string>? settings = null) : IAsyncDisposable
    {
        public BookingApiFactory Factory { get; } = new(fixture.ConnectionString, settings: settings);

        private HttpClient? _client;

        private HttpClient Client => _client ??= Factory.CreateClient();

        public Task<HttpResponseMessage> PostAsync(string path, object body) =>
            Client.SendAsync(TestWorld.Build(HttpMethod.Post, path, body, null));

        public async Task<string> RegisterAsync(string? email = null)
        {
            email ??= NewEmail();
            using HttpResponseMessage response = await PostAsync("/api/auth/register", new RegisterUserRequest(email, _password, "Pessoa de Teste"));
            await TestWorld.EnsureStatusAsync(response, HttpStatusCode.Created);
            return email;
        }

        public async Task DispatchAsync()
        {
            await using AsyncServiceScope scope = Factory.Services.CreateAsyncScope();
            await scope.ServiceProvider.GetRequiredService<DispatchOutboxCommand>().ExecuteAsync();
        }

        /// <summary>O token do e-mail de confirmação mais recente para <paramref name="email"/>.</summary>
        public async Task<string> ConfirmationTokenAsync(string email)
        {
            await DispatchAsync();
            return TokenIn(Factory.Emails.To(email).Last(m => m.Subject.StartsWith("Confirme", StringComparison.Ordinal)).TextBody);
        }

        public async ValueTask DisposeAsync()
        {
            _client?.Dispose();
            await Factory.DisposeAsync();
        }
    }
}
