using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.People;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.People;

/// <summary>
/// "Solicitar remoção deste perfil" na página pública do profissional (ADR-031). Não exige conta: quem pede pode ser o
/// próprio profissional sem login, ou qualquer pessoa. O dono recebe e-mail e o pedido cai na fila do Admin. Nada é
/// removido automaticamente: o dono desativa o perfil, ou o Admin resolve.
/// </summary>
/// <remarks>
/// Guarda o motivo e, se informado, o contato (dado pessoal: vai ao dono por e-mail e ao Admin, nunca para log). Nunca
/// guarda IP nem dado do aparelho. Fora do tenant: o Admin lê os de todos os estabelecimentos.
/// </remarks>
public sealed class ProfessionalRemovalRequest : BaseEntity, IAuditable
{
    public const int MinReasonLength = 5;
    public const int MaxReasonLength = 500;
    public const int MaxContactLength = 150;

    public Guid BusinessId { get; private set; }
    public Guid ProfessionalId { get; private set; }
    public string Reason { get; private set; } = null!;
    public string? Contact { get; private set; }
    public DateTimeOffset RequestedAt { get; private set; }
    public RemovalRequestStatus Status { get; private set; }
    public Guid? ResolvedByUserId { get; private set; }
    public DateTimeOffset? ResolvedAt { get; private set; }
    public string? Resolution { get; private set; }

    private ProfessionalRemovalRequest()
    {
    }

    public static ProfessionalRemovalRequest Create(
        Guid businessId, Guid professionalId, string reason, string? contact, DateTimeOffset now)
    {
        string trimmed = (reason ?? string.Empty).Trim();

        if (trimmed.Length is < MinReasonLength or > MaxReasonLength)
        {
            throw new DomainException("removal_request.reason_invalid");
        }

        string? contactTrimmed = string.IsNullOrWhiteSpace(contact) ? null : contact.Trim();

        if (contactTrimmed is { Length: > MaxContactLength })
        {
            throw new DomainException("removal_request.contact_too_long");
        }

        return new ProfessionalRemovalRequest
        {
            BusinessId = businessId,
            ProfessionalId = professionalId,
            Reason = trimmed,
            Contact = contactTrimmed,
            RequestedAt = now,
            Status = RemovalRequestStatus.Open,
        };
    }

    /// <summary>O Admin encerra o pedido, com a anotação do que decidiu (pode ser vazia).</summary>
    public void Resolve(Guid adminUserId, string? note, DateTimeOffset now)
    {
        if (Status != RemovalRequestStatus.Open)
        {
            throw new DomainException("removal_request.cannot_resolve_from_current_status");
        }

        Status = RemovalRequestStatus.Resolved;
        ResolvedByUserId = adminUserId;
        ResolvedAt = now;
        Resolution = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
    }
}
