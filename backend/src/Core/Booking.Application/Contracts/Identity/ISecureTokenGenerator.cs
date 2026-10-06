namespace Booking.Application.Contracts.Identity;

public sealed record GeneratedToken(string Raw, string Hash);

<<<<<<< HEAD
=======
/// <summary>
/// Token opaco: o valor bruto vai para o usuário, só o hash SHA-256 vai para o banco.
/// </summary>
>>>>>>> 072927b623995e9cdf1f2a39df62404aca1719cf
public interface ISecureTokenGenerator
{
    GeneratedToken Generate();
    string Hash(string rawToken);
}
