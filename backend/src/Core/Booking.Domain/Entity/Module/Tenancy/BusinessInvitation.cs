using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.Tenancy;

/// <summary>
/// Convite para entrar numa equipe (Fase 4). O token bruto só existe no link do e-mail; aqui fica o hash SHA-256.
/// Uso único e validade de 7 dias. Quem é convidado pode ainda não ter conta, por isso o convite guarda o e-mail
/// e não um usuário; o vínculo (<see cref="BusinessMembership"/>) nasce no aceite.
/// </summary>
/// <remarks>
/// <see cref="ProfessionalId"/> é só um identificador: nenhuma chave estrangeira atravessa a fronteira de módulo
/// (ADR-010). O vínculo com o perfil do profissional é feito pelo contrato do módulo People.
/// </remarks>
public sealed class BusinessInvitation : BaseEntity, IAuditable, ITenantScoped
{
    public const int LifetimeDays = 7;
    public const int MaxNameLength = 120;
    public const int MaxSpecialtyLength = 80;

    /// <summary>Especialidade do perfil quando o convite não trouxe nenhuma (convites antigos, anteriores à coluna).</summary>
    public const string DefaultSpecialty = "Profissional";

    /// <summary>Versão do texto em <c>docs/legal/termo-profissional.md</c>. Rascunho, ainda sem revisão jurídica.</summary>
    public const string ProfessionalTermsVersion = "profissional-2026-11-rascunho";

    public Guid BusinessId { get; private set; }
    public string Email { get; private set; } = null!;
    public string InviteeName { get; private set; } = null!;
    public BusinessMembershipRole Role { get; private set; }
    public Guid? ProfessionalId { get; private set; }
    public Guid InvitedByUserId { get; private set; }

    /// <summary>
    /// Especialidade que o perfil de profissional leva ao nascer, no aceite. Só existe para <c>Professional</c>; o
    /// atendente não tem perfil, então qualquer valor enviado para ele é descartado. Nulo: <see cref="DefaultSpecialty"/>.
    /// </summary>
    public string? Specialty { get; private set; }

    public string TokenHash { get; private set; } = null!;
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset LastSentAt { get; private set; }
    public DateTimeOffset? AcceptedAt { get; private set; }
    public Guid? AcceptedUserId { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }

    /// <summary>Termo do profissional aceito no convite: versão e data, sem IP.</summary>
    public string? TermsVersion { get; private set; }
    public DateTimeOffset? TermsAcceptedAt { get; private set; }

    private BusinessInvitation()
    {
    }

    public static BusinessInvitation Create(
        Guid businessId,
        string email,
        string inviteeName,
        BusinessMembershipRole role,
        Guid? professionalId,
        Guid invitedByUserId,
        string tokenHash,
        DateTimeOffset now,
        string? specialty = null)
    {
        if (role == BusinessMembershipRole.Owner)
        {
            throw new DomainException("invitation.cannot_invite_as_owner");
        }

        if (role == BusinessMembershipRole.Attendant && professionalId is not null)
        {
            throw new DomainException("invitation.attendant_has_no_professional");
        }

        string name = (inviteeName ?? string.Empty).Trim();

        if (name.Length is 0 or > MaxNameLength)
        {
            throw new DomainException("invitation.name_invalid");
        }

        if (string.IsNullOrWhiteSpace(tokenHash))
        {
            throw new DomainException("invitation.token_hash_required");
        }

        // Atendente não tem perfil: a especialidade enviada para ele é ignorada, sem erro.
        string? cleanSpecialty = role == BusinessMembershipRole.Professional ? NormalizeSpecialty(specialty) : null;

        return new BusinessInvitation
        {
            BusinessId = businessId,
            Email = ValueObject.Email.Of(email).Address,
            InviteeName = name,
            Specialty = cleanSpecialty,
            Role = role,
            ProfessionalId = professionalId,
            InvitedByUserId = invitedByUserId,
            TokenHash = tokenHash,
            ExpiresAt = now.AddDays(LifetimeDays),
            LastSentAt = now,
        };
    }

    private static string? NormalizeSpecialty(string? specialty)
    {
        string? trimmed = specialty?.Trim();

        if (string.IsNullOrEmpty(trimmed))
        {
            return null;
        }

        if (trimmed.Length > MaxSpecialtyLength)
        {
            throw new DomainException("invitation.specialty_invalid");
        }

        return trimmed;
    }

    public InvitationState StateAt(DateTimeOffset now)
    {
        if (AcceptedAt is not null)
        {
            return InvitationState.Accepted;
        }

        if (RevokedAt is not null)
        {
            return InvitationState.Revoked;
        }

        return ExpiresAt <= now ? InvitationState.Expired : InvitationState.Pending;
    }

    /// <summary>Convite que ainda ocupa vaga e ainda pode ser aceito.</summary>
    public bool IsPending(DateTimeOffset now) => StateAt(now) == InvitationState.Pending;

    /// <summary>O Owner reenvia: novo token (o link antigo deixa de valer) e novo prazo. Só enquanto pendente ou expirado.</summary>
    public void Resend(string newTokenHash, DateTimeOffset now)
    {
        InvitationState state = StateAt(now);

        if (state is InvitationState.Accepted or InvitationState.Revoked)
        {
            throw new DomainException("invitation.cannot_resend_from_current_state");
        }

        if (string.IsNullOrWhiteSpace(newTokenHash))
        {
            throw new DomainException("invitation.token_hash_required");
        }

        TokenHash = newTokenHash;
        ExpiresAt = now.AddDays(LifetimeDays);
        LastSentAt = now;
    }

    public void Revoke(DateTimeOffset now)
    {
        if (AcceptedAt is not null)
        {
            throw new DomainException("invitation.cannot_revoke_accepted");
        }

        if (RevokedAt is not null)
        {
            throw new DomainException("invitation.cannot_revoke_already_revoked");
        }

        RevokedAt = now;
    }

    /// <summary>O e-mail da conta que aceita precisa ser o do convite, sem distinguir maiúsculas.</summary>
    public bool IsFor(string accountEmail) =>
        string.Equals(Email, ValueObject.Email.Of(accountEmail).Address, StringComparison.Ordinal);

    /// <summary>
    /// Aceite. Convite de profissional exige o termo (versão e data registradas); o de atendente não, porque
    /// atendente não tem perfil público.
    /// </summary>
    public void Accept(Guid userId, bool termsAccepted, DateTimeOffset now)
    {
        InvitationState state = StateAt(now);

        if (state != InvitationState.Pending)
        {
            throw new DomainException(state switch
            {
                InvitationState.Accepted => "invitation.already_used",
                InvitationState.Revoked => "invitation.revoked",
                _ => "invitation.expired",
            });
        }

        if (Role == BusinessMembershipRole.Professional)
        {
            if (!termsAccepted)
            {
                throw new DomainException("invitation.terms_required");
            }

            TermsVersion = ProfessionalTermsVersion;
            TermsAcceptedAt = now;
        }

        AcceptedAt = now;
        AcceptedUserId = userId;
    }
}
