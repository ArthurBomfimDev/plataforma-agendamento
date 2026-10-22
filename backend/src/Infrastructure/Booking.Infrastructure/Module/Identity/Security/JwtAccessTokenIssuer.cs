using System.Security.Claims;
using System.Text;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Identity;
using Booking.Domain.Entity.Module.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Booking.Infrastructure.Module.Identity.Security;

/// <summary>
/// Emite o access token: identidade (sub, e-mail, nome) e, quando há contexto de estabelecimento,
/// <c>businessId</c> e <c>ctx</c> (papel ativo). ADR-004: o token carrega a associação ativa.
/// </summary>
public sealed class JwtAccessTokenIssuer(IOptions<JwtOptions> options) : IAccessTokenIssuer
{
    private readonly JwtOptions _options = options.Value;
    private readonly JsonWebTokenHandler _handler = new();

    public AccessToken Issue(User user, DateTimeOffset now, BusinessContext? context = null)
    {
        DateTimeOffset expiresAt = now.AddMinutes(_options.AccessTokenMinutes);

        List<Claim> claims =
        [
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email.Address),
            new Claim(JwtRegisteredClaimNames.Name, user.FullName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.CreateVersion7().ToString()),
        ];

        if (context is not null)
        {
            claims.Add(new Claim(TenantClaims.BusinessId, context.BusinessId.ToString()));
            claims.Add(new Claim(TenantClaims.ActiveContext, context.Role));
        }

        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = _options.Issuer,
            Audience = _options.Audience,
            IssuedAt = now.UtcDateTime,
            NotBefore = now.UtcDateTime,
            Expires = expiresAt.UtcDateTime,
            Subject = new ClaimsIdentity(claims),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey)),
                SecurityAlgorithms.HmacSha256),
        };

        return new AccessToken(_handler.CreateToken(descriptor), expiresAt);
    }
}
