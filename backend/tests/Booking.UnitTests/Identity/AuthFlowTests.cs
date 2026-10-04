using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;

namespace Booking.UnitTests.Identity;

public sealed class AuthFlowTests
{
    private readonly IdentityFixture _f = new();

    private static async Task<string> CodeOf(Func<Task> action) =>
        (await Assert.ThrowsAsync<DomainException>(action)).Code;

    [Fact]
    public async Task Register_creates_user_stores_only_hashes_and_sends_confirmation()
    {
        UserResponse response = await _f.Register().ExecuteAsync(
            new RegisterUserRequest("  Ana@Exemplo.com ", IdentityFixture.Password, "Ana Souza"));

        User user = Assert.Single(_f.Users.Items);
        Assert.Equal("ana@exemplo.com", response.Email);
        Assert.False(response.EmailConfirmed);
        Assert.StartsWith("$argon2id$", user.PasswordHash);

        (string email, string raw) = Assert.Single(_f.Mailer.Confirmations);
        Assert.Equal("ana@exemplo.com", email);
        UserToken stored = Assert.Single(_f.UserTokens.Items);
        Assert.NotEqual(raw, stored.TokenHash);
        Assert.Equal(_f.Tokens.Hash(raw), stored.TokenHash);
    }

    [Fact]
    public async Task Register_rejects_duplicate_email_and_weak_password()
    {
        _f.SeedUser();

        Assert.Equal("user.email_already_registered", await CodeOf(() => _f.Register().ExecuteAsync(
            new RegisterUserRequest("ANA@exemplo.com", IdentityFixture.Password, "Outra Ana"))));
        Assert.Equal("user.password_invalid_length", await CodeOf(() => _f.Register().ExecuteAsync(
            new RegisterUserRequest("novo@exemplo.com", "curta", "Novo"))));
    }

    [Fact]
    public async Task ConfirmEmail_marks_user_and_token_is_single_use()
    {
        await _f.Register().ExecuteAsync(new RegisterUserRequest("ana@exemplo.com", IdentityFixture.Password, "Ana"));
        string raw = _f.Mailer.Confirmations.Single().Token;

        await _f.ConfirmEmail().ExecuteAsync(new ConfirmEmailRequest(raw));

        Assert.NotNull(_f.Users.Items.Single().EmailConfirmedAt);
        Assert.Equal("user_token.invalid", await CodeOf(() => _f.ConfirmEmail().ExecuteAsync(new ConfirmEmailRequest(raw))));
    }

    [Fact]
    public async Task Login_succeeds_with_correct_password()
    {
        _f.SeedUser();

        AuthResponse auth = await _f.Login().ExecuteAsync(new LoginRequest("ana@exemplo.com", IdentityFixture.Password));

        Assert.False(string.IsNullOrEmpty(auth.AccessToken));
        Assert.Equal(_f.Clock.Now.AddMinutes(15), auth.AccessTokenExpiresAt);
        Assert.Single(_f.RefreshTokens.Items);
        Assert.NotEqual(auth.RefreshToken, _f.RefreshTokens.Items.Single().TokenHash);
    }

    [Fact]
    public async Task Login_gives_same_error_for_wrong_password_and_unknown_email()
    {
        _f.SeedUser();

        Assert.Equal("auth.invalid_credentials", await CodeOf(() => _f.Login().ExecuteAsync(
            new LoginRequest("ana@exemplo.com", "senha-errada-999"))));
        Assert.Equal("auth.invalid_credentials", await CodeOf(() => _f.Login().ExecuteAsync(
            new LoginRequest("ninguem@exemplo.com", IdentityFixture.Password))));
        Assert.Equal("auth.invalid_credentials", await CodeOf(() => _f.Login().ExecuteAsync(
            new LoginRequest("nao-e-email", IdentityFixture.Password))));
    }

    [Fact]
    public async Task Login_reveals_suspension_only_after_correct_password()
    {
        _f.SeedUser(status: UserStatus.Suspended);

        Assert.Equal("auth.invalid_credentials", await CodeOf(() => _f.Login().ExecuteAsync(
            new LoginRequest("ana@exemplo.com", "senha-errada-999"))));
        Assert.Equal("auth.account_not_active", await CodeOf(() => _f.Login().ExecuteAsync(
            new LoginRequest("ana@exemplo.com", IdentityFixture.Password))));
    }

    [Fact]
    public async Task Refresh_rotates_token_and_revokes_the_old_one()
    {
        _f.SeedUser();
        AuthResponse first = await _f.Login().ExecuteAsync(new LoginRequest("ana@exemplo.com", IdentityFixture.Password));

        AuthResponse second = await _f.Refresh().ExecuteAsync(new RefreshSessionRequest(first.RefreshToken));

        Assert.NotEqual(first.RefreshToken, second.RefreshToken);
        RefreshToken old = _f.RefreshTokens.Items.Single(x => x.TokenHash == _f.Tokens.Hash(first.RefreshToken));
        Assert.NotNull(old.RevokedAt);
        Assert.Equal(_f.Tokens.Hash(second.RefreshToken), old.ReplacedByTokenHash);
    }

    [Fact]
    public async Task Refresh_reuse_revokes_every_session_of_the_user()
    {
        _f.SeedUser();
        AuthResponse first = await _f.Login().ExecuteAsync(new LoginRequest("ana@exemplo.com", IdentityFixture.Password));
        AuthResponse second = await _f.Refresh().ExecuteAsync(new RefreshSessionRequest(first.RefreshToken));

        Assert.Equal("auth.refresh_token_reused", await CodeOf(() => _f.Refresh().ExecuteAsync(
            new RefreshSessionRequest(first.RefreshToken))));

        Assert.Equal("auth.refresh_token_reused", await CodeOf(() => _f.Refresh().ExecuteAsync(
            new RefreshSessionRequest(second.RefreshToken))));
        Assert.All(_f.RefreshTokens.Items, t => Assert.NotNull(t.RevokedAt));
    }

