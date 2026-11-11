namespace Booking.Infrastructure.Module.Identity.Security;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public const int MinSigningKeyBytes = 32;

    /// <summary>
    /// Chaves que estão escritas no repositório (o exemplo do <c>.env.example</c>). Têm o tamanho certo, então passam na
    /// regra dos 32 bytes; fora de Development a API se recusa a subir com elas, porque qualquer um forjaria um token.
    /// </summary>
    public static readonly IReadOnlySet<string> PublicSigningKeys = new HashSet<string>(StringComparer.Ordinal)
    {
        "troque-por-uma-chave-aleatoria-com-32-ou-mais-caracteres",
    };

    public string Issuer { get; set; } = "booking";
    public string Audience { get; set; } = "booking-api";

    /// <summary>Segredo HS256. Nunca no repositório: user-secrets em desenvolvimento, variável de ambiente em produção.</summary>
    public string SigningKey { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 15;
}
