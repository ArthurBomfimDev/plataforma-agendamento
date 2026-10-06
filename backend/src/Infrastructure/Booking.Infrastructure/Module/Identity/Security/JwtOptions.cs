namespace Booking.Infrastructure.Module.Identity.Security;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public const int MinSigningKeyBytes = 32;

    public string Issuer { get; set; } = "booking";
    public string Audience { get; set; } = "booking-api";

    public string SigningKey { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 15;
}
