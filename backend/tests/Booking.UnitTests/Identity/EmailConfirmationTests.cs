using Booking.Application.Contracts.Identity;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Exceptions;

namespace Booking.UnitTests.Identity;

/// <summary>Onda 6A: a conta só entra depois de confirmar o e-mail.</summary>
public sealed class EmailConfirmationTests
{
    private readonly IdentityFixture _f = new();

    private static async Task<string> CodeOf(Func<Task> action) =>
        (await Assert.ThrowsAsync<DomainException>(action)).Code;

    private async Task<string> RegisterAsync(string email = "ana@exemplo.com")
    {
        await _f.Register().ExecuteAsync(new RegisterUserRequest(email, IdentityFixture.Password, "Ana"));
        return _f.Mailer.Confirmations.Last().Token;
    }

    [Fact]
    public async Task Login_is_blocked_until_the_email_is_confirmed_and_allowed_after()
    {
        string raw = await RegisterAsync();

        Assert.Equal("identity.email_not_confirmed", await CodeOf(() => _f.Login().ExecuteAsync(
            new LoginRequest("ana@exemplo.com", IdentityFixture.Password))));
        Assert.Empty(_f.RefreshTokens.Items);

        await _f.ConfirmEmail().ExecuteAsync(new ConfirmEmailRequest(raw));

        AuthResponse auth = await _f.Login().ExecuteAsync(new LoginRequest("ana@exemplo.com", IdentityFixture.Password));
        Assert.False(string.IsNullOrEmpty(auth.AccessToken));
    }

    [Fact]
    public async Task Wrong_password_on_an_unconfirmed_account_is_still_invalid_credentials()
    {
        await RegisterAsync();

        Assert.Equal("auth.invalid_credentials", await CodeOf(() => _f.Login().ExecuteAsync(
            new LoginRequest("ana@exemplo.com", "senha-errada-999"))));
    }

    [Fact]
    public async Task With_the_rule_off_an_unconfirmed_account_logs_in()
    {
        _f.SeedUser(confirmed: false);
        _f.Policy = new IdentityPolicy { RequireEmailConfirmation = false };

        AuthResponse auth = await _f.Login().ExecuteAsync(new LoginRequest("ana@exemplo.com", IdentityFixture.Password));

        Assert.False(string.IsNullOrEmpty(auth.AccessToken));
    }

    [Fact]
    public async Task Refresh_of_an_unconfirmed_account_is_refused_once_the_rule_is_on()
    {
        User user = _f.SeedUser(confirmed: false);
        _f.Policy = new IdentityPolicy { RequireEmailConfirmation = false };
        AuthResponse auth = await _f.Login().ExecuteAsync(new LoginRequest("ana@exemplo.com", IdentityFixture.Password));

        _f.Policy = new IdentityPolicy();

        Assert.Null(user.EmailConfirmedAt);
        Assert.Equal("identity.email_not_confirmed", await CodeOf(() => _f.Refresh().ExecuteAsync(
            new RefreshSessionRequest(auth.RefreshToken))));
    }

    [Fact]
    public async Task Confirmation_token_expires_after_24_hours()
    {
        string raw = await RegisterAsync();
        _f.Clock.Now = _f.Clock.Now.AddHours(24).AddSeconds(1);

        Assert.Equal("user_token.invalid", await CodeOf(() => _f.ConfirmEmail().ExecuteAsync(new ConfirmEmailRequest(raw))));
    }

    [Fact]
    public async Task Token_of_another_type_does_not_confirm()
    {
        _f.SeedUser(confirmed: false);
        await _f.ForgotPassword().ExecuteAsync(new ForgotPasswordRequest("ana@exemplo.com"));

        Assert.Equal("user_token.invalid", await CodeOf(() => _f.ConfirmEmail().ExecuteAsync(
            new ConfirmEmailRequest(_f.Mailer.Resets.Single().Token))));
    }

    [Fact]
    public async Task Resend_is_silent_for_unknown_confirmed_and_invalid_emails()
    {
        _f.SeedUser("confirmada@exemplo.com");

        await _f.ResendConfirmation().ExecuteAsync(new ResendConfirmationRequest("ninguem@exemplo.com"));
        await _f.ResendConfirmation().ExecuteAsync(new ResendConfirmationRequest("confirmada@exemplo.com"));
        await _f.ResendConfirmation().ExecuteAsync(new ResendConfirmationRequest("lixo"));

        Assert.Empty(_f.Mailer.Confirmations);
    }

    [Fact]
    public async Task Resend_waits_60_seconds_and_invalidates_the_previous_link()
    {
        string first = await RegisterAsync();

        await _f.ResendConfirmation().ExecuteAsync(new ResendConfirmationRequest("ana@exemplo.com"));
        Assert.Single(_f.Mailer.Confirmations);

        _f.Clock.Now = _f.Clock.Now.AddSeconds(61);
        await _f.ResendConfirmation().ExecuteAsync(new ResendConfirmationRequest("ana@exemplo.com"));
        Assert.Equal(2, _f.Mailer.Confirmations.Count);
        string second = _f.Mailer.Confirmations[1].Token;

        Assert.Equal("user_token.invalid", await CodeOf(() => _f.ConfirmEmail().ExecuteAsync(new ConfirmEmailRequest(first))));
        await _f.ConfirmEmail().ExecuteAsync(new ConfirmEmailRequest(second));
        Assert.NotNull(_f.Users.Items.Single().EmailConfirmedAt);
    }

    [Fact]
    public async Task Resetting_the_password_also_confirms_the_email()
    {
        _f.SeedUser(confirmed: false);
        await _f.ForgotPassword().ExecuteAsync(new ForgotPasswordRequest("ana@exemplo.com"));

        await _f.ResetPassword().ExecuteAsync(new ResetPasswordRequest(_f.Mailer.Resets.Single().Token, "nova-senha-456"));

        await _f.Login().ExecuteAsync(new LoginRequest("ana@exemplo.com", "nova-senha-456"));
    }
}
