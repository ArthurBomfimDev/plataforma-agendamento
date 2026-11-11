using System.Text;
using Booking.Infrastructure.Module.Identity.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Booking.Api.Common;

/// <summary>Valida o JWT com as mesmas <see cref="JwtOptions"/> usadas para emiti-lo — uma configuração só.</summary>
public sealed class ConfigureJwtBearer(IOptions<JwtOptions> options) : IConfigureNamedOptions<JwtBearerOptions>
{
    public void Configure(string? name, JwtBearerOptions bearer)
    {
        JwtOptions jwt = options.Value;

        bearer.MapInboundClaims = false;
        bearer.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    }

    public void Configure(JwtBearerOptions bearer) => Configure(Options.DefaultName, bearer);
}
