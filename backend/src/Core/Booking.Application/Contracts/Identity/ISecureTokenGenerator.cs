namespace Booking.Application.Contracts.Identity;

public sealed record GeneratedToken(string Raw, string Hash);

public interface ISecureTokenGenerator
{
    GeneratedToken Generate();
    string Hash(string rawToken);
}
