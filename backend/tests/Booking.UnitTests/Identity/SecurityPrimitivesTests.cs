using System.Text;
using Booking.Infrastructure.Module.Identity.Security;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Booking.UnitTests.Identity;

public sealed class SecurityPrimitivesTests
{
    [Fact]
    public void Argon2_hash_verifies_and_is_salted()
    {
        var hasher = new Argon2PasswordHasher();

        string a = hasher.Hash("minha-senha-123");
        string b = hasher.Hash("minha-senha-123");

        Assert.NotEqual(a, b);
        Assert.True(hasher.Verify(a, "minha-senha-123"));
        Assert.False(hasher.Verify(a, "minha-senha-124"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("texto-qualquer")]
    [InlineData("$argon2id$v=19$m=19456,t=2,p=1$%%%$%%%")]
    [InlineData("$argon2id$v=19$m=999999999,t=2,p=1$AAAA$AAAA")]
    public void Argon2_rejects_malformed_hashes_without_throwing(string malformed)
    {
        Assert.False(new Argon2PasswordHasher().Verify(malformed, "qualquer"));
    }

    [Fact]
    public void Secure_token_is_random_and_only_its_hash_is_derivable()
    {
        var generator = new SecureTokenGenerator();

        GeneratedToken_Pair first = Pair(generator.Generate());
        GeneratedToken_Pair second = Pair(generator.Generate());

        Assert.NotEqual(first.Raw, second.Raw);
        Assert.Equal(generator.Hash(first.Raw), first.Hash);
        Assert.NotEqual(first.Raw, first.Hash);
        Assert.Matches("^[A-Za-z0-9_-]+$", first.Raw);
    }

    [Fact]
    public async Task Jwt_is_signed_carries_identity_and_expires()
    {
        var f = new IdentityFixture();
        var user = f.SeedUser();
        var issuer = new JwtAccessTokenIssuer(Options.Create(IdentityFixture.JwtSettings));

        var token = issuer.Issue(user, f.Clock.Now);

        var parameters = new TokenValidationParameters
        {
            ValidIssuer = IdentityFixture.JwtSettings.Issuer,
            ValidAudience = IdentityFixture.JwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(IdentityFixture.JwtSettings.SigningKey)),
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
            ClockSkew = TimeSpan.Zero,
            LifetimeValidator = (nbf, exp, _, _) => exp > f.Clock.Now.UtcDateTime,
        };

        TokenValidationResult result = await new JsonWebTokenHandler().ValidateTokenAsync(token.Value, parameters);

        Assert.True(result.IsValid, result.Exception?.Message);
        Assert.Equal(user.Id.ToString(), result.Claims[JwtRegisteredClaimNames.Sub]);
        Assert.Equal("ana@exemplo.com", result.Claims[JwtRegisteredClaimNames.Email]);
        Assert.False(result.Claims.ContainsKey("businessId"));
        Assert.Equal(f.Clock.Now.AddMinutes(15), token.ExpiresAt);
    }

    [Fact]
    public async Task Jwt_signed_with_another_key_is_rejected()
    {
        var f = new IdentityFixture();
        var user = f.SeedUser();
        var forged = new JwtAccessTokenIssuer(Options.Create(new JwtOptions { SigningKey = "outra-chave-de-teste-com-mais-de-32-bytes-9876" }))
            .Issue(user, f.Clock.Now);

        var parameters = new TokenValidationParameters
        {
            ValidIssuer = IdentityFixture.JwtSettings.Issuer,
            ValidAudience = IdentityFixture.JwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(IdentityFixture.JwtSettings.SigningKey)),
            ValidateLifetime = false,
        };

        TokenValidationResult result = await new JsonWebTokenHandler().ValidateTokenAsync(forged.Value, parameters);

        Assert.False(result.IsValid);
    }

    private static GeneratedToken_Pair Pair(Booking.Application.Contracts.Identity.GeneratedToken t) => new(t.Raw, t.Hash);

    private sealed record GeneratedToken_Pair(string Raw, string Hash);
}
