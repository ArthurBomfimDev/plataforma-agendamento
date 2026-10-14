using System.Security.Cryptography;
using System.Text;
using Booking.Application.Contracts.Identity;
using Konscious.Security.Cryptography;

namespace Booking.Infrastructure.Module.Identity.Security;

public sealed class Argon2PasswordHasher : IPasswordHasher
{
    private const int _saltSize = 16;
    private const int _hashSize = 32;
    private const int _memoryKiB = 19456;
    private const int _iterations = 2;
    private const int _parallelism = 1;

    public string Hash(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(_saltSize);
        byte[] hash = Compute(password, salt, _memoryKiB, _iterations, _parallelism);

        return $"$argon2id$v=19$m={_memoryKiB},t={_iterations},p={_parallelism}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public bool Verify(string passwordHash, string password)
    {
        string[] parts = passwordHash.Split('$', StringSplitOptions.RemoveEmptyEntries);

        if (parts.Length != 5 || parts[0] != "argon2id" || !TryParseParameters(parts[2], out int m, out int t, out int p))
        {
            return false;
        }

        try
        {
            byte[] salt = Convert.FromBase64String(parts[3]);
            byte[] expected = Convert.FromBase64String(parts[4]);
            byte[] actual = Compute(password, salt, m, t, p, expected.Length);

            return CryptographicOperations.FixedTimeEquals(expected, actual);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static byte[] Compute(string password, byte[] salt, int memoryKiB, int iterations, int parallelism, int hashSize = _hashSize)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            MemorySize = memoryKiB,
            Iterations = iterations,
            DegreeOfParallelism = parallelism,
        };

        return argon2.GetBytes(hashSize);
    }

    private static bool TryParseParameters(string segment, out int m, out int t, out int p)
    {
        m = t = p = 0;
        string[] pairs = segment.Split(',');

        return pairs.Length == 3
            && pairs[0].StartsWith("m=", StringComparison.Ordinal) && int.TryParse(pairs[0][2..], out m)
            && pairs[1].StartsWith("t=", StringComparison.Ordinal) && int.TryParse(pairs[1][2..], out t)
            && pairs[2].StartsWith("p=", StringComparison.Ordinal) && int.TryParse(pairs[2][2..], out p)
            && m is > 0 and <= 1_048_576 && t is > 0 and <= 20 && p is > 0 and <= 16;
    }
}
