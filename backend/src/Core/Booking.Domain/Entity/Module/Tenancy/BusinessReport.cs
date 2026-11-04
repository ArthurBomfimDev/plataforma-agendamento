using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.Tenancy;

/// <summary>
/// Denúncia feita na página pública de um estabelecimento (freio contra abuso). Cai numa fila do Admin, que a resolve
/// e fica registrado como quem decidiu e quando. Fora do tenant: o Admin lê as de todos os estabelecimentos.
/// </summary>
/// <remarks>
/// Guarda o motivo e, se a pessoa estava logada, a conta. Nunca guarda IP nem dado do aparelho. Quem denuncia sem conta
/// não é identificado.
/// </remarks>
public sealed class BusinessReport : BaseEntity, IAuditable
{
    public const int MinReasonLength = 5;
    public const int MaxReasonLength = 500;

    public Guid BusinessId { get; private set; }
    public string Reason { get; private set; } = null!;
    public Guid? ReporterUserId { get; private set; }
    public DateTimeOffset ReportedAt { get; private set; }
    public BusinessReportStatus Status { get; private set; }
    public Guid? ResolvedByUserId { get; private set; }
    public DateTimeOffset? ResolvedAt { get; private set; }
    public string? Resolution { get; private set; }

    private BusinessReport()
    {
    }

    public static BusinessReport Create(Guid businessId, string reason, Guid? reporterUserId, DateTimeOffset now)
    {
        string trimmed = (reason ?? string.Empty).Trim();

        if (trimmed.Length is < MinReasonLength or > MaxReasonLength)
        {
            throw new DomainException("report.reason_invalid");
        }

        return new BusinessReport
        {
            BusinessId = businessId,
            Reason = trimmed,
            ReporterUserId = reporterUserId,
            ReportedAt = now,
            Status = BusinessReportStatus.Open,
        };
    }

    /// <summary>O Admin encerra a denúncia, com a anotação do que decidiu (pode ser vazia).</summary>
    public void Resolve(Guid adminUserId, string? note, DateTimeOffset now)
    {
        if (Status != BusinessReportStatus.Open)
        {
            throw new DomainException("report.cannot_resolve_from_current_status");
        }

        Status = BusinessReportStatus.Resolved;
        ResolvedByUserId = adminUserId;
        ResolvedAt = now;
        Resolution = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
    }
}
