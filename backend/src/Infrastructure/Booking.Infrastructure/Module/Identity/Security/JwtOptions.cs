namespace Booking.Infrastructure.Module.Identity.Security;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public const int MinSigningKeyBytes = 32;

    public string Issuer { get; set; } = "booking";
    public string Audience { get; set; } = "booking-api";

<<<<<<< HEAD
=======
    /// <summary>Segredo HS256. Nunca no repositório: user-secrets em desenvolvimento, variável de ambiente em produção.</summary>
>>>>>>> 072927b623995e9cdf1f2a39df62404aca1719cf
    public string SigningKey { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 15;
}
