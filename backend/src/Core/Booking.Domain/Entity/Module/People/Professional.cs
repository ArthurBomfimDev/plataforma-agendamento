using Booking.Domain.Entity.Base;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.People;

/// <summary>
/// Perfil de execução. O nome é sempre público, porque o consumidor precisa saber quem vai atendê-lo;
/// foto, biografia e especialidade completas só aparecem com consentimento registrado do próprio profissional
/// (decisões de modelo §3) — consentimento imposto como condição de trabalho não seria livre.
/// </summary>
public sealed class Professional : BaseEntity, IAuditable, ITenantScoped
{
    public Guid BusinessId { get; private set; }

    /// <summary>Vínculo com a conta do profissional. Nulo para quem ainda não tem conta na plataforma.</summary>
    public Guid? BusinessMembershipId { get; private set; }

    public string DisplayName { get; private set; } = null!;
    public string? Specialty { get; private set; }
    public string? Bio { get; private set; }
    public bool IsActive { get; private set; }
    public bool IsPubliclyVisible { get; private set; }
    public DateTimeOffset? PublicProfileConsentAt { get; private set; }

    private Professional()
    {
    }

    public static Professional Create(Guid businessId, string displayName, string? specialty, string? bio, Guid? businessMembershipId)
    {
        var professional = new Professional
        {
            BusinessId = businessId,
            BusinessMembershipId = businessMembershipId,
            IsActive = true,
        };

        professional.UpdateProfile(displayName, specialty, bio);
        return professional;
    }

    public void UpdateProfile(string displayName, string? specialty, string? bio)
    {
        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new DomainException("professional.display_name_required");
        }

        DisplayName = displayName.Trim();
        Specialty = string.IsNullOrWhiteSpace(specialty) ? null : specialty.Trim();
        Bio = string.IsNullOrWhiteSpace(bio) ? null : bio.Trim();
    }

    public void LinkMembership(Guid businessMembershipId) => BusinessMembershipId = businessMembershipId;

    public void Activate() => IsActive = true;

    public void Deactivate()
    {
        IsActive = false;
        IsPubliclyVisible = false;
    }

    public void GrantPublicProfileConsent(DateTimeOffset now) => PublicProfileConsentAt = now;

    // Revogar o consentimento esconde o perfil completo na hora — não depende de o dono lembrar.
    public void RevokePublicProfileConsent()
    {
        PublicProfileConsentAt = null;
        IsPubliclyVisible = false;
    }

    public void ShowFullProfile()
    {
        if (PublicProfileConsentAt is null)
        {
            throw new DomainException("professional.public_profile_requires_consent");
        }

        IsPubliclyVisible = true;
    }

    public void HideFullProfile() => IsPubliclyVisible = false;
}
