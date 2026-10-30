namespace Booking.Application.Contracts.Identity;

public sealed record GeneratedToken(string Raw, string Hash);

/// <summary>
/// Token opaco: o valor bruto vai para o usuário, só o hash SHA-256 vai para o banco.
/// </summary>
public interface ISecureTokenGenerator
{
    GeneratedToken Generate();
    string Hash(string rawToken);
}
