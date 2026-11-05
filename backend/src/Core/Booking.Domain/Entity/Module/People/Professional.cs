using Booking.Domain.Entity.Base;
using Booking.Domain.Exceptions;
using Booking.Domain.ValueObject;

namespace Booking.Domain.Entity.Module.People;

/// <summary>
/// Perfil de execução. O perfil é <b>sempre público</b> enquanto o profissional está ativo (ADR-031): nome, especialidade,
/// biografia e foto. A base para exibir esses dados é a <b>declaração do dono</b> de que tem autorização da pessoa
/// (quando ela não tem conta) ou o próprio profissional, que passa a controlá-los depois de aceitar o termo (quando tem).
/// </summary>
public sealed class Professional : BaseEntity, IAuditable, ITenantScoped
{
    public const int MaxRegistrationLength = 40;

    /// <summary>Versão do texto da declaração do dono (checkbox do formulário). Rascunho, sem revisão jurídica.</summary>
    public const string AuthorizationDeclarationTextVersion = "declaracao-dono-2026-11-rascunho";

    public Guid BusinessId { get; private set; }

    /// <summary>Vínculo com a conta do profissional. Nulo para quem ainda não tem conta na plataforma.</summary>
    public Guid? BusinessMembershipId { get; private set; }

    public string DisplayName { get; private set; } = null!;
    public string? Specialty { get; private set; }
    public string? Bio { get; private set; }
    public bool IsActive { get; private set; }

    /// <summary>
    /// Registro profissional (Saúde), exibido na página pública. Dado opcional e público por natureza (o número no
    /// conselho é consultável por qualquer pessoa); nunca entra em log.
    /// </summary>
    public string? Registration { get; private set; }

    /// <summary>Foto (ADR-023). Aparece nas rotas públicas enquanto o profissional está ativo.</summary>
    public string? PhotoImageKey { get; private set; }

    // --- Declaração do dono: quem, quando e qual versão do texto ---
    public Guid? AuthorizationDeclaredByUserId { get; private set; }
    public DateTimeOffset? AuthorizationDeclaredAt { get; private set; }
    public string? AuthorizationDeclarationVersion { get; private set; }

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

    public void SetRegistration(string? registration)
    {
        string? trimmed = string.IsNullOrWhiteSpace(registration) ? null : registration.Trim();

        if (trimmed is { Length: > MaxRegistrationLength })
        {
            throw new DomainException("professional.registration_too_long");
        }

        Registration = trimmed;
    }

    public void LinkMembership(Guid businessMembershipId) => BusinessMembershipId = businessMembershipId;

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;

    /// <summary>Sem conta, quem responde pelos dados exibidos é o dono, que precisa declarar a autorização da pessoa.</summary>
    public bool RequiresOwnerDeclaration => BusinessMembershipId is null;

    public bool HasAuthorizationDeclaration => AuthorizationDeclaredAt is not null;

    /// <summary>O dono declara ter autorização desta pessoa para exibir os dados dela. Declarar de novo atualiza quem, quando e a versão.</summary>
    public void DeclareAuthorization(Guid ownerUserId, DateTimeOffset now)
    {
        AuthorizationDeclaredByUserId = ownerUserId;
        AuthorizationDeclaredAt = now;
        AuthorizationDeclarationVersion = AuthorizationDeclarationTextVersion;
    }

    /// <summary>Troca (ou remove, com nulo) a foto. Devolve a referência anterior, para apagar os arquivos velhos.</summary>
    public string? ReplacePhoto(string? key)
    {
        string? previous = PhotoImageKey;
        PhotoImageKey = key is null ? null : ImageKey.Ensure(key);
        return previous;
    }
}
