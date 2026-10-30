using System.Security.Cryptography;
using System.Text;
using Booking.Application.Contracts.Identity;

namespace Booking.Infrastructure.Module.Identity.Security;

public sealed class SecureTokenGenerator : ISecureTokenGenerator
{
    private const int _tokenBytes = 32;

    public GeneratedToken Generate()
    {
        string raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(_tokenBytes))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');

        return new GeneratedToken(raw, Hash(raw));
    }

    public string Hash(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken))).ToLowerInvariant();
}
