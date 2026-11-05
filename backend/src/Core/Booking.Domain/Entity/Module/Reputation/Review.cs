using Booking.Domain.Entity.Base;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.Reputation;

/// <summary>
/// Avaliação de um agendamento concluído (ADR-032). Uma por agendamento, feita pelo próprio consumidor até 30 dias depois
/// de concluído, e editável uma vez em até 7 dias. Nota do atendimento de 1 a 5, nota opcional do profissional e comentário
/// opcional de até 500 caracteres.
/// </summary>
/// <remarks>
/// <b>Privacidade (LGPD):</b> o nome público é o primeiro nome e a inicial do sobrenome. Em Saúde (Art. 11) o serviço não
/// é guardado nem mostrado: a avaliação não revela o que a pessoa fez. Comentário é texto livre público: o formulário
/// avisa para não escrever dado de saúde, e ele nunca entra em log. Não há resposta do dono nem exclusão pelo consumidor
/// (limitação registrada); a moderação é do Admin (<see cref="Hide"/>).
/// </remarks>
public sealed class Review : BaseEntity, IAuditable, ITenantScoped
{
    public const int MinRating = 1;
    public const int MaxRating = 5;
    public const int MaxCommentLength = 500;
    public const int ReviewWindowDays = 30;
    public const int EditWindowDays = 7;
    public const int MinReportReasonLength = 5;

    public Guid BusinessId { get; private set; }
    public Guid AppointmentId { get; private set; }
    public Guid ProfessionalId { get; private set; }
    public Guid CustomerId { get; private set; }
    public int Rating { get; private set; }
    public int? ProfessionalRating { get; private set; }
    public string? Comment { get; private set; }
    public string ReviewerName { get; private set; } = null!;

    /// <summary>Nulo em estabelecimento de Saúde: a avaliação não diz qual serviço foi feito.</summary>
    public string? ServiceName { get; private set; }

    public bool IsSensitive { get; private set; }
    public DateTimeOffset ReviewedAt { get; private set; }
    public DateTimeOffset? EditedAt { get; private set; }

    // --- Moderação (bloco 4): oculta fica fora da lista pública e da média, e guarda quem decidiu ---
    public bool IsHidden { get; private set; }
    public Guid? HiddenByUserId { get; private set; }
    public DateTimeOffset? HiddenAt { get; private set; }
    public string? HiddenReason { get; private set; }

    // --- Denúncia do dono: abre a fila do Admin. O dono não oculta nem edita; quem decide é o Admin ---
    public Guid? ReportedByUserId { get; private set; }
    public DateTimeOffset? ReportedAt { get; private set; }
    public string? ReportReason { get; private set; }
    public DateTimeOffset? ReportClosedAt { get; private set; }

    public bool HasOpenReport => ReportedAt is not null && ReportClosedAt is null;

    private Review()
    {
    }

    public static Review Create(
        Guid businessId,
        Guid appointmentId,
        Guid professionalId,
        Guid customerId,
        int rating,
        int? professionalRating,
        string? comment,
        string reviewerName,
        string? serviceName,
        bool isSensitive,
        DateTimeOffset now)
    {
        Review review = new()
        {
            BusinessId = businessId,
            AppointmentId = appointmentId,
            ProfessionalId = professionalId,
            CustomerId = customerId,
            ReviewerName = reviewerName,
            ServiceName = isSensitive ? null : serviceName,
            IsSensitive = isSensitive,
            ReviewedAt = now,
        };

        review.Apply(rating, professionalRating, comment);
        return review;
    }

    /// <summary>Edita uma única vez, em até 7 dias da avaliação.</summary>
    public void Edit(int rating, int? professionalRating, string? comment, DateTimeOffset now)
    {
        if (EditedAt is not null)
        {
            throw new DomainException("review.already_edited");
        }

        if (now > ReviewedAt.AddDays(EditWindowDays))
        {
            throw new DomainException("review.edit_window_expired");
        }

        Apply(rating, professionalRating, comment);
        EditedAt = now;
    }

    public bool CanEdit(DateTimeOffset now) => EditedAt is null && now <= ReviewedAt.AddDays(EditWindowDays);

    /// <summary>O dono denuncia uma vez: de 5 a 500 caracteres de motivo. Nada some sozinho, a avaliação segue pública.</summary>
    public void Report(Guid ownerUserId, string reason, DateTimeOffset now)
    {
        if (ReportedAt is not null)
        {
            throw new DomainException("review.already_reported");
        }

        string text = (reason ?? string.Empty).Trim();

        if (text.Length is < MinReportReasonLength or > MaxCommentLength)
        {
            throw new DomainException("review.report_reason_invalid");
        }

        ReportedByUserId = ownerUserId;
        ReportedAt = now;
        ReportReason = text;
    }

    /// <summary>O Admin mantém a avaliação no ar e encerra a denúncia.</summary>
    public void DismissReport(DateTimeOffset now)
    {
        if (!HasOpenReport)
        {
            throw new DomainException("review.no_open_report");
        }

        ReportClosedAt = now;
    }

    public void Hide(Guid adminUserId, string reason, DateTimeOffset now)
    {
        if (IsHidden)
        {
            throw new DomainException("review.already_hidden");
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            throw new DomainException("review.hide_requires_reason");
        }

        IsHidden = true;
        HiddenByUserId = adminUserId;
        HiddenAt = now;
        HiddenReason = reason.Trim();

        if (HasOpenReport)
        {
            ReportClosedAt = now;
        }
    }

    public void Unhide(Guid adminUserId, DateTimeOffset now)
    {
        if (!IsHidden)
        {
            throw new DomainException("review.not_hidden");
        }

        IsHidden = false;
        HiddenByUserId = adminUserId; // fica registrado quem reexibiu
        HiddenAt = now;
    }

    /// <summary>"Ana Souza Lima" → "Ana S."; um nome só → "Ana". Nunca o nome completo.</summary>
    public static string DisplayNameOf(string fullName)
    {
        string[] parts = (fullName ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return parts.Length switch
        {
            0 => "Consumidor",
            1 => parts[0],
            _ => $"{parts[0]} {char.ToUpperInvariant(parts[1][0])}.",
        };
    }

    private void Apply(int rating, int? professionalRating, string? comment)
    {
        EnsureRating(rating);

        if (professionalRating is int professional)
        {
            EnsureRating(professional);
        }

        string? text = string.IsNullOrWhiteSpace(comment) ? null : comment.Trim();

        if (text is { Length: > MaxCommentLength })
        {
            throw new DomainException("review.comment_too_long");
        }

        Rating = rating;
        ProfessionalRating = professionalRating;
        Comment = text;
    }

    private static void EnsureRating(int value)
    {
        if (value is < MinRating or > MaxRating)
        {
            throw new DomainException("review.rating_invalid");
        }
    }
}
