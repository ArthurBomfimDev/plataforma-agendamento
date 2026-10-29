using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.Compliance;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.Compliance;

/// <summary>
/// Consentimento específico, versionado e revogável. Conta global: pertence ao usuário, não a um
/// estabelecimento. Revogar não apaga — o registro de que houve consentimento é a própria prova.
/// </summary>
public sealed class ConsentRecord : BaseEntity, IAuditable
{
    public Guid UserId { get; private set; }
    public ConsentPurpose Purpose { get; private set; }

    /// <summary>Versão do texto aceito. Texto novo exige consentimento novo.</summary>
    public string Version { get; private set; } = null!;

    public DateTimeOffset GrantedAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }

    private ConsentRecord()
    {
    }

    public static ConsentRecord Grant(Guid userId, ConsentPurpose purpose, string version, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(version))
        {
            throw new DomainException("consent.version_required");
        }

        return new ConsentRecord { UserId = userId, Purpose = purpose, Version = version.Trim(), GrantedAt = now };
    }

    public bool IsActiveFor(string version) => RevokedAt is null && Version == version;

    public void Revoke(DateTimeOffset now)
    {
        if (RevokedAt is not null)
        {
            throw new DomainException("consent.cannot_revoke_already_revoked");
        }

        RevokedAt = now;
    }
}