    [Fact]
    public async Task Refresh_rejects_expired_and_unknown_tokens()
    {
        _f.SeedUser();
        AuthResponse auth = await _f.Login().ExecuteAsync(new LoginRequest("ana@exemplo.com", IdentityFixture.Password));

        Assert.Equal("auth.invalid_refresh_token", await CodeOf(() => _f.Refresh().ExecuteAsync(
            new RefreshSessionRequest("token-que-nao-existe"))));

        _f.Clock.Now = _f.Clock.Now.Add(_f.Policy.RefreshTokenLifetime).AddSeconds(1);
        Assert.Equal("auth.invalid_refresh_token", await CodeOf(() => _f.Refresh().ExecuteAsync(
            new RefreshSessionRequest(auth.RefreshToken))));
    }

    [Fact]
    public async Task Refresh_is_denied_once_the_account_is_suspended()
    {
        User user = _f.SeedUser();
        AuthResponse auth = await _f.Login().ExecuteAsync(new LoginRequest("ana@exemplo.com", IdentityFixture.Password));
        user.Suspend();

        Assert.Equal("auth.invalid_refresh_token", await CodeOf(() => _f.Refresh().ExecuteAsync(
            new RefreshSessionRequest(auth.RefreshToken))));
    }

    [Fact]
    public async Task Logout_revokes_the_token_and_is_idempotent()
    {
        _f.SeedUser();
        AuthResponse auth = await _f.Login().ExecuteAsync(new LoginRequest("ana@exemplo.com", IdentityFixture.Password));

        await _f.Logout().ExecuteAsync(new LogoutRequest(auth.RefreshToken));
        await _f.Logout().ExecuteAsync(new LogoutRequest(auth.RefreshToken));
        await _f.Logout().ExecuteAsync(new LogoutRequest("desconhecido"));

        Assert.NotNull(_f.RefreshTokens.Items.Single().RevokedAt);
    }

    [Fact]
    public async Task ForgotPassword_is_silent_for_unknown_email_and_sends_for_known()
    {
        _f.SeedUser();

        await _f.ForgotPassword().ExecuteAsync(new ForgotPasswordRequest("ninguem@exemplo.com"));
        await _f.ForgotPassword().ExecuteAsync(new ForgotPasswordRequest("lixo"));
        Assert.Empty(_f.Mailer.Resets);

        await _f.ForgotPassword().ExecuteAsync(new ForgotPasswordRequest("ana@exemplo.com"));
        Assert.Single(_f.Mailer.Resets);
    }

    [Fact]
    public async Task ResetPassword_changes_password_ends_sessions_and_token_is_single_use()
    {
        _f.SeedUser();
        AuthResponse session = await _f.Login().ExecuteAsync(new LoginRequest("ana@exemplo.com", IdentityFixture.Password));
        await _f.ForgotPassword().ExecuteAsync(new ForgotPasswordRequest("ana@exemplo.com"));
        string raw = _f.Mailer.Resets.Single().Token;

        await _f.ResetPassword().ExecuteAsync(new ResetPasswordRequest(raw, "nova-senha-456"));

        Assert.Equal("user_token.invalid", await CodeOf(() => _f.ResetPassword().ExecuteAsync(
            new ResetPasswordRequest(raw, "outra-senha-789"))));
        Assert.Equal("auth.refresh_token_reused", await CodeOf(() => _f.Refresh().ExecuteAsync(
            new RefreshSessionRequest(session.RefreshToken))));
        Assert.Equal("auth.invalid_credentials", await CodeOf(() => _f.Login().ExecuteAsync(
            new LoginRequest("ana@exemplo.com", IdentityFixture.Password))));
        await _f.Login().ExecuteAsync(new LoginRequest("ana@exemplo.com", "nova-senha-456"));
    }

    [Fact]
    public async Task ResetPassword_rejects_expired_token()
    {
        _f.SeedUser();
        await _f.ForgotPassword().ExecuteAsync(new ForgotPasswordRequest("ana@exemplo.com"));
        string raw = _f.Mailer.Resets.Single().Token;

        _f.Clock.Now = _f.Clock.Now.Add(_f.Policy.PasswordResetLifetime).AddSeconds(1);

        Assert.Equal("user_token.invalid", await CodeOf(() => _f.ResetPassword().ExecuteAsync(
            new ResetPasswordRequest(raw, "nova-senha-456"))));
    }

    [Fact]
    public async Task A_second_forgot_password_invalidates_the_first_link()
    {
        _f.SeedUser();
        await _f.ForgotPassword().ExecuteAsync(new ForgotPasswordRequest("ana@exemplo.com"));
        await _f.ForgotPassword().ExecuteAsync(new ForgotPasswordRequest("ana@exemplo.com"));
        string first = _f.Mailer.Resets[0].Token;
        string second = _f.Mailer.Resets[1].Token;

        Assert.Equal("user_token.invalid", await CodeOf(() => _f.ResetPassword().ExecuteAsync(
            new ResetPasswordRequest(first, "nova-senha-456"))));
        await _f.ResetPassword().ExecuteAsync(new ResetPasswordRequest(second, "nova-senha-456"));
    }
}
