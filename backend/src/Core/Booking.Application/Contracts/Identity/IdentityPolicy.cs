namespace Booking.Application.Contracts.Identity;

public sealed record IdentityPolicy
{
    public const int MinPasswordLength = 8;
    public const int MaxPasswordLength = 128;

    public TimeSpan RefreshTokenLifetime { get; init; } = TimeSpan.FromDays(30);
    public TimeSpan EmailConfirmationLifetime { get; init; } = TimeSpan.FromHours(24);
    public TimeSpan PasswordResetLifetime { get; init; } = TimeSpan.FromHours(1);
}
