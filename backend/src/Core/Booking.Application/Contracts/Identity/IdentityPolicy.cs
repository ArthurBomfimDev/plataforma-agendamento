namespace Booking.Application.Contracts.Identity;

public sealed record IdentityPolicy
{
    public const int MinPasswordLength = 8;
    public const int MaxPasswordLength = 128;

    public TimeSpan RefreshTokenLifetime { get; init; } = TimeSpan.FromDays(30);
    public TimeSpan EmailConfirmationLifetime { get; init; } = TimeSpan.FromHours(24);
    public TimeSpan PasswordResetLifetime { get; init; } = TimeSpan.FromHours(1);

    /// <summary>Login e refresh recusados até o e-mail ser confirmado (<c>Identity__RequireEmailConfirmation</c>).</summary>
    public bool RequireEmailConfirmation { get; init; } = true;

    /// <summary>Intervalo mínimo entre dois e-mails de confirmação para a mesma conta.</summary>
    public TimeSpan ConfirmationResendInterval { get; init; } = TimeSpan.FromSeconds(60);
}
